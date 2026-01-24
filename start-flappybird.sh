#!/bin/bash

echo "🐦 启动 Flappy Bird 游戏..."

# 进入项目目录
cd "$(dirname "$0")/FlappyBird"

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，正在安装依赖..."
  npm install
fi

# 检查并清理端口 8080
PORT=8080
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "⚠️  端口 $PORT 已被占用，正在清理..."
  lsof -ti:$PORT | xargs kill -9 2>/dev/null
  sleep 1
fi

# 启动开发服务器
echo "✨ 启动游戏服务器..."
npm start
