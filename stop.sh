#!/bin/bash

# ChatSystem 统一关闭脚本
# 关闭 FlappyBird、ChatUI 和 ChatBackEnd 服务

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 正在关闭 ChatSystem 服务...${NC}"
echo ""

# ==========================================
# 1. 停止 Docker 容器
# ==========================================
echo -e "${BLUE}🐳 检查并停止 Docker 容器...${NC}"

# 检查容器是否存在并停止
containers=("flappybird-game" "chat-ui" "chatbackend")
for container in "${containers[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${YELLOW}  停止容器: ${container}${NC}"
        docker stop "$container" 2>/dev/null || true
        docker rm "$container" 2>/dev/null || true
        echo -e "${GREEN}  ✅ ${container} 已停止${NC}"
    else
        echo -e "  ${container} 容器不存在，跳过"
    fi
done

echo ""

# ==========================================
# 2. 关闭占用端口的进程
# ==========================================
echo -e "${BLUE}🔌 检查并关闭占用端口的进程...${NC}"

# 定义端口映射
declare -A ports=(
    ["3000"]="ChatUI"
    ["3001"]="ChatBackEnd"
    ["8080"]="FlappyBird"
    ["3002"]="FlappyBird (Docker)"
)

for port in "${!ports[@]}"; do
    service_name="${ports[$port]}"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}  检测到端口 ${port} (${service_name}) 正在使用${NC}"
        pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "  正在关闭进程: $pids"
            kill -9 $pids 2>/dev/null || true
            echo -e "${GREEN}  ✅ 端口 ${port} 已释放${NC}"
        fi
    else
        echo -e "  端口 ${port} (${service_name}) 未被占用"
    fi
done

echo ""

# ==========================================
# 3. 检查 Node.js 进程
# ==========================================
echo -e "${BLUE}📦 检查相关 Node.js 进程...${NC}"

# 查找可能的Node.js进程
node_processes=$(ps aux | grep -E "(ChatBackEnd|ChatUI|FlappyBird|webpack|nest)" | grep -v grep | awk '{print $2}' || true)

if [ -n "$node_processes" ]; then
    echo -e "${YELLOW}  发现相关 Node.js 进程:${NC}"
    ps aux | grep -E "(ChatBackEnd|ChatUI|FlappyBird|webpack|nest)" | grep -v grep
    echo ""
    read -p "是否关闭这些进程？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$node_processes" | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}  ✅ 进程已关闭${NC}"
    else
        echo -e "${YELLOW}  跳过关闭进程${NC}"
    fi
else
    echo -e "  未发现相关 Node.js 进程"
fi

echo ""

# ==========================================
# 4. 完成
# ==========================================
echo -e "${GREEN}🎉 所有服务已关闭！${NC}"
echo ""
echo "运行状态检查："
echo "  - 端口 3000 (ChatUI):      $(lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 && echo '仍在运行' || echo '已关闭')"
echo "  - 端口 3001 (ChatBackEnd):  $(lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 && echo '仍在运行' || echo '已关闭')"
echo "  - 端口 8080 (FlappyBird):   $(lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 && echo '仍在运行' || echo '已关闭')"
echo "  - 端口 3002 (FlappyBird):   $(lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1 && echo '仍在运行' || echo '已关闭')"
echo ""
