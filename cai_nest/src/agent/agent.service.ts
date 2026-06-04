/**
 * AI 智能体服务 — 对应 ssq_python/ai_agent.py (SSQAgent)
 * LLM 理解意图 → 路由到 MySQL (数据) 或 ManasDB (记忆) → 生成回答
 */
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MemoryService } from '../memory/memory.service';
import { LLMService } from '../llm/llm.service';
import type {
  QueryResult,
  QueryConditions,
  Memory,
  Conflict,
  TimelineEntry,
  Statistics,
  TableName,
} from '../types';

// ---------- System Prompts ----------

const SYSTEM_PROMPT = `你是一个专业的中国彩票（双色球&大乐透）数据分析助手。

你的能力：
1. 查询历史开奖数据（MySQL 存储）
2. 搜索 AI 记忆库中的分析笔记（ManasDB）
3. 基于数据给出专业分析

回复规则：
- 简洁专业，用中文
- 如果查询的是数据类问题（某期号码、出现次数等），告知用户从 MySQL 查到结果
- 如果查询的是规律/趋势/分析类问题，结合 ManasDB 记忆给出见解
- 不要编造任何号码或数据`;

const QUERY_CLASSIFY_PROMPT = `判断用户查询类型，只回答一个词：

- "data" → 查询具体数据（某期号码、某个号码出现次数、统计等）
- "memory" → 查询规律/趋势/分析/方法/知识

用户查询: {query}

只回答 data 或 memory:`;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private db: DatabaseService,
    private memory: MemoryService,
    private llm: LLMService,
  ) {}

  /**
   * 处理用户查询 — 主入口
   */
  async processQuery(query: string): Promise<QueryResult> {
    // Step 1: LLM 判断查询类型
    const queryType = await this.classifyQuery(query);
    this.logger.log(`查询分类: ${queryType} | ${query}`);

    // Step 2: 根据类型检索数据
    let data: any[] = [];
    let stats: Statistics | null = null;
    let memories: Memory[] = [];

    if (queryType === 'data') {
      const { table, conditions } = this.parseConditions(query);
      data = await this.db.query(table, conditions, 30);
      stats = await this.db.getStatistics(table);
    } else {
      memories = await this.memory.recall(query, 5);
    }

    // Step 3: LLM 生成回答
    const answer = await this.generateAnswer(
      query,
      queryType,
      data,
      stats,
      memories,
    );

    return {
      success: true,
      type: queryType === 'data' ? 'data_query' : 'memory_query',
      answer,
      data,
      stats,
      memories,
      source: `LLM (${this.llm['model'] || 'Ollama'}) + ${queryType === 'data' ? 'MySQL' : 'MySQL Memory'}`,
    };
  }

  // ---------- 查询分类 ----------

  private async classifyQuery(query: string): Promise<'data' | 'memory'> {
    try {
      const result = await this.llm.chat(
        '只回答 data 或 memory。不要解释。',
        `用户查询: ${query}\n答:`,
        0.1,
      );
      const trimmed = result.trim().toLowerCase();
      return trimmed.includes('data') ? 'data' : 'memory';
    } catch {
      // 回退到关键词匹配
      for (const kw of ['查询', '统计', '多少期', '包含', '出现', '频率', '几期']) {
        if (query.includes(kw)) return 'data';
      }
      return 'memory';
    }
  }

  // ---------- 条件解析 ----------

  private parseConditions(query: string): {
    table: TableName;
    conditions: QueryConditions;
  } {
    const isDLT = /大乐透|前区|后区/.test(query);
    const table: TableName = isDLT ? 'lottery_dlt' : 'lottery_ssq';
    const conditions: QueryConditions = {};

    // 期号
    const issueMatch = query.match(/(\d{5,7})/);
    if (issueMatch) {
      conditions.draw_issue = issueMatch[1];
    }

    // 红球/前区号码
    const ballMatches = query.matchAll(/(?:红球|前区)?\s*(\d{1,2})\s*(?:号球)?/g);
    const balls: number[] = [];
    for (const m of ballMatches) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 35 && !balls.includes(n)) {
        balls.push(n);
      }
    }
    if (balls.length > 0) {
      if (isDLT) {
        conditions.front_balls = balls.slice(0, 5);
      } else {
        conditions.red_balls = balls.slice(0, 6);
      }
    }

    // 蓝球/后区
    const blueMatch = query.match(/(?:蓝球|后区)\s*(\d{1,2})/);
    if (blueMatch) {
      const num = parseInt(blueMatch[1], 10);
      if (num >= 1 && num <= 16) {
        if (isDLT) {
          conditions.back_balls = [num];
        } else {
          conditions.blue = num;
        }
      }
    }

    return { table, conditions };
  }

  // ---------- 回答生成 ----------

  private async generateAnswer(
    query: string,
    qtype: string,
    data: any[],
    stats: Statistics | null,
    memories: Memory[],
  ): Promise<string> {
    const contextParts: string[] = [`查询: ${query}`];

    // 数据
    if (data.length > 0) {
      contextParts.push(`\nMySQL 数据（共${data.length}条，展示前10条）:`);
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        const row = data[i];
        if ('red_1' in row) {
          const reds = Array.from({ length: 6 }, (_, j) =>
            String(row[`red_${j + 1}`]).padStart(2, '0'),
          );
          contextParts.push(
            `${i + 1}. ${row.draw_issue} ${row.draw_date} 红球${reds.join(' ')} 蓝球${String(row.blue).padStart(2, '0')}`,
          );
        } else {
          const fronts = Array.from({ length: 5 }, (_, j) =>
            String(row[`front_${j + 1}`]).padStart(2, '0'),
          );
          const backs = Array.from({ length: 2 }, (_, j) =>
            String(row[`back_${j + 1}`]).padStart(2, '0'),
          );
          contextParts.push(
            `${i + 1}. ${row.draw_issue} ${row.draw_date} 前区${fronts.join(' ')} 后区${backs.join(' ')}`,
          );
        }
      }
    }

    // 统计
    if (stats) {
      contextParts.push(`\n统计: 总计${stats.total_draws}期`);
    }

    // ManasDB 记忆
    if (memories.length > 0) {
      contextParts.push(`\nManasDB 记忆（${memories.length}条）:`);
      for (let i = 0; i < memories.length; i++) {
        const m = memories[i];
        contextParts.push(
          `${i + 1}. [${m.kind}] ${m.content.slice(0, 200)}`,
        );
      }
    }

    const context = contextParts.join('\n');

    // LLM 生成
    try {
      const answer = await this.llm.chat(
        SYSTEM_PROMPT,
        `基于以下数据回答用户问题。${context}`,
        qtype === 'data' ? 0.3 : 0.7,
      );
      if (answer) return answer;
    } catch (e) {
      this.logger.error(`LLM 生成回答失败: ${e}`);
    }

    // Fallback
    return this.formatFallback(query, data, memories);
  }

  private formatFallback(
    query: string,
    data: any[],
    memories: Memory[],
  ): string {
    if (data.length > 0) {
      const lines = [`共 ${data.length} 条记录：`];
      for (const row of data.slice(0, 5)) {
        lines.push(`  ${row.draw_issue} ${row.draw_date}`);
      }
      return lines.join('\n');
    }
    if (memories.length > 0) {
      const lines = [`找到 ${memories.length} 条相关记忆：`];
      for (const m of memories) {
        lines.push(`  - ${m.content.slice(0, 100)}...`);
      }
      return lines.join('\n');
    }
    return '记忆中暂无相关信息。';
  }

  // ---------- 记忆管理 (委托给 MemoryService) ----------

  async addInsight(content: string, tags: string[] = []): Promise<string> {
    return this.memory.remember(content, 'insight', tags, {
      source: 'user_input',
      created_at: new Date().toISOString(),
    });
  }

  async checkMemoryConflicts(): Promise<Conflict[]> {
    return this.memory.detectConflicts();
  }

  async getMemoryTimeline(): Promise<TimelineEntry[]> {
    return this.memory.timeline();
  }

  // ---------- 流式查询 (SSE) ----------

  /**
   * 流式处理用户查询 — 用于 SSE 端点
   * 1. 先发送 meta 事件（分类、来源）
   * 2. 再逐 token 流式发送 LLM 回答
   */
  async *streamQuery(query: string): AsyncGenerator<{ event: string; data: any }> {
    // Step 1: 分类
    const queryType = await this.classifyQuery(query);
    this.logger.log(`[SSE] 查询分类: ${queryType} | ${query}`);

    // Step 2: 检索
    let data: any[] = [];
    let stats: any = null;
    let memories: Memory[] = [];

    if (queryType === 'data') {
      const { table, conditions } = this.parseConditions(query);
      data = await this.db.query(table, conditions, 30);
      stats = await this.db.getStatistics(table);
    } else {
      memories = await this.memory.recall(query, 5);
    }

    // Step 3: 构建上下文
    const contextParts: string[] = [`查询: ${query}`];

    if (data.length > 0) {
      contextParts.push(`\nMySQL 数据（共${data.length}条，展示前10条）:`);
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        const row = data[i];
        if ('red_1' in row) {
          const reds = Array.from({ length: 6 }, (_, j) =>
            String(row[`red_${j + 1}`]).padStart(2, '0'),
          );
          contextParts.push(
            `${i + 1}. ${row.draw_issue} ${row.draw_date} 红球${reds.join(' ')} 蓝球${String(row.blue).padStart(2, '0')}`,
          );
        } else {
          const fronts = Array.from({ length: 5 }, (_, j) =>
            String(row[`front_${j + 1}`]).padStart(2, '0'),
          );
          const backs = Array.from({ length: 2 }, (_, j) =>
            String(row[`back_${j + 1}`]).padStart(2, '0'),
          );
          contextParts.push(
            `${i + 1}. ${row.draw_issue} ${row.draw_date} 前区${fronts.join(' ')} 后区${backs.join(' ')}`,
          );
        }
      }
    }

    if (stats) {
      contextParts.push(`\n统计: 总计${stats.total_draws}期`);
    }

    if (memories.length > 0) {
      contextParts.push(`\nMySQL 记忆（${memories.length}条）:`);
      for (let i = 0; i < memories.length; i++) {
        contextParts.push(`${i + 1}. [${memories[i].kind}] ${memories[i].content.slice(0, 200)}`);
      }
    }

    const context = contextParts.join('\n');
    const temperature = queryType === 'data' ? 0.3 : 0.7;

    // Step 4: 发送 meta 事件
    yield {
      event: 'meta',
      data: {
        type: queryType === 'data' ? 'data_query' : 'memory_query',
        source: `LLM (${this.llm['model'] || 'Ollama'}) + ${queryType === 'data' ? 'MySQL' : 'MySQL Memory'}`,
        dataCount: data.length,
        memoryCount: memories.length,
      },
    };

    // Step 5: 流式发送 LLM 回答
    let fullAnswer = '';
    try {
      for await (const delta of this.llm.chatStream(
        SYSTEM_PROMPT,
        `基于以下数据回答用户问题。${context}`,
        temperature,
      )) {
        if (delta) {
          fullAnswer += delta;
          yield { event: 'token', data: delta };
        }
      }
    } catch (e) {
      this.logger.error(`SSE 流式生成失败: ${e}`);
      if (!fullAnswer) {
        fullAnswer = this.formatFallback(query, data, memories);
        yield { event: 'token', data: fullAnswer };
      }
    }

    // Step 6: 发送完成事件
    yield {
      event: 'done',
      data: {
        success: true,
        type: queryType === 'data' ? 'data_query' : 'memory_query',
        answer: fullAnswer,
        source: `LLM (${this.llm['model'] || 'Ollama'}) + ${queryType === 'data' ? 'MySQL' : 'MySQL Memory'}`,
      },
    };
  }
}
