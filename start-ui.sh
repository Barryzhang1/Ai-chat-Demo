#!/bin/bash

# ChatUI 启动脚本
# 用法: ./start-chatui.sh

echo "🚀 启动 ChatUI 前端项目..."

# 进入 ChatUI 目录
cd "$(dirname "$0")/ChatUI" || exit 1

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，正在安装依赖..."
  npm install
fi

# 检查端口 3000 是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
  echo "⚠️  端口 3000 已被占用，正在清理..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  sleep 1
fi

# 启动开发服务器
echo "✨ 启动开发服务器..."
npm start
