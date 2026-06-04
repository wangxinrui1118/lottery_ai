/**
 * 数据爬取服务 — 对应 ssq_python/crawler.py (SSQCrawler + DLTCrawler)
 * 从 500.com 数据 API 爬取历史开奖数据
 */
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import type { SSQRecord, DLTRecord } from '../types';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly session: AxiosInstance;

  constructor() {
    this.session = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://datachart.500.com/',
      },
      timeout: 15000,
    });
  }

  // ========== 双色球 (SSQ) ==========

  async fetchSSQByRange(start: string, end: string): Promise<SSQRecord[]> {
    const url = 'https://datachart.500.com/ssq/history/newinc/history.php';
    try {
      const resp = await this.session.get(url, { params: { start, end } });
      const html = typeof resp.data === 'string' ? resp.data : String(resp.data);
      const data = this.parseSSQHtml(html);
      this.logger.log(`SSQ 爬取: ${start}~${end}, ${data.length} 条`);
      return data;
    } catch (e) {
      this.logger.error(`SSQ 爬取失败 [${start}~${end}]: ${e}`);
      return [];
    }
  }

  async fetchLatestSSQ(count: number = 30): Promise<SSQRecord[]> {
    const today = new Date();
    const current = this.dateToIssue(today, 153);
    const start = this.dateToIssue(
      new Date(today.getTime() - count * 3.5 * 86400000),
      153,
    );
    return this.fetchSSQByRange(start, current);
  }

  async fetchAllSSQ(delay: number = 1.0): Promise<SSQRecord[]> {
    const today = new Date();
    const allData: SSQRecord[] = [];
    for (let year = 2003; year <= today.getFullYear(); year++) {
      const s = `${String(year % 100).padStart(2, '0')}001`;
      const e = `${String(year % 100).padStart(2, '0')}160`;
      this.logger.log(`SSQ ${year} 年 (${s}~${e})...`);
      allData.push(...(await this.fetchSSQByRange(s, e)));
      if (year < today.getFullYear()) {
        await this.sleep(delay * 1000);
      }
    }
    this.logger.log(`SSQ 全量完成: ${allData.length} 条`);
    return allData;
  }

  // ========== 大乐透 (DLT) ==========

  async fetchDLTByRange(start: string, end: string): Promise<DLTRecord[]> {
    const url = 'https://datachart.500.com/dlt/history/newinc/history.php';
    try {
      const resp = await this.session.get(url, { params: { start, end } });
      const html = typeof resp.data === 'string' ? resp.data : String(resp.data);
      const data = this.parseDLTHtml(html);
      this.logger.log(`DLT 爬取: ${start}~${end}, ${data.length} 条`);
      return data;
    } catch (e) {
      this.logger.error(`DLT 爬取失败 [${start}~${end}]: ${e}`);
      return [];
    }
  }

  async fetchLatestDLT(count: number = 30): Promise<DLTRecord[]> {
    const today = new Date();
    const current = this.dateToIssue(today, 153);
    const start = this.dateToIssue(
      new Date(today.getTime() - count * 3.5 * 86400000),
      153,
    );
    return this.fetchDLTByRange(start, current);
  }

  async fetchAllDLT(delay: number = 1.0): Promise<DLTRecord[]> {
    const today = new Date();
    const allData: DLTRecord[] = [];
    for (let year = 2007; year <= today.getFullYear(); year++) {
      const s = `${String(year % 100).padStart(2, '0')}001`;
      const e = `${String(year % 100).padStart(2, '0')}160`;
      this.logger.log(`DLT ${year} 年 (${s}~${e})...`);
      allData.push(...(await this.fetchDLTByRange(s, e)));
      if (year < today.getFullYear()) {
        await this.sleep(delay * 1000);
      }
    }
    this.logger.log(`DLT 全量完成: ${allData.length} 条`);
    return allData;
  }

  // ========== HTML 解析 ==========

  private parseSSQHtml(html: string): SSQRecord[] {
    const results: SSQRecord[] = [];
    const $ = cheerio.load(html);

    $('tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr).find('td').each((__, td) => {
        cells.push($(td).text().trim());
      });

      // SSQ table: 17 columns minimum
      if (cells.length < 16) return;
      if (!cells[1] || !/^\d{5}$/.test(cells[1])) return;

      try {
        results.push({
          draw_issue: this.fullIssue(cells[1]),
          draw_date: cells[16],
          red_1: parseInt(cells[2], 10),
          red_2: parseInt(cells[3], 10),
          red_3: parseInt(cells[4], 10),
          red_4: parseInt(cells[5], 10),
          red_5: parseInt(cells[6], 10),
          red_6: parseInt(cells[7], 10),
          blue: parseInt(cells[8], 10),
          pool_amount: Math.round(this.parseNum(cells[10]) / 10000 * 100) / 100,
          sales_amount: Math.round(this.parseNum(cells[15]) / 10000 * 100) / 100,
        });
      } catch {
        // skip malformed rows
      }
    });

    return results;
  }

  private parseDLTHtml(html: string): DLTRecord[] {
    const results: DLTRecord[] = [];
    const $ = cheerio.load(html);

    $('tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr).find('td').each((__, td) => {
        cells.push($(td).text().trim());
      });

      // DLT table: 16 columns minimum
      if (cells.length < 15) return;
      if (!cells[1] || !/^\d{5}$/.test(cells[1])) return;

      try {
        results.push({
          draw_issue: this.fullIssue(cells[1]),
          draw_date: cells[15],
          front_1: parseInt(cells[2], 10),
          front_2: parseInt(cells[3], 10),
          front_3: parseInt(cells[4], 10),
          front_4: parseInt(cells[5], 10),
          front_5: parseInt(cells[6], 10),
          back_1: parseInt(cells[7], 10),
          back_2: parseInt(cells[8], 10),
          pool_amount: Math.round(this.parseNum(cells[9]) / 10000 * 100) / 100,
          sales_amount: Math.round(this.parseNum(cells[14]) / 10000 * 100) / 100,
        });
      } catch {
        // skip malformed rows
      }
    });

    return results;
  }

  // ========== 工具方法 ==========

  private fullIssue(short: string): string {
    return `${2000 + parseInt(short.slice(0, 2), 10)}${short.slice(2)}`;
  }

  private parseNum(text: string): number {
    try {
      return parseFloat(text.replace(/,/g, '').replace(/，/g, '').trim()) || 0;
    } catch {
      return 0;
    }
  }

  private dateToIssue(date: Date, perYear: number): string {
    const y = date.getFullYear() % 100;
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (date.getTime() - startOfYear.getTime()) / 86400000,
    );
    const n = Math.min(Math.floor((dayOfYear / 365) * perYear) + 1, perYear);
    return `${String(y).padStart(2, '0')}${String(n).padStart(3, '0')}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
