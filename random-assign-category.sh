#!/bin/bash

# 随机分配分类脚本
# 为所有菜品随机分配一个分类

echo "🚀 开始执行随机分配分类脚本..."
echo ""

# 检查是否在项目根目录
if [ ! -d "ChatBackEnd" ]; then
    echo "❌ 错误：请在项目根目录下运行此脚本"
    exit 1
fi

# 进入后端目录
cd ChatBackEnd

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

# 运行脚本
npm run random-assign-category

# 返回项目根目录
cd ..

echo ""
echo "✅ 脚本执行完成"
