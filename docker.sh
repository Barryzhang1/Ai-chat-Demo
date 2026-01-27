#!/bin/bash

# Ai-Chat-Demo Docker 管理脚本
# 使用方法: ./docker.sh [start|stop|restart|rebuild|logs|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_msg() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# 检查 Docker 环境
check_docker() {
    print_msg $BLUE "🔍 检查 Docker 环境..."
    
    if ! command -v docker &> /dev/null; then
        print_msg $RED "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_msg $RED "❌ Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_msg $RED "❌ Docker 未运行，请先启动 Docker"
        exit 1
    fi
    
    print_msg $GREEN "✅ Docker 环境检查通过\n"
}

# 启动服务
start_services() {
    check_docker
    
    print_msg $BLUE "🚀 启动所有服务..."
    # 添加 --build 确保前端和游戏服务的 dist 被重新构建
    docker-compose up -d --build
    
    print_msg $YELLOW "\n⏳ 等待服务启动..."
    sleep 5
    
    show_status
    show_urls
}

# 停止服务
stop_services() {
    print_msg $BLUE "🛑 停止所有服务..."
    docker-compose down
    print_msg $GREEN "✅ 服务已停止"
}

# 重启服务
restart_services() {
    print_msg $BLUE "🔄 重启所有服务..."
    docker-compose restart
    
    print_msg $YELLOW "\n⏳ 等待服务重启..."
    sleep 5
    
    show_status
}

# 重新构建并启动
rebuild_services() {
    check_docker

    print_msg $BLUE "🧹 清理本地构建产物..."
    rm -rf ChatUI/dist
    
    print_msg $BLUE "🛑 停止现有容器..."
    docker-compose down
    
    print_msg $BLUE "\n🔨 重新构建镜像..."
    docker-compose build --no-cache

    print_msg $BLUE "\n🚀 重新启动所有服务..."
    docker-compose up -d
    
    print_msg $YELLOW "\n⏳ 等待服务启动..."
    sleep 15
    
    show_status
    show_urls
}

# 查看日志
show_logs() {
    if [ -z "$1" ]; then
        print_msg $BLUE "📋 查看所有服务日志 (Ctrl+C 退出)..."
        docker-compose logs -f
    else
        print_msg $BLUE "📋 查看 $1 服务日志 (Ctrl+C 退出)..."
        docker-compose logs -f "$1"
    fi
}

# 显示服务状态
show_status() {
    print_msg $BLUE "\n📊 服务状态："
    docker-compose ps
}

# 显示访问地址
show_urls() {
    print_msg $GREEN "\n✅ 启动完成！"
    print_msg $BLUE "\n📍 访问地址："
    echo "   前端 UI:    http://localhost:3000"
    echo "   后端 API:   http://localhost:3001/api"
    echo "   游戏:       http://localhost:3002"
    echo "   MongoDB:    mongodb://localhost:27017"
    print_msg $YELLOW "\n💡 常用命令："
    echo "   查看日志:   ./docker.sh logs"
    echo "   查看状态:   ./docker.sh status"
    echo "   停止服务:   ./docker.sh stop"
    echo "   重启服务:   ./docker.sh restart"
    echo "   重新构建:   ./docker.sh rebuild"
}

# 显示帮助信息
show_help() {
    print_msg $BLUE "Ai-Chat-Demo Docker 管理脚本\n"
    echo "使用方法: ./docker.sh [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  start          启动所有服务 (默认)"
    echo "  stop           停止所有服务"
    echo "  restart        重启所有服务"
    echo "  rebuild        清理并重新启动所有服务"
    echo "  logs [服务名]  查看日志 (不指定服务名则查看所有)"
    echo "  status         查看服务状态"
    echo "  ps             查看容器详细状态"
    echo "  clean          完全清理（删除容器、卷、网络）"
    echo "  help           显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./docker.sh                    # 启动所有服务"
    echo "  ./docker.sh start              # 启动所有服务"
    echo "  ./docker.sh stop               # 停止所有服务"
    echo "  ./docker.sh logs               # 查看所有日志"
    echo "  ./docker.sh logs chatui        # 只查看前端日志"
    echo "  ./docker.sh ps                 # 查看容器详细状态"
    echo ""
    echo "服务名称: mongodb, chatbackend, chatui, flappybird"
    echo ""
    echo "说明:"
    echo "  现在使用数据卷挂载方式，代码修改后只需 restart 即可生效"
    echo "  首次启动会安装依赖，需要较长时间，请耐心等待"
}

# 查看详细状态
show_ps() {
    print_msg $BLUE "📊 容器详细状态："
    docker ps -a --filter "name=chat" --filter "name=flappybird"
    echo ""
    print_msg $BLUE "🔍 端口映射："
    docker ps --filter "name=chat" --filter "name=flappybird" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    print_msg $BLUE "📝 测试连接："
    echo "测试前端服务..."
    curl -I http://localhost:3000 2>/dev/null | head -n 1 || echo "❌ 前端服务无响应"
    echo "测试后端服务..."
    curl -I http://localhost:3001 2>/dev/null | head -n 1 || echo "❌ 后端服务无响应"
    echo "测试游戏服务..."
    curl -I http://localhost:3002 2>/dev/null | head -n 1 || echo "❌ 游戏服务无响应"
}

# 完全清理
clean_all() {
    print_msg $YELLOW "⚠️  这将删除所有容器、数据卷和网络！"
    read -p "确认继续? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_msg $BLUE "🗑️  完全清理..."
        docker-compose down -v --remove-orphans
        print_msg $GREEN "✅ 清理完成"
    else
        print_msg $YELLOW "已取消"
    fi
}

# 主程序
main() {
    case "${1:-start}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        rebuild)
            rebuild_services
            ;;
        logs)
            show_logs "$2"
            ;;
        status)
            show_status
            ;;
        ps)
            show_ps
            ;;
        clean)
            clean_all
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_msg $RED "❌ 未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
