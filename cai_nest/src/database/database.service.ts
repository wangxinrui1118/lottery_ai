/**
 * 数据库服务 — 对应 ssq_python/database.py (DatabaseManager)
 * 使用 mysql2/promise 连接池，SSQ 和 DLT 分库存储
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import type { SSQRecord, DLTRecord, QueryConditions, Statistics, TableName } from '../types';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private ssqPool: mysql.Pool;
  private dltPool: mysql.Pool;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const base: mysql.PoolOptions = {
      host: this.config.get<string>('mysql.host'),
      port: this.config.get<number>('mysql.port'),
      user: this.config.get<string>('mysql.user'),
      password: this.config.get<string>('mysql.password'),
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
    };

    this.ssqPool = mysql.createPool({
      ...base,
      database: this.config.get<string>('mysql.database_ssq'),
    });
    this.logger.log(`SSQ 连接池已创建: ${base.host}:${base.port}/ssq_data`);

    this.dltPool = mysql.createPool({
      ...base,
      database: this.config.get<string>('mysql.database_dlt'),
    });
    this.logger.log(`DLT 连接池已创建: ${base.host}:${base.port}/dlt_data`);

    // 初始化表结构
    await this.initTables();
  }

  async onModuleDestroy() {
    await Promise.all([this.ssqPool.end(), this.dltPool.end()]);
    this.logger.log('MySQL 连接池已关闭');
  }

  /** 根据表名获取连接池 */
  private getPool(table: TableName): mysql.Pool {
    return table === 'lottery_ssq' ? this.ssqPool : this.dltPool;
  }

  // ---------- 表初始化 ----------

  private async initTables() {
    await this.createSSQTable();
    this.logger.log('lottery_ssq 表初始化完成');
    await this.createDLTTable();
    this.logger.log('lottery_dlt 表初始化完成');
  }

  private async createSSQTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS lottery_ssq (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
        draw_date DATE NOT NULL COMMENT '开奖日期',
        draw_issue VARCHAR(20) NOT NULL COMMENT '期号',
        red_1 TINYINT UNSIGNED NOT NULL, red_2 TINYINT UNSIGNED NOT NULL,
        red_3 TINYINT UNSIGNED NOT NULL, red_4 TINYINT UNSIGNED NOT NULL,
        red_5 TINYINT UNSIGNED NOT NULL, red_6 TINYINT UNSIGNED NOT NULL,
        blue TINYINT UNSIGNED NOT NULL,
        sales_amount DECIMAL(12,2) NULL COMMENT '销售额（万元）',
        pool_amount DECIMAL(12,2) NULL COMMENT '奖池金额（万元）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_draw_issue (draw_issue),
        KEY idx_draw_date (draw_date),
        KEY idx_red_1 (red_1), KEY idx_red_2 (red_2), KEY idx_red_3 (red_3),
        KEY idx_red_4 (red_4), KEY idx_red_5 (red_5), KEY idx_red_6 (red_6),
        KEY idx_blue (blue)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='双色球开奖历史'
    `;
    await this.ssqPool.execute(sql);
  }

  private async createDLTTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS lottery_dlt (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
        draw_date DATE NOT NULL COMMENT '开奖日期',
        draw_issue VARCHAR(20) NOT NULL COMMENT '期号',
        front_1 TINYINT UNSIGNED NOT NULL, front_2 TINYINT UNSIGNED NOT NULL,
        front_3 TINYINT UNSIGNED NOT NULL, front_4 TINYINT UNSIGNED NOT NULL,
        front_5 TINYINT UNSIGNED NOT NULL,
        back_1 TINYINT UNSIGNED NOT NULL, back_2 TINYINT UNSIGNED NOT NULL,
        sales_amount DECIMAL(12,2) NULL COMMENT '销售额（万元）',
        pool_amount DECIMAL(12,2) NULL COMMENT '奖池金额（万元）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_draw_issue (draw_issue),
        KEY idx_draw_date (draw_date),
        KEY idx_front_1 (front_1), KEY idx_front_2 (front_2), KEY idx_front_3 (front_3),
        KEY idx_front_4 (front_4), KEY idx_front_5 (front_5),
        KEY idx_back_1 (back_1), KEY idx_back_2 (back_2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='大乐透开奖历史'
    `;
    await this.dltPool.execute(sql);
  }

  // ---------- 插入操作 ----------

  async insertSSQ(data: SSQRecord): Promise<boolean> {
    return this.insert(
      this.ssqPool,
      `INSERT INTO lottery_ssq (draw_date, draw_issue, red_1, red_2, red_3,
         red_4, red_5, red_6, blue, sales_amount, pool_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         blue=VALUES(blue), sales_amount=VALUES(sales_amount),
         pool_amount=VALUES(pool_amount), updated_at=CURRENT_TIMESTAMP`,
      [
        data.draw_date, data.draw_issue,
        data.red_1, data.red_2, data.red_3,
        data.red_4, data.red_5, data.red_6,
        data.blue, data.sales_amount ?? null, data.pool_amount ?? null,
      ],
    );
  }

  async insertDLT(data: DLTRecord): Promise<boolean> {
    return this.insert(
      this.dltPool,
      `INSERT INTO lottery_dlt (draw_date, draw_issue, front_1, front_2, front_3,
         front_4, front_5, back_1, back_2, sales_amount, pool_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         back_1=VALUES(back_1), back_2=VALUES(back_2),
         sales_amount=VALUES(sales_amount), pool_amount=VALUES(pool_amount),
         updated_at=CURRENT_TIMESTAMP`,
      [
        data.draw_date, data.draw_issue,
        data.front_1, data.front_2, data.front_3,
        data.front_4, data.front_5,
        data.back_1, data.back_2,
        data.sales_amount ?? null, data.pool_amount ?? null,
      ],
    );
  }

  private async insert(pool: mysql.Pool, sql: string, params: any[]): Promise<boolean> {
    try {
      await pool.query(sql, params);
      return true;
    } catch (e) {
      this.logger.error(`插入失败: ${e}`);
      return false;
    }
  }

  // ---------- 查询操作 ----------

  async query(
    table: TableName,
    conditions: QueryConditions = {},
    limit: number = 100,
  ): Promise<any[]> {
    const pool = this.getPool(table);
    const { where, params } = this.buildWhereClause(table, conditions);

    const sql = `SELECT * FROM ${table} WHERE ${where} ORDER BY draw_date DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    return rows as any[];
  }

  private buildWhereClause(
    table: TableName,
    conditions: QueryConditions,
  ): { where: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];

    if (conditions.draw_issue) {
      clauses.push('draw_issue = ?');
      params.push(conditions.draw_issue);
    }
    if (conditions.draw_date_start) {
      clauses.push('draw_date >= ?');
      params.push(conditions.draw_date_start);
    }
    if (conditions.draw_date_end) {
      clauses.push('draw_date <= ?');
      params.push(conditions.draw_date_end);
    }
    if (conditions.blue !== undefined && table === 'lottery_ssq') {
      clauses.push('blue = ?');
      params.push(conditions.blue);
    }

    // 红球 (双色球) 或 前区 (大乐透)
    if (table === 'lottery_ssq' && conditions.red_balls?.length) {
      const ors: string[] = [];
      for (const ball of conditions.red_balls) {
        for (let i = 1; i <= 6; i++) {
          ors.push(`red_${i} = ?`);
          params.push(ball);
        }
      }
      clauses.push('(' + ors.join(' OR ') + ')');
    }
    if (table === 'lottery_dlt' && conditions.front_balls?.length) {
      const ors: string[] = [];
      for (const ball of conditions.front_balls) {
        for (let i = 1; i <= 5; i++) {
          ors.push(`front_${i} = ?`);
          params.push(ball);
        }
      }
      clauses.push('(' + ors.join(' OR ') + ')');
    }

    // 后区 (大乐透)
    if (table === 'lottery_dlt' && conditions.back_balls?.length) {
      const ors: string[] = [];
      for (const ball of conditions.back_balls) {
        for (let i = 1; i <= 2; i++) {
          ors.push(`back_${i} = ?`);
          params.push(ball);
        }
      }
      clauses.push('(' + ors.join(' OR ') + ')');
    }

    return {
      where: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
      params,
    };
  }

  // ---------- 统计 ----------

  async getStatistics(table: TableName): Promise<Statistics> {
    const pool = this.getPool(table);
    const stats: Statistics = {
      total_draws: 0,
      date_range: { start: null, end: null },
    };

    const [totalRows] = await pool.query(`SELECT COUNT(*) as total FROM ${table}`);
    stats.total_draws = (totalRows as any[])[0]?.total ?? 0;

    const [dateRows] = await pool.query(
      `SELECT MIN(draw_date) as min_date, MAX(draw_date) as max_date FROM ${table}`,
    );
    const dr = (dateRows as any[])[0];
    if (dr) {
      stats.date_range = {
        start: dr.min_date ? String(dr.min_date) : null,
        end: dr.max_date ? String(dr.max_date) : null,
      };
    }

    if (table === 'lottery_ssq') {
      // 红球频率
      const freq: Record<number, number> = {};
      for (let i = 1; i <= 6; i++) {
        const [rows] = await pool.query(
          `SELECT red_${i} as num, COUNT(*) as cnt FROM ${table} GROUP BY red_${i}`,
        );
        for (const row of rows as any[]) {
          freq[row.num] = (freq[row.num] || 0) + row.cnt;
        }
      }
      stats.red_frequency = Object.fromEntries(
        Object.entries(freq).sort(([a], [b]) => Number(a) - Number(b)),
      );
      // 蓝球频率
      const [blueRows] = await pool.query(
        `SELECT blue, COUNT(*) as cnt FROM ${table} GROUP BY blue ORDER BY blue`,
      );
      stats.blue_frequency = {};
      for (const row of blueRows as any[]) {
        stats.blue_frequency[row.blue] = row.cnt;
      }
    } else {
      // 前区频率
      const freq: Record<number, number> = {};
      for (let i = 1; i <= 5; i++) {
        const [rows] = await pool.query(
          `SELECT front_${i} as num, COUNT(*) as cnt FROM ${table} GROUP BY front_${i}`,
        );
        for (const row of rows as any[]) {
          freq[row.num] = (freq[row.num] || 0) + row.cnt;
        }
      }
      stats.front_frequency = Object.fromEntries(
        Object.entries(freq).sort(([a], [b]) => Number(a) - Number(b)),
      );
      // 后区频率
      const bfreq: Record<number, number> = {};
      for (let i = 1; i <= 2; i++) {
        const [rows] = await pool.query(
          `SELECT back_${i} as num, COUNT(*) as cnt FROM ${table} GROUP BY back_${i}`,
        );
        for (const row of rows as any[]) {
          bfreq[row.num] = (bfreq[row.num] || 0) + row.cnt;
        }
      }
      stats.back_frequency = Object.fromEntries(
        Object.entries(bfreq).sort(([a], [b]) => Number(a) - Number(b)),
      );
    }

    return stats;
  }
}
