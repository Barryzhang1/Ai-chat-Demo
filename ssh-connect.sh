#!/bin/bash

# SSH 连接阿里云服务器脚本

# 服务器配置
SERVER_IP="47.118.22.92"
SERVER_USER="root"
SERVER_PASSWORD="Ztm123456."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  连接到阿里云服务器${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${GREEN}服务器: ${NC}$SERVER_IP"
echo -e "${GREEN}用户名: ${NC}$SERVER_USER"
echo ""

# 检查是否安装了 sshpass
if command -v sshpass &> /dev/null; then
    echo -e "${GREEN}✅ 使用 sshpass 连接...${NC}"
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP"
else
    echo -e "${YELLOW}⚠️  未检测到 sshpass${NC}"
    echo -e "${BLUE}正在尝试普通 SSH 连接...${NC}"
    echo ""
    ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP"
fi
