/**
 * API 封装 — axios 实例 (REST) + fetch SSE (流式)
 */
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export function useApi() {
  /** 普通 HTTP 查询 */
  async function query(text: string) {
    const { data } = await api.post('/query', { query: text });
    return data;
  }

  /**
   * SSE 流式查询 — 使用 fetch ReadableStream
   * onToken: 每收到一个 token 调用
   * onMeta: 收到 meta 信息调用
   * onDone: 流结束调用
   * onError: 出错调用
   */
  async function queryStream(
    text: string,
    callbacks: {
      onMeta?: (meta: any) => void;
      onToken?: (token: string) => void;
      onDone?: (result: any) => void;
      onError?: (err: string) => void;
    },
  ): Promise<void> {
    try {
      const resp = await fetch('http://localhost:8000/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });

      if (!resp.ok) {
        callbacks.onError?.(`HTTP ${resp.status}`);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) {
        callbacks.onError?.('不支持流式响应');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 解析 SSE 事件
        const lines = buffer.split('\n');
        buffer = ''; // 最后一个不完整行保留

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            // 保留可能不完整的行
            if (!dataStr.endsWith('}') && !dataStr.endsWith(']') && !dataStr.endsWith('"')) {
              buffer = line;
              continue;
            }
            try {
              const data = JSON.parse(dataStr);
              switch (currentEvent) {
                case 'meta':
                  callbacks.onMeta?.(data);
                  break;
                case 'token':
                  callbacks.onToken?.(data);
                  break;
                case 'done':
                  callbacks.onDone?.(data);
                  break;
                case 'error':
                  callbacks.onError?.(data.message || '未知错误');
                  break;
              }
            } catch {
              // JSON parse error — might be partial, keep in buffer
              buffer = line;
            }
            currentEvent = '';
          } else if (line === '') {
            currentEvent = '';
          } else {
            // continuation of previous data
            buffer += line;
          }
        }
      }
    } catch (e: any) {
      callbacks.onError?.(e.message || '网络连接失败');
    }
  }

  async function addInsight(content: string, tags: string[] = []) {
    const { data } = await api.post('/insight/add', { content, tags });
    return data;
  }

  async function getStats(lotto: 'ssq' | 'dlt') {
    const { data } = await api.get(`/stats/${lotto}`);
    return data;
  }

  async function getMemoryConflicts() {
    const { data } = await api.get('/memory/conflicts');
    return data;
  }

  async function getMemoryTimeline() {
    const { data } = await api.get('/memory/timeline');
    return data;
  }

  async function crawl(lotto: 'ssq' | 'dlt', count: number = 30) {
    const { data } = await api.post(`/crawl/${lotto}`, { count });
    return data;
  }

  async function getSystemInfo() {
    const { data } = await api.get('/');
    return data;
  }

  return {
    api,
    query,
    queryStream,
    addInsight,
    getStats,
    getMemoryConflicts,
    getMemoryTimeline,
    crawl,
    getSystemInfo,
  };
}
