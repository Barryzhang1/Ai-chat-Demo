#!/bin/bash

# Ai-Chat-Demo 阿里云服务器部署脚本 (Git 方式)

set -e

# 服务器配置
SERVER_IP="47.118.22.92"
SERVER_USER="root"
SERVER_PASSWORD="Ztm123456."
REMOTE_DIR="/root/Ai-chat-Demo"
PROJECT_NAME="Ai-chat-Demo"

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

print_step() {
    echo ""
    print_msg $BLUE "========================================="
    print_msg $BLUE "$1"
    print_msg $BLUE "========================================="
    echo ""
}

# 检查并安装 sshpass
check_sshpass() {
    if ! command -v sshpass &> /dev/null; then
        print_msg $YELLOW "⚠️  未检测到 sshpass，正在尝试自动安装..."
        
        # 检测操作系统并安装
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                print_msg $BLUE "使用 Homebrew 安装 sshpass..."
                brew tap hudochenkov/sshpass
                brew install hudochenkov/sshpass/sshpass
                if [ $? -eq 0 ]; then
                    print_msg $GREEN "✅ sshpass 安装成功"
                    USE_SSHPASS=true
                else
                    print_msg $YELLOW "⚠️  自动安装失败，将使用 SSH 密钥方式"
                    USE_SSHPASS=false
                fi
            else
                print_msg $RED "❌ 未检测到 Homebrew，请先安装: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                print_msg $YELLOW "或手动安装 sshpass: brew install hudochenkov/sshpass/sshpass"
                USE_SSHPASS=false
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            if command -v apt-get &> /dev/null; then
                sudo apt-get update && sudo apt-get install -y sshpass
            elif command -v yum &> /dev/null; then
                sudo yum install -y sshpass
            fi
            USE_SSHPASS=true
        else
            print_msg $YELLOW "⚠️  未知操作系统，将尝试使用 SSH 密钥方式"
            USE_SSHPASS=false
        fi
    else
        USE_SSHPASS=true
        print_msg $GREEN "✅ 检测到 sshpass，将使用密码方式连接"
    fi
    
    if [ "$USE_SSHPASS" = false ]; then
        print_msg $YELLOW "提示：如需使用密码登录，请配置 SSH 密钥："
        print_msg $YELLOW "  ssh-keygen -t rsa -b 4096"
        print_msg $YELLOW "  ssh-copy-id $SERVER_USER@$SERVER_IP"
    fi
}

# SSH 连接命令
ssh_cmd() {
    if [ "$USE_SSHPASS" = true ]; then
        sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$@"
    else
        ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$@"
    fi
}

# SCP 复制命令
scp_cmd() {
    if [ "$USE_SSHPASS" = true ]; then
        sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r "$@"
    else
        scp -o StrictHostKeyChecking=no -r "$@"
    fi
}

# 测试服务器连接
test_connection() {
    print_step "🔍 测试服务器连接"
    
    if ssh_cmd "echo '连接成功'" &> /dev/null; then
        print_msg $GREEN "✅ 服务器连接正常"
    else
        print_msg $RED "❌ 无法连接到服务器，请检查："
        echo "   1. IP 地址是否正确: $SERVER_IP"
        echo "   2. 用户名是否正确: $SERVER_USER"
        echo "   3. 密码是否正确"
        echo "   4. 服务器防火墙是否开放 SSH (22端口)"
        exit 1
    fi
}

# 检查并安装 Docker
install_docker() {
    print_step "🐳 检查服务器 Docker 环境"
    
    if ssh_cmd "command -v docker" &> /dev/null; then
        print_msg $GREEN "✅ Docker 已安装"
    else
        print_msg $YELLOW "⚠️  Docker 未安装，开始安装..."
        ssh_cmd "curl -fsSL https://get.docker.com | sh && systemctl start docker && systemctl enable docker"
        print_msg $GREEN "✅ Docker 安装完成"
    fi
    
    if ssh_cmd "command -v docker-compose" &> /dev/null; then
        print_msg $GREEN "✅ Docker Compose 已安装"
    else
        print_msg $YELLOW "⚠️  Docker Compose 未安装，开始安装..."
        ssh_cmd "curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose"
        print_msg $GREEN "✅ Docker Compose 安装完成"
    fi
}

# 检查本地 Git 状态
check_git_status() {
    print_step "📋 检查本地 Git 状态"
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_msg $RED "❌ 当前目录不是 Git 仓库"
        exit 1
    fi
    
    # 检查是否有未提交的更改
    if [[ -n $(git status -s) ]]; then
        print_msg $YELLOW "⚠️  检测到未提交的更改："
        git status -s
        echo ""
        print_msg $BLUE "将自动提交这些更改..."
        return 0  # 需要提交
    else
        print_msg $GREEN "✅ 工作区干净，无需提交"
        return 1  # 不需要提交
    fi
}

# 提交并推送代码
commit_and_push() {
    print_step "📤 提交并推送代码到远程仓库"
    
    # 添加所有更改
    print_msg $BLUE "添加更改..."
    git add .
    
    # 自动生成提交信息
    commit_msg="Deploy: Auto commit at $(date '+%Y-%m-%d %H:%M:%S')"
    
    print_msg $BLUE "提交更改: $commit_msg"
    git commit -m "$commit_msg"
    
    # 获取当前分支
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    print_msg $BLUE "当前分支: $current_branch"
    
    # 推送
    print_msg $BLUE "推送到远程仓库..."
    if git push origin "$current_branch"; then
        print_msg $GREEN "✅ 代码推送成功"
    else
        print_msg $RED "❌ 代码推送失败，请检查网络或远程仓库配置"
        exit 1
    fi
}

# 在服务器上拉取最新代码
pull_latest_code() {
    print_step "🔄 在服务器上拉取最新代码"
    
    # 检查远程目录是否存在
    if ! ssh_cmd "[ -d $REMOTE_DIR ]"; then
        print_msg $RED "❌ 服务器上不存在目录: $REMOTE_DIR"
        print_msg $YELLOW "请先在服务器上使用以下命令克隆仓库："
        echo "   cd /root"
        echo "   git clone <your-repo-url> Ai-chat-Demo"
        exit 1
    fi
    
    # 拉取最新代码
    print_msg $BLUE "拉取最新代码..."
    ssh_cmd "cd $REMOTE_DIR && git fetch origin && git pull origin \$(git rev-parse --abbrev-ref HEAD)"
    
    print_msg $GREEN "✅ 代码更新完成"
}

# 配置环境变量
setup_env() {
    print_step "⚙️  配置环境变量"
    
    # 检查服务器上是否已有 .env 文件
    if ssh_cmd "[ -f $REMOTE_DIR/.env ]"; then
        print_msg $GREEN "✅ 服务器上已存在 .env 文件"
        
        # 如果本地也有 .env，自动更新
        if [ -f ".env" ]; then
            print_msg $BLUE "检测到本地 .env 文件，自动更新到服务器..."
            scp_cmd ".env" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
            print_msg $GREEN "✅ .env 文件已更新"
        else
            print_msg $YELLOW "本地无 .env 文件，保持服务器配置不变"
        fi
    else
        print_msg $YELLOW "⚠️  服务器上未检测到 .env 文件"
        
        if [ -f ".env" ]; then
            print_msg $BLUE "上传本地 .env 文件..."
            scp_cmd ".env" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"
            print_msg $GREEN "✅ .env 文件已上传"
        else
            print_msg $YELLOW "⚠️  本地和服务器都没有 .env 文件"
            print_msg $YELLOW "服务将使用默认环境变量启动"
        fi
    fi
}

# 在服务器上启动服务
start_services() {
    print_step "🚀 启动服务"
    
    ssh_cmd "cd $REMOTE_DIR && chmod +x docker.sh && ./docker.sh stop || true && ./docker.sh rebuild"
    
    print_msg $GREEN "✅ 服务启动完成"
}

# 配置防火墙
setup_firewall() {
    print_step "🔥 配置防火墙规则"
    
    print_msg $BLUE "开放必要端口..."
    ssh_cmd "
        # 检查是否使用 firewalld
        if command -v firewall-cmd &> /dev/null; then
            firewall-cmd --permanent --add-port=3000/tcp
            firewall-cmd --permanent --add-port=3001/tcp
            firewall-cmd --permanent --add-port=3002/tcp
            firewall-cmd --permanent --add-port=27017/tcp
            firewall-cmd --reload
            echo 'firewalld 规则已更新'
        # 检查是否使用 ufw
        elif command -v ufw &> /dev/null; then
            ufw allow 3000/tcp
            ufw allow 3001/tcp
            ufw allow 3002/tcp
            ufw allow 27017/tcp
            echo 'ufw 规则已更新'
        else
            echo '未检测到防火墙管理工具，请手动开放端口 3000, 3001, 3002, 27017'
        fi
    "
    
    print_msg $YELLOW "⚠️  请确保阿里云安全组已开放以下端口："
    echo "   - 3000 (前端UI)"
    echo "   - 3001 (后端API)"
    echo "   - 3002 (游戏)"
    echo "   - 27017 (MongoDB)"
    echo ""
    print_msg $BLUE "阿里云安全组配置: https://ecs.console.aliyun.com"
}

# 显示部署结果
show_result() {
    print_step "✅ 部署完成"
    
    print_msg $GREEN "🎉 项目已成功部署到阿里云服务器！"
    echo ""
    print_msg $BLUE "📍 访问地址："
    echo "   前端 UI:    http://$SERVER_IP:3000"
    echo "   后端 API:   http://$SERVER_IP:3001/api"
    echo "   游戏:       http://$SERVER_IP:3002"
    echo "   MongoDB:    mongodb://root:password@$SERVER_IP:27017"
    echo ""
    print_msg $YELLOW "💡 管理命令："
    echo "   查看日志:   ssh $SERVER_USER@$SERVER_IP \"cd $REMOTE_DIR && ./docker.sh logs\""
    echo "   查看状态:   ssh $SERVER_USER@$SERVER_IP \"cd $REMOTE_DIR && ./docker.sh status\""
    echo "   重启服务:   ssh $SERVER_USER@$SERVER_IP \"cd $REMOTE_DIR && ./docker.sh restart\""
    echo "   停止服务:   ssh $SERVER_USER@$SERVER_IP \"cd $REMOTE_DIR && ./docker.sh stop\""
    echo ""
    print_msg $BLUE "🔐 SSH 连接:"
    echo "   ssh $SERVER_USER@$SERVER_IP"
}

# 主流程
main() {
    print_msg $GREEN "
╔════════════════════════════════════════════╗
║   Ai-Chat-Demo 阿里云部署脚本 (Git)        ║
║   服务器: $SERVER_IP                       
╚════════════════════════════════════════════╝
    "
    
    # 先检查并安装 sshpass
    check_sshpass
    
    # 检查本地 Git 状态并提交
    if check_git_status; then
        commit_and_push
    fi
    
    # 测试连接
    test_connection
    
    # 安装 Docker
    install_docker
    
    # 拉取最新代码
    pull_latest_code
    
    # 配置环境
    setup_env
    
    # 启动服务
    start_services
    
    # 配置防火墙
    setup_firewall
    
    # 显示结果
    show_result
}

# 运行主流程
main "$@"
