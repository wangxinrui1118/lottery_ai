/** 双色球 & 大乐透 — 前端类型定义 */

export interface SSQRecord {
  id: number;
  draw_date: string;
  draw_issue: string;
  red_1: number; red_2: number; red_3: number;
  red_4: number; red_5: number; red_6: number;
  blue: number;
  sales_amount?: number;
  pool_amount?: number;
}

export interface DLTRecord {
  id: number;
  draw_date: string;
  draw_issue: string;
  front_1: number; front_2: number; front_3: number;
  front_4: number; front_5: number;
  back_1: number; back_2: number;
  sales_amount?: number;
  pool_amount?: number;
}

export interface Statistics {
  total_draws: number;
  date_range: { start: string | null; end: string | null };
  red_frequency?: Record<string, number>;
  blue_frequency?: Record<string, number>;
  front_frequency?: Record<string, number>;
  back_frequency?: Record<string, number>;
}

export interface Memory {
  id: string;
  content: string;
  kind: string;
  tags: string[];
  score: number;
}

export interface Conflict {
  similarity: number;
  memory_a: string;
  memory_b: string;
}

export interface TimelineEntry {
  id: string;
  content: string;
  kind: string;
  created_at: string;
  access_count: number;
}

export interface QueryResult {
  success: boolean;
  type: string;
  answer: string;
  data: any[];
  stats: Statistics | null;
  memories: Memory[];
  source: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: any;
}
