#!/bin/bash

# Chat Backend 启动脚本
# 自动检查并启动 MongoDB 和后端服务

echo "🚀 启动 Chat Backend 服务..."
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  警告: .env 文件不存在"
    echo "请先创建 .env 文件并配置环境变量"
    echo ""
    echo "运行以下命令创建配置文件："
    echo "  cp .env.example .env"
    echo "  然后编辑 .env 文件，添加必要的配置"
    echo ""
    read -p "是否继续启动？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 加载环境变量
if [ -f .env ]; then
    source .env
fi

# 检查 Docker 是否运行
echo "🔍 检查 Docker 状态..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查 MongoDB 容器是否运行
echo "🔍 检查 MongoDB 状态..."
if ! docker ps | grep -q "chat-mongo-db"; then
    echo "📦 MongoDB 容器未运行，正在启动..."
    docker-compose up -d
    echo "⏳ 等待 MongoDB 启动..."
    sleep 3
else
    echo "✅ MongoDB 已运行"
fi

# 检查 Node.js 版本
echo ""
echo "🔍 检查 Node.js 版本..."
node -v

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发服务器
echo ""
echo "🎯 启动后端开发服务器..."
echo "📍 API 地址: http://localhost:3000"
echo "📍 MongoDB: mongodb://localhost:27017/restaurant"
echo ""
npm run start:dev


