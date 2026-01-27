#!/bin/bash

# 1. 更新 docker-compose.yml (仅需运行一次)
if [ -f update_compose.sh ]; then
    echo "📄 更新 docker-compose.yml..."
    chmod +x update_compose.sh
    ./update_compose.sh
    rm update_compose.sh
fi

echo "🚀 启动数据库服务 (MongoDB & Redis)..."
docker-compose -f docker-compose.db.yml up -d

echo "⏳ 等待数据库就绪..."
sleep 5

echo "🚀 启动应用服务 (Backend & UI)..."
docker-compose -f docker-compose.yml up -d --build

echo "🚀 启动游戏服务 (FlappyBird)..."
docker-compose -f docker-compose.game.yml up -d --build

echo "✅ 所有服务启动完成！"
