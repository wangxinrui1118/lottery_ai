/**
 * 记忆存储服务 — MySQL 自建表实现
 * 替代 ManasDB（Node.js 版本兼容性问题），使用同一 MySQL 实例
 *
 * 表 lottery_memories 存储在 ssq_data 库中
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import type { SSQRecord, DLTRecord, Memory, Conflict, TimelineEntry } from '../types';

@Injectable()
export class MemoryService implements OnModuleInit {
  private readonly logger = new Logger(MemoryService.name);
  private pool: mysql.Pool;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.pool = mysql.createPool({
      host: this.config.get<string>('mysql.host'),
      port: this.config.get<number>('mysql.port'),
      user: this.config.get<string>('mysql.user'),
      password: this.config.get<string>('mysql.password'),
      database: this.config.get<string>('mysql.database_ssq'),
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 5,
    });

    await this.initTable();
    this.logger.log('Memory 模块初始化完成 (MySQL: lottery_memories)');
  }

  private async initTable() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS lottery_memories (
        id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
        content TEXT NOT NULL COMMENT '记忆内容',
        kind VARCHAR(50) NOT NULL DEFAULT 'note' COMMENT '类型: insight/auto_analysis/note',
        tags JSON NULL COMMENT '标签数组',
        metadata JSON NULL COMMENT '扩展元数据',
        access_count INT UNSIGNED DEFAULT 0 COMMENT '访问次数',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_kind (kind),
        INDEX idx_created_at (created_at),
        FULLTEXT INDEX ft_content (content)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 记忆表'
    `);
  }

  // ========== 记忆存储 ==========

  /**
   * 存储记忆
   */
  async remember(
    content: string,
    kind: string,
    tags: string[] = [],
    metadata: Record<string, any> = {},
  ): Promise<string> {
    const id = randomUUID();
    const created_at = metadata['created_at'] || new Date().toISOString();

    await this.pool.query(
      `INSERT INTO lottery_memories (id, content, kind, tags, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        content,
        kind,
        JSON.stringify(tags),
        JSON.stringify({ ...metadata, created_at }),
        created_at,
      ],
    );

    this.logger.verbose(`记忆已存储: ${id.slice(0, 8)}... [${kind}]`);
    return id;
  }

  // ========== 语义召回 ==========

  /**
   * 召回记忆 — 使用 FULLTEXT 搜索 + 标签匹配
   */
  async recall(query: string, limit: number = 5): Promise<Memory[]> {
    try {
      const keywords = this.extractKeywords(query);

      let rows: any[];

      if (keywords.length > 0) {
        try {
          // FULLTEXT 布尔模式搜索 — 直接拼接（安全：关键词由系统提取）
          const ftQuery = keywords.map((k) => `+${k}*`).join(' ');
          const safeFt = this.pool.escape(ftQuery);
          const [results] = await this.pool.query(
            `SELECT id, content, kind, tags,
              MATCH(content) AGAINST(${safeFt} IN BOOLEAN MODE) AS score
             FROM lottery_memories
             WHERE MATCH(content) AGAINST(${safeFt} IN BOOLEAN MODE)
             ORDER BY score DESC
             LIMIT ?`,
            [limit],
          );
          rows = results as any[];
        } catch {
          // FULLTEXT 失败（表为空或无匹配）— 回退到 LIKE
          const likePattern = `%${keywords[0]}%`;
          const [results] = await this.pool.query(
            `SELECT id, content, kind, tags, 0.5 AS score
             FROM lottery_memories
             WHERE content LIKE ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [likePattern, limit],
          );
          rows = results as any[];
        }
      } else {
        // 无关键词时返回最近记忆
        const [results] = await this.pool.query(
          `SELECT id, content, kind, tags FROM lottery_memories
           ORDER BY created_at DESC LIMIT ?`,
          [limit],
        );
        rows = (results as any[]).map((r: any) => ({ ...r, score: 0.5 }));
      }

      // 更新访问计数
      for (const row of rows) {
        await this.pool
          .execute(
            `UPDATE lottery_memories SET access_count = access_count + 1 WHERE id = ?`,
            [row.id],
          )
          .catch(() => {});
      }

      return rows.map((r: any) => ({
        id: r.id,
        content: r.content,
        kind: r.kind,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || [],
        score: Number(r.score) || 0,
      }));
    } catch (e) {
      this.logger.warn(`recall 出错: ${e}`);
      return [];
    }
  }

  // ========== 自动分析 ==========

  /**
   * 自动生成 SSQ/DLT 分析并存储
   */
  async addSSQAnalysis(item: SSQRecord | DLTRecord): Promise<string> {
    let analysis = '';

    if ('red_1' in item) {
      const reds = [
        item.red_1, item.red_2, item.red_3,
        item.red_4, item.red_5, item.red_6,
      ];
      const parity = reds.filter((r) => r % 2 === 0).length;
      const odd = 6 - parity;
      const sum = reds.reduce((a, b) => a + b, 0);
      analysis =
        `双色球第${item.draw_issue}期 (${item.draw_date}): ` +
        `红球${reds.join(' ')}，蓝球${String(item.blue).padStart(2, '0')}。` +
        `奇偶比${odd}:${parity}，红球和值${sum}。`;
      if (item.pool_amount) analysis += `奖池${item.pool_amount}万元。`;
    } else {
      const fronts = [
        item.front_1, item.front_2, item.front_3,
        item.front_4, item.front_5,
      ];
      const backs = [item.back_1, item.back_2];
      const parity = fronts.filter((f) => f % 2 === 0).length;
      const odd = 5 - parity;
      const fsum = fronts.reduce((a, b) => a + b, 0);
      analysis =
        `大乐透第${item.draw_issue}期 (${item.draw_date}): ` +
        `前区${fronts.join(' ')}，后区${backs.join(' ')}。` +
        `前区奇偶比${odd}:${parity}，前区和值${fsum}。`;
      if (item.pool_amount) analysis += `奖池${item.pool_amount}万元。`;
    }

    return this.remember(analysis, 'auto_analysis', ['lottery', 'analysis'], {
      source: 'crawler',
      draw_issue: item.draw_issue,
      created_at: new Date().toISOString(),
    });
  }

  // ========== 冲突检测 ==========

  /**
   * 检测记忆冲突 — 查找内容高度相似（>95%）的记忆对
   */
  async detectConflicts(threshold: number = 0.95): Promise<Conflict[]> {
    try {
      const [rows] = (await this.pool.query(
        `SELECT a.id AS id_a, a.content AS content_a,
                b.id AS id_b, b.content AS content_b
         FROM lottery_memories a
         JOIN lottery_memories b ON a.id < b.id AND a.kind = b.kind
         WHERE MATCH(a.content) AGAINST(b.content IN BOOLEAN MODE)
         LIMIT 50`,
      )) as any;

      const conflicts: Conflict[] = [];
      for (const row of rows) {
        const similarity = this.textSimilarity(
          row.content_a || '',
          row.content_b || '',
        );
        if (similarity >= threshold) {
          conflicts.push({
            similarity,
            memory_a: (row.content_a || '').slice(0, 300),
            memory_b: (row.content_b || '').slice(0, 300),
          });
        }
      }
      return conflicts;
    } catch (e) {
      this.logger.warn(`冲突检测出错: ${e}`);
      return [];
    }
  }

  // ========== 时间线 ==========

  /**
   * 获取记忆时间线 — 按时间倒序
   */
  async timeline(limit: number = 100): Promise<TimelineEntry[]> {
    try {
      const [rows] = await this.pool.query(
        `SELECT id, content, kind, created_at, access_count
         FROM lottery_memories
         ORDER BY created_at DESC
         LIMIT ?`,
        [String(limit)],
      );

      return (rows as any[]).map((r) => ({
        id: r.id,
        content: r.content,
        kind: r.kind,
        created_at:
          r.created_at instanceof Date
            ? r.created_at.toISOString()
            : String(r.created_at),
        access_count: Number(r.access_count) || 0,
      }));
    } catch (e) {
      this.logger.warn(`时间线查询出错: ${e}`);
      return [];
    }
  }

  // ========== 工具方法 ==========

  /** 提取中文关键词 */
  private extractKeywords(text: string): string[] {
    // 提取中文词组（2-4字）和数字
    const words: string[] = [];
    // 中文词组
    const cnMatches = text.match(/[一-龥]{2,4}/g);
    if (cnMatches) words.push(...cnMatches);
    // 数字
    const numMatches = text.match(/\d+/g);
    if (numMatches) words.push(...numMatches);
    // 英文单词
    const enMatches = text.match(/[a-zA-Z]{2,}/g);
    if (enMatches) words.push(...enMatches);

    // 去重、过滤停用词
    const stopWords = new Set([
      '什么', '怎么', '为什么', '哪里', '哪个', '多少', '可以', '是否', '有没有',
      '这个', '那个', '一下', '一个', '一些', '这个', '这里', '这样', '现在',
    ]);
    return [...new Set(words.filter((w) => !stopWords.has(w)))].slice(0, 10);
  }

  /** 简单的 Jaccard 文本相似度 */
  private textSimilarity(a: string, b: string): number {
    const charsA = new Set(a.replace(/\s/g, ''));
    const charsB = new Set(b.replace(/\s/g, ''));
    if (charsA.size === 0 && charsB.size === 0) return 0;

    const intersection = new Set([...charsA].filter((c) => charsB.has(c)));
    const union = new Set([...charsA, ...charsB]);

    // 长度比例作为补充
    const lenA = a.length;
    const lenB = b.length;
    const lengthRatio = Math.min(lenA, lenB) / Math.max(lenA, lenB);

    // 综合得分：Jaccard 40% + 长度比 30% + 内容包含 30%
    const jaccard = intersection.size / union.size;
    const contains =
      lenA > 0 && lenB > 0 && (a.includes(b.slice(0, 50)) || b.includes(a.slice(0, 50)))
        ? 1
        : 0;

    return jaccard * 0.4 + lengthRatio * 0.3 + contains * 0.3;
  }
}
