#!/bin/bash

# DeepSeek API 后端启动脚本
# 确保已配置 DEEPSEEK_API_KEY 环境变量

echo "🚀 启动 DeepSeek API 后端服务..."
echo ""

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  警告: .env 文件不存在"
    echo "请先创建 .env 文件并配置 DEEPSEEK_API_KEY"
    echo ""
    echo "运行以下命令创建配置文件："
    echo "  cp .env.example .env"
    echo "  然后编辑 .env 文件，添加你的 DeepSeek API Key"
    echo ""
    read -p "是否继续启动？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查是否设置了 DEEPSEEK_API_KEY
if [ -z "$DEEPSEEK_API_KEY" ] && [ -f .env ]; then
    source .env
fi

if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "⚠️  警告: DEEPSEEK_API_KEY 未设置"
    echo "请在 .env 文件中配置或设置环境变量"
fi

cd "$(dirname "$0")"

echo "📦 安装依赖..."
npm install

echo ""
echo "🎯 启动开发服务器..."
npm run start:dev

