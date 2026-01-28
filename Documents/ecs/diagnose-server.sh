#!/bin/bash

# 服务器诊断脚本 - 检查部署后的服务状态

SERVER_IP="47.118.22.92"
SERVER_USER="root"
SERVER_PASSWORD="Ztm123456."
REMOTE_DIR="/root/Ai-chat-Demo"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_msg() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

print_section() {
    echo ""
    print_msg $BLUE "========================================="
    print_msg $BLUE "$1"
    print_msg $BLUE "========================================="
}

# 检查 sshpass
if command -v sshpass &> /dev/null; then
    USE_SSHPASS=true
    SSH_CMD="sshpass -p '$SERVER_PASSWORD' ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP"
else
    USE_SSHPASS=false
    SSH_CMD="ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP"
fi

print_msg $GREEN "
╔════════════════════════════════════════════╗
║   服务器诊断工具                            ║
║   服务器: $SERVER_IP                        
╚════════════════════════════════════════════╝
"

# 1. 测试服务器连接
print_section "1. 测试服务器连接"
if eval "$SSH_CMD 'echo OK'" &> /dev/null; then
    print_msg $GREEN "✅ 服务器连接正常"
else
    print_msg $RED "❌ 无法连接到服务器"
    exit 1
fi

# 2. 检查 Docker 容器状态
print_section "2. 检查 Docker 容器状态"
eval "$SSH_CMD 'cd $REMOTE_DIR && docker ps --filter \"name=chat\" --format \"table {{.Names}}\t{{.Status}}\t{{.Ports}}\"'"

# 3. 检查端口监听
print_section "3. 检查端口监听情况"
print_msg $YELLOW "检查 3000 端口 (ChatUI):"
eval "$SSH_CMD 'netstat -tlnp | grep :3000 || ss -tlnp | grep :3000 || echo \"端口 3000 未监听\"'"
echo ""
print_msg $YELLOW "检查 3001 端口 (Backend):"
eval "$SSH_CMD 'netstat -tlnp | grep :3001 || ss -tlnp | grep :3001 || echo \"端口 3001 未监听\"'"
echo ""
print_msg $YELLOW "检查 3002 端口 (Game):"
eval "$SSH_CMD 'netstat -tlnp | grep :3002 || ss -tlnp | grep :3002 || echo \"端口 3002 未监听\"'"

# 4. 检查防火墙状态
print_section "4. 检查防火墙状态"
eval "$SSH_CMD '
if command -v firewall-cmd &> /dev/null; then
    echo \"使用 firewalld:\"
    firewall-cmd --list-ports 2>/dev/null || echo \"firewalld 未运行\"
elif command -v ufw &> /dev/null; then
    echo \"使用 ufw:\"
    ufw status 2>/dev/null || echo \"ufw 未启用\"
elif command -v iptables &> /dev/null; then
    echo \"使用 iptables:\"
    iptables -L -n | grep -E \"3000|3001|3002\" || echo \"未找到相关规则\"
else
    echo \"未检测到防火墙工具\"
fi
'"

# 5. 从服务器内部测试服务
print_section "5. 从服务器内部测试服务"
print_msg $YELLOW "测试 ChatUI (localhost:3000):"
eval "$SSH_CMD 'curl -I -m 5 http://localhost:3000 2>&1 | head -5 || echo \"❌ 无法访问\"'"
echo ""
print_msg $YELLOW "测试 Backend (localhost:3001/api):"
eval "$SSH_CMD 'curl -I -m 5 http://localhost:3001/api 2>&1 | head -5 || echo \"❌ 无法访问\"'"

# 6. 测试外网访问
print_section "6. 从本地测试外网访问"
print_msg $YELLOW "测试 ChatUI ($SERVER_IP:3000):"
timeout 5 curl -I "http://$SERVER_IP:3000" 2>&1 | head -5 || print_msg $RED "❌ 无法从外网访问"
echo ""
print_msg $YELLOW "测试 Backend ($SERVER_IP:3001/api):"
timeout 5 curl -I "http://$SERVER_IP:3001/api" 2>&1 | head -5 || print_msg $RED "❌ 无法从外网访问"

# 7. 查看容器日志
print_section "7. 查看容器最近日志"
print_msg $YELLOW "ChatUI 日志:"
eval "$SSH_CMD 'docker logs --tail 20 chat-ui 2>&1'"
echo ""
print_msg $YELLOW "Backend 日志:"
eval "$SSH_CMD 'docker logs --tail 20 chat-backend 2>&1'"

# 8. 检查 nginx 配置
print_section "8. 检查 nginx 配置"
eval "$SSH_CMD 'docker exec chat-ui cat /etc/nginx/conf.d/default.conf 2>&1 | head -10'"

# 9. 诊断建议
print_section "9. 诊断建议"
echo ""
print_msg $BLUE "如果无法访问，请检查以下项目："
echo ""
print_msg $YELLOW "【阿里云安全组配置】"
echo "  1. 登录阿里云控制台: https://ecs.console.aliyun.com"
echo "  2. 选择实例 -> 安全组 -> 配置规则"
echo "  3. 添加入方向规则:"
echo "     - 端口范围: 3000/3000"
echo "     - 授权对象: 0.0.0.0/0"
echo "     - 协议: TCP"
echo "  4. 重复添加 3001 和 3002 端口"
echo ""
print_msg $YELLOW "【服务器防火墙】"
echo "  如果使用 firewalld:"
echo "    firewall-cmd --permanent --add-port=3000/tcp"
echo "    firewall-cmd --permanent --add-port=3001/tcp"
echo "    firewall-cmd --permanent --add-port=3002/tcp"
echo "    firewall-cmd --reload"
echo ""
echo "  如果使用 ufw:"
echo "    ufw allow 3000/tcp"
echo "    ufw allow 3001/tcp"
echo "    ufw allow 3002/tcp"
echo ""
print_msg $YELLOW "【Docker 容器】"
echo "  重启容器: ssh $SERVER_USER@$SERVER_IP 'cd $REMOTE_DIR && ./docker.sh restart'"
echo "  查看日志: ssh $SERVER_USER@$SERVER_IP 'cd $REMOTE_DIR && ./docker.sh logs'"
echo ""
print_msg $GREEN "完成诊断！"
