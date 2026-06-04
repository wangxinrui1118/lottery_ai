# 双色球 & 大乐透 AI 智能体知识库系统 - 后端

基于 NestJS 构建的 AI 智能体知识库后端服务，提供彩票数据爬取、LLM 智能分析、记忆存储与查询等能力。

## 技术栈

- **框架**: NestJS 10
- **数据库**: MySQL
- **向量存储**: LimbicDB
- **LLM**: Ollama (qwen2.5:7b)
- **爬虫**: Cheerio + Axios

## 快速开始

### 1. 环境配置

```bash
cp .env.example .env
```

编辑 `.env` 填入你的数据库密码和 LLM 配置。

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务

```bash
# 开发模式（热重载）
npm run start:dev

# 生产模式
npm run start:prod
```

服务默认运行在 `http://localhost:8000`。

### 一键启动（前后端）

在项目根目录执行：

```bash
./start.sh
```

## API 端点

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| POST | `/query` | AI 智能查询 |
| GET | `/stats` | 数据统计 |
| GET | `/memory` | 记忆查询 |
| POST | `/crawl` | 触发数据爬取 |
| POST | `/insight` | AI 洞察分析 |

## 项目结构

```text
src/
├── agent/          # AI 智能体服务
├── config/         # 配置管理
├── crawler/        # 数据爬取模块
├── database/       # 数据库服务
├── dto/            # 请求/响应 DTO
├── llm/            # LLM 调用模块
├── memory/         # 记忆存储模块
├── types/          # 类型定义
└── main.ts         # 入口文件
```

## 脚本

```bash
npm run build        # 构建项目
npm run start:dev    # 开发模式启动
npm run start:prod   # 生产模式启动
npm run lint         # ESLint 检查
npm run test         # 单元测试
npm run test:e2e     # E2E 测试
```
