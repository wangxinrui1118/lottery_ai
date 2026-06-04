# 🎱 双色球 & 大乐透 AI 智能体知识库系统

基于 **NestJS + Vue3 + MySQL + MySQL Memory + Ollama** 的彩票数据分析与 AI 智能问答平台。

## 📁 项目结构

```
.
├── ssq_python/          # Python 原版（FastAPI + Gradio + LimbicDB）
├── cai_nest/            # NestJS 后端（TypeScript，替代 FastAPI）
├── cai_vue/             # Vue3 前端（Vite + Element Plus，替代 Gradio）
└── README.md            # 本文件
```

## 🏗️ 系统架构

```
┌──────────────────────────────────────────────────────┐
│                   Vue3 前端 (cai_vue)                  │
│         Element Plus · AI-Native UI · 侧边栏导航        │
│     智能对话 / 数据统计 / 记忆管理 / 数据爬取             │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP REST API (localhost:8000)
┌──────────────────────┴───────────────────────────────┐
│                 NestJS 后端 (cai_nest)                  │
│                                                       │
│  ┌──────────┐  ┌────────┐  ┌────────┐  ┌──────────┐  │
│  │ Crawler  │  │ Agent  │  │  LLM   │  │  Memory  │  │
│  │ 500.com  │  │ 智能体  │  │ Ollama │  │  MySQL   │  │
│  └────┬─────┘  └───┬────┘  └───┬────┘  └────┬─────┘  │
│       │            │           │            │         │
│  ┌────┴────────────┴───────────┴────────────┴─────┐  │
│  │              Database Module                     │  │
│  │         mysql2/promise 连接池                     │  │
│  │    ssq_data (lottery_ssq) + dlt_data (lottery_dlt) │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────┐
│                   外部服务                              │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │    MySQL     │  │    Ollama     │                   │
│  │ 192.168.31.184│  │localhost:11434│                   │
│  │ ssq_data     │  │ qwen2.5:7b   │                   │
│  │ dlt_data     │  │               │                   │
│  │ memory table │  │               │                   │
│  └──────────────┘  └──────────────┘                   │
└──────────────────────────────────────────────────────┘
```

## 🚀 快速启动

### 前置条件

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | ≥ 18 | 前后端运行环境 |
| npm | ≥ 9 | 包管理器 |
| MySQL | 8.0+ | 数据库，地址 `192.168.31.184:3306` |
| Ollama | latest | LLM 大模型服务（qwen2.5:7b）|

### 1. 准备 Ollama 模型

```bash
# 大语言模型（对话）
ollama pull qwen2.5:7b
```

### 2. 启动 NestJS 后端

```bash
cd cai_nest

# 安装依赖（首次）
npm install

# 开发模式启动（热重载）
npm run start:dev

# 生产构建
npm run build
npm run start:prod
```

服务默认运行在 `http://localhost:8000`，API 文档见 `GET /`。

### 3. 启动 Vue3 前端

```bash
cd cai_vue

# 安装依赖（首次）
npm install

# 开发模式启动（热重载）
npm run dev

# 生产构建
npm run build
```

前端默认运行在 `http://localhost:5173`。

## 📡 API 接口

所有接口与 Python 版 FastAPI 完全兼容：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | 系统信息 |
| `POST` | `/query` | 智能问答（一次性返回）|
| `POST` | `/query/stream` | 智能问答（SSE 流式输出，逐 token 实时显示）|
| `POST` | `/insight/add` | 添加分析见解到 MySQL Memory 记忆库 |
| `GET` | `/memory/conflicts` | 检测记忆矛盾 |
| `GET` | `/memory/timeline` | 记忆时间线 |
| `POST` | `/crawl/ssq` | 爬取双色球数据（从 500.com）|
| `POST` | `/crawl/dlt` | 爬取大乐透数据（从 500.com）|
| `GET` | `/stats/ssq` | 双色球统计信息 |
| `GET` | `/stats/dlt` | 大乐透统计信息 |

### 请求示例

```bash
# 智能问答
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "红球08在最近30期出现多少次"}'

# 流式问答 (SSE — 逐 token 实时输出)
curl -N -X POST http://localhost:8000/query/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "红球08出现多少次"}'

# 爬取双色球最近30期
curl -X POST http://localhost:8000/crawl/ssq \
  -H "Content-Type: application/json" \
  -d '{"count": 30}'

# 获取统计
curl http://localhost:8000/stats/ssq
```

## 🗄️ 数据库

使用与 Python 版**完全相同的 MySQL 数据库和表结构**，无需任何迁移。

### 双色球表 `ssq_data.lottery_ssq`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 自增主键 |
| draw_date | DATE | 开奖日期 |
| draw_issue | VARCHAR(20) | 期号（唯一）|
| red_1 ~ red_6 | TINYINT | 红球 6 个号码 |
| blue | TINYINT | 蓝球 |
| sales_amount | DECIMAL(12,2) | 销售额（万元）|
| pool_amount | DECIMAL(12,2) | 奖池金额（万元）|

### 大乐透表 `dlt_data.lottery_dlt`

| 字段 | 类型 | 说明 |
|------|------|------|
| front_1 ~ front_5 | TINYINT | 前区 5 个号码 |
| back_1 ~ back_2 | TINYINT | 后区 2 个号码 |
| 其余同上 | | |

### 记忆表 `ssq_data.lottery_memories`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID 主键 |
| content | TEXT | 记忆内容（FULLTEXT 索引）|
| kind | VARCHAR(50) | 类型：insight / auto_analysis / note |
| tags | JSON | 标签数组 |
| metadata | JSON | 扩展元数据 |
| access_count | INT | 访问次数 |
| created_at | DATETIME | 创建时间 |

## 🧠 技术栈对比

| 模块 | Python 原版 | NestJS + Vue3 新版 |
|------|-----------|-------------------|
| **后端框架** | FastAPI | NestJS (TypeScript) |
| **数据库驱动** | pymysql | mysql2/promise |
| **LLM 客户端** | openai (Python) | openai (npm) |
| **AI 记忆层** | LimbicDB | **MySQL Memory** (lottery_memories 表) |
| **网页爬虫** | requests + regex | axios + cheerio |
| **前端 UI** | Gradio | **Vue3 + Element Plus** |
| **前端构建** | — | Vite |
| **设计系统** | 默认样式 | **AI-Native UI** (ui-ux-pro-max) |

## 🎨 前端设计

采用 `ui-ux-pro-max` 设计规范的 **AI-Native UI** 风格：

- **配色**: AI 紫 (#7C3AED) + 青 (#06B6D4)
- **字体**: Inter (Google Fonts)
- **布局**: 侧边栏导航 + 响应式（移动端收起）
- **组件**: SVG 图标 · 骨架屏 · 打字指示器 · 平滑过渡
- **无障碍**: WCAG AA · aria 标签 · 44px 触摸目标 · 焦点环

### 页面

| 页面 | 路由 | 功能 |
|------|------|------|
| 智能对话 | `/` | AI 问答，markdown 渲染，建议快捷输入 |
| 数据统计 | `/stats` | 双色球/大乐透号码频次图表 |
| 记忆管理 | `/memory` | MySQL Memory 时间线 + 矛盾检测 |
| 数据爬取 | `/crawl` | 从 500.com 爬取最新开奖数据 |

## 📋 环境变量

`cai_nest/.env`（已从 `ssq_python/.env` 复制）：

```env
# MySQL
MYSQL_HOST=192.168.31.184
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Wxr159753.
MYSQL_DATABASE_SSQ=ssq_data
MYSQL_DATABASE_DLT=dlt_data

# Ollama LLM
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5:7b
LLM_MAX_TOKENS=1024

# API 服务
API_HOST=0.0.0.0
API_PORT=8000
```

## 🔧 常用命令

```bash
# === NestJS 后端 (cai_nest) ===
cd cai_nest
npm run start:dev     # 开发模式
npm run build         # 编译
npm run start:prod    # 生产模式
npm run lint          # 代码检查
npm run test          # 运行测试

# === Vue3 前端 (cai_vue) ===
cd cai_vue
npm run dev           # 开发模式
npm run build         # 生产构建
npm run preview       # 预览生产构建

# === Python 原版 (备选) ===
cd ssq_python
pip install -r requirements.txt
python main.py --api          # 启动 FastAPI
python chat.py                 # 启动 Gradio UI
python main.py --crawl 30     # CLI 爬取数据
python main.py --query "红球08出现次数"  # CLI 查询
```

## 🗺️ 迁移状态

| 功能 | Python | NestJS | 状态 |
|------|--------|--------|------|
| MySQL 数据库 | ✅ | ✅ | 完成（共用同一数据库）|
| 500.com 爬虫 | ✅ | ✅ | 完成 |
| Ollama LLM 对话 | ✅ | ✅ | 完成 |
| AI 记忆存储 | LimbicDB | MySQL (lottery_memories) | 完成 |
| REST API (10 端点) | FastAPI (9) | NestJS (10，含 SSE 流式) | 完成 |
| SSE 流式对话 | — | POST /query/stream | 完成 |
| Web UI | Gradio | Vue3 | 完成 |
| CLI 工具 | argparse | — | 待开发 |
| 单元测试 | — | — | 待开发 |
