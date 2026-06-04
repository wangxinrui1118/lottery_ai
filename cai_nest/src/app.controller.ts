/**
 * 主控制器 — 对应 ssq_python/main.py FastAPI 路由
 * 9 个 REST 端点，与 Python 版完全一致
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AgentService } from './agent/agent.service';
import { DatabaseService } from './database/database.service';
import { CrawlerService } from './crawler/crawler.service';
import { MemoryService } from './memory/memory.service';
import { QueryRequest } from './dto/query.dto';
import { InsightRequest } from './dto/insight.dto';
import { CrawlRequest } from './dto/crawl.dto';
import type { CrawlResult, TableName } from './types';

@Controller()
export class AppController {
  constructor(
    private readonly agent: AgentService,
    private readonly db: DatabaseService,
    private readonly crawler: CrawlerService,
    private readonly memory: MemoryService,
  ) {}

  /** GET / — 系统信息 */
  @Get()
  getRoot() {
    return {
      name: '双色球 & 大乐透 AI 智能体知识库系统',
      version: '2.0.0',
      architecture: 'MySQL + MySQL Memory',
      tech: 'NestJS + Vue3',
      endpoints: {
        'POST /query': '智能问答',
        'POST /insight/add': '添加分析见解',
        'GET /memory/conflicts': '检测记忆矛盾',
        'GET /memory/timeline': '记忆时间线',
        'POST /crawl/ssq': '爬取双色球',
        'POST /crawl/dlt': '爬取大乐透',
        'GET /stats/ssq': '双色球统计',
        'GET /stats/dlt': '大乐透统计',
      },
    };
  }

  /** POST /query — 智能问答 */
  @Post('query')
  async query(@Body() req: QueryRequest) {
    try {
      return await this.agent.processQuery(req.query);
    } catch (e) {
      throw new HttpException(
        (e as Error).message || '查询失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** POST /query/stream — 流式智能问答 (SSE) */
  @Post('query/stream')
  async queryStream(@Body() req: QueryRequest, @Res() res: Response) {
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      for await (const chunk of this.agent.streamQuery(req.query)) {
        res.write(`event: ${chunk.event}\n`);
        res.write(`data: ${JSON.stringify(chunk.data)}\n\n`);
      }
    } catch (e) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: (e as Error).message || '查询失败' })}\n\n`);
    }

    res.end();
  }

  /** POST /insight/add — 添加分析见解 */
  @Post('insight/add')
  async addInsight(@Body() req: InsightRequest) {
    try {
      const memoryId = await this.agent.addInsight(req.content, req.tags);
      return { success: true, memory_id: memoryId, message: '见解已存储' };
    } catch (e) {
      throw new HttpException(
        (e as Error).message || '添加见解失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** GET /memory/conflicts — 检测记忆矛盾 */
  @Get('memory/conflicts')
  async memoryConflicts() {
    const conflicts = await this.agent.checkMemoryConflicts();
    return { success: true, conflicts, count: conflicts.length };
  }

  /** GET /memory/timeline — 记忆时间线 */
  @Get('memory/timeline')
  async memoryTimeline() {
    const timeline = await this.agent.getMemoryTimeline();
    return { success: true, timeline, count: timeline.length };
  }

  /** POST /crawl/ssq — 爬取双色球 */
  @Post('crawl/ssq')
  async crawlSSQ(@Body() req: CrawlRequest): Promise<CrawlResult> {
    const data = await this.crawler.fetchLatestSSQ(req.count || 30);
    return this.storeCrawlResult(data, 'ssq');
  }

  /** POST /crawl/dlt — 爬取大乐透 */
  @Post('crawl/dlt')
  async crawlDLT(@Body() req: CrawlRequest): Promise<CrawlResult> {
    const data = await this.crawler.fetchLatestDLT(req.count || 30);
    return this.storeCrawlResult(data, 'dlt');
  }

  /** GET /stats/ssq — 双色球统计 */
  @Get('stats/ssq')
  async statsSSQ() {
    const stats = await this.db.getStatistics('lottery_ssq');
    return { success: true, statistics: stats };
  }

  /** GET /stats/dlt — 大乐透统计 */
  @Get('stats/dlt')
  async statsDLT() {
    const stats = await this.db.getStatistics('lottery_dlt');
    return { success: true, statistics: stats };
  }

  // ---------- 内部辅助 ----------

  private async storeCrawlResult(
    data: any[],
    lottoType: string,
  ): Promise<CrawlResult> {
    const table: TableName =
      lottoType === 'ssq' ? 'lottery_ssq' : 'lottery_dlt';
    const insertFn =
      lottoType === 'ssq'
        ? (item: any) => this.db.insertSSQ(item)
        : (item: any) => this.db.insertDLT(item);

    let success = 0;
    for (const item of data) {
      if (await insertFn(item)) success++;
    }

    // 生成 ManasDB 记忆（只记最新 50 期）
    try {
      for (const item of data.slice(0, 50)) {
        await this.memory.addSSQAnalysis(item);
      }
    } catch (e) {
      // 非致命
    }

    const name = lottoType === 'ssq' ? '双色球' : '大乐透';
    return {
      success: true,
      fetched: data.length,
      stored: success,
      lotto_type: lottoType,
      message: `${name}: 爬取 ${data.length} 条，存储 ${success} 条`,
    };
  }
}
