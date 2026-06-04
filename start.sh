#!/bin/bash

# ============================================
#  双色球 & 大乐透 AI 智能体 — 一键启动
#  前端 (Vue):  http://localhost:5173
#  后端 (Nest): http://localhost:8000
#  按 Ctrl+C 停止所有服务
# ============================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "🛑 正在停止所有服务..."
  kill $NEST_PID $VUE_PID 2>/dev/null
  wait $NEST_PID $VUE_PID 2>/dev/null
  echo "✅ 所有服务已停止"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "🚀 启动 NestJS 后端 (端口 8000)..."
cd "$ROOT_DIR/cai_nest"
npm run start:dev &
NEST_PID=$!

echo "🚀 启动 Vue 前端 (端口 5173)..."
cd "$ROOT_DIR/cai_vue"
npm run dev &
VUE_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ 服务启动中..."
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:8000"
echo "  按 Ctrl+C 停止所有服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

wait
