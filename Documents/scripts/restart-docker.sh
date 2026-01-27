#!/bin/bash

echo "🔄 正在重启 Docker Desktop..."

# 1. 尝试优雅退出 Docker
echo "⏹️  正在停止 Docker..."
osascript -e 'quit app "Docker"'

# 2. 等待进程完全退出
count=0
while pgrep -i "Docker" > /dev/null; do
    sleep 1
    count=$((count+1))
    if [ $count -gt 20 ]; then
        echo "⚠️  Docker 响应超时，强制结束进程..."
        killall Docker
        break
    fi
    echo -n "."
done
echo ""

# 3. 重新启动 Docker
echo "▶️  正在启动 Docker..."
open -a Docker

echo "⏳ 等待 Docker 引擎就绪 (这可能需要几分钟)..."

# 4. 循环检查 docker info 是否可用
attempts=0
while ! docker info >/dev/null 2>&1; do
    sleep 2
    attempts=$((attempts+1))
    if [ $attempts -gt 60 ]; then
        echo "❌ 等待超时。请手动检查 Docker 状态。"
        exit 1
    fi
    echo -n "."
done
echo ""

echo "✅ Docker 重启成功且已就绪！"
