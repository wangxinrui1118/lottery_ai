/**
 * 双色球 & 大乐透 — 共享类型定义
 */

/** 双色球开奖记录 */
export interface SSQRecord {
  draw_date: string;
  draw_issue: string;
  red_1: number;
  red_2: number;
  red_3: number;
  red_4: number;
  red_5: number;
  red_6: number;
  blue: number;
  sales_amount?: number;
  pool_amount?: number;
}

/** 大乐透开奖记录 */
export interface DLTRecord {
  draw_date: string;
  draw_issue: string;
  front_1: number;
  front_2: number;
  front_3: number;
  front_4: number;
  front_5: number;
  back_1: number;
  back_2: number;
  sales_amount?: number;
  pool_amount?: number;
}

/** 数据库查询条件 */
export interface QueryConditions {
  draw_issue?: string;
  draw_date_start?: string;
  draw_date_end?: string;
  blue?: number;
  red_balls?: number[];
  front_balls?: number[];
  back_balls?: number[];
}

/** 统计信息 */
export interface Statistics {
  total_draws: number;
  date_range: { start: string | null; end: string | null };
  red_frequency?: Record<number, number>;
  blue_frequency?: Record<number, number>;
  front_frequency?: Record<number, number>;
  back_frequency?: Record<number, number>;
}

/** 记忆条目 */
export interface Memory {
  id: string;
  content: string;
  kind: string;
  tags: string[];
  score: number;
}

/** 记忆冲突 */
export interface Conflict {
  similarity: number;
  memory_a: string;
  memory_b: string;
}

/** 记忆时间线条目 */
export interface TimelineEntry {
  id: string;
  content: string;
  kind: string;
  created_at: string;
  access_count: number;
}

/** AI 查询结果 */
export interface QueryResult {
  success: boolean;
  type: string;
  answer: string;
  data: SSQRecord[] | DLTRecord[];
  stats: Statistics;
  memories: Memory[];
  source: string;
}

/** 爬取结果 */
export interface CrawlResult {
  success: boolean;
  fetched: number;
  stored: number;
  lotto_type: string;
  message: string;
}

/** 彩票类型 */
export type LottoType = 'ssq' | 'dlt';

/** 数据库表名 */
export type TableName = 'lottery_ssq' | 'lottery_dlt';
