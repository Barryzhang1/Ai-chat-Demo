#!/bin/bash

# Chat Backend 启动脚本
# 自动检查并启动 MongoDB 和后端服务

echo "🚀 启动 Chat Backend 服务..."
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 如果存在 ChatBackEnd 目录，进入该目录
if [ -d "ChatBackEnd" ]; then
    echo "📂 进入 ChatBackEnd 目录..."
    cd ChatBackEnd
fi

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

# 启动服务器
echo ""
echo "🎯 启动后端服务器 (npm run start)..."
echo "📍 API 地址: http://localhost:3000"
echo "⚠️  注意: 此模式不自动启动 MongoDB，请确保本地 MongoDB 已运行"
echo ""
npm run start


