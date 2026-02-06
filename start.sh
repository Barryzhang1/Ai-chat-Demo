#!/bin/bash

# ChatSystem 统一启动脚本
# 同时启动后端 API 服务和前端界面

set -e

# 保存当前目录
ROOT_DIR="$(dirname "$0")"
cd "$ROOT_DIR"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 正在启动 ChatSystem 全栈服务...${NC}"
echo ""

# ==========================================
# 1. 准备后端环境
# ==========================================
echo -e "${BLUE}📦 检查后端环境...${NC}"

if [ -d "ChatBackEnd" ]; then
    cd ChatBackEnd
    
    # 检查 .env
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  Backend .env 不存在，尝试从 .env.example 复制...${NC}"
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}✅ 已创建 .env 文件${NC}"
        else
            echo -e "${YELLOW}⚠️  没有找到 .env.example，跳过 .env 创建${NC}"
        fi
    fi

    # 检查 node_modules
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 安装后端依赖...${NC}"
        npm install
    fi
    
    cd ..
else
    echo -e "${YELLOW}⚠️  找不到 ChatBackEnd 目录${NC}"
fi

# ==========================================
# 2. 准备前端环境
# ==========================================
echo -e "${BLUE}📦 检查前端环境...${NC}"

if [ -d "ChatUI" ]; then
    cd ChatUI
    
    # 检查 node_modules
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 安装前端依赖...${NC}"
        npm install
    fi
    
    cd ..
else
    echo -e "${YELLOW}⚠️  找不到 ChatUI 目录${NC}"
fi

# ==========================================
# 3. 启动服务
# ==========================================

# 清理可能的端口占用
echo -e "${BLUE}🧹 清理并在启动服务...${NC}"

# 清理 3000 (前端) 和 3001 (后端默认)
# 注意：这里我们尝试温和地清理
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "  - 清理端口 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "  - 清理端口 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null ; then
    echo "  - 清理端口 3002..."
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
fi

# 定义清理函数，确保脚本退出时关闭子进程
cleanup() {
    echo ""
    echo -e "${BLUE}🛑 正在停止所有服务...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill $GAME_PID 2>/dev/null || true
    exit
}

trap cleanup SIGINT SIGTERM

# 启动后端 (后台运行)
echo -e "${GREEN}🟢 启动后端服务 (Port 3001)...${NC}"
cd ChatBackEnd
npm run start &
BACKEND_PID=$!
cd ..

echo "  - 后端 PID: $BACKEND_PID"

# 启动游戏服务 (后台运行)
echo -e "${GREEN}🎮 启动游戏服务 (Port 3002)...${NC}"
cd FlappyBird
# 先构建游戏，再使用静态服务器启动
npm run build > /dev/null 2>&1
npx serve -s dist -l 3002 &
GAME_PID=$!
cd ..

echo "  - 游戏 PID: $GAME_PID"

# 等待后端和游戏稍微启动一下
sleep 3

# 启动前端 (后台运行，以便我们可以同时监控两者或者让主进程wait)
echo -e "${GREEN}🟢 启动前端服务 (Port 3000)...${NC}"
cd ChatUI
# 这里不使用 webpack serve 的 open 参数，或者让它只是运行
npm start &
FRONTEND_PID=$!
cd ..

echo "  - 前端 PID: $FRONTEND_PID"

echo ""
echo -e "${GREEN}✨ 服务已启动!${NC}"
echo -e "   前端访问: ${BLUE}http://localhost:3000${NC}"
echo -e "   后端 API: ${BLUE}http://localhost:3001${NC}"
echo -e "   游戏服务: ${BLUE}http://localhost:3002${NC}"
echo ""
echo "按 Ctrl+C 停止所有服务..."

# 等待所有后台进程
wait
