/**
 * 应用配置 — 从 .env 加载，对应 ssq_python/config.py
 */
export default () => ({
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database_ssq: process.env.MYSQL_DATABASE_SSQ || 'ssq_data',
    database_dlt: process.env.MYSQL_DATABASE_DLT || 'dlt_data',
  },
  llm: {
    baseUrl: process.env.LLM_BASE_URL || 'http://localhost:11434/v1',
    model: process.env.LLM_MODEL || 'qwen2.5:7b',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1024', 10),
  },
  api: {
    host: process.env.API_HOST || '0.0.0.0',
    port: parseInt(process.env.API_PORT || '8000', 10),
  },
  manasdb: {
    embeddingModel: process.env.MANASDB_EMBEDDING_MODEL || 'nomic-embed-text:latest',
  },
});
