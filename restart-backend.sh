#!/bin/bash

echo "=========================================="
echo "重启后端服务"
echo "=========================================="
echo ""

# 查找并停止正在运行的后端进程
echo "1. 停止当前运行的后端服务..."
pkill -f "nest start" 2>/dev/null || true
pkill -f "node.*ChatBackEnd" 2>/dev/null || true
pkill -f "ts-node.*ChatBackEnd" 2>/dev/null || true

sleep 2

echo "2. 检查进程是否已停止..."
BACKEND_PROCESS=$(ps aux | grep -i "ChatBackEnd\|nest" | grep -v grep | wc -l)
if [ $BACKEND_PROCESS -eq 0 ]; then
    echo "   ✓ 后端服务已停止"
else
    echo "   ⚠ 仍有进程在运行，尝试强制停止..."
    pkill -9 -f "nest start" 2>/dev/null || true
    pkill -9 -f "node.*ChatBackEnd" 2>/dev/null || true
    sleep 1
fi

echo ""
echo "3. 启动后端服务..."
./start-backend.sh

echo ""
echo "=========================================="
echo "重启完成！"
echo "=========================================="
echo ""
echo "请等待几秒钟让服务完全启动，然后测试登录功能"
