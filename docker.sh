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
    docker-compose up -d
    
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
    
    print_msg $BLUE "🛑 停止现有容器..."
    docker-compose down
    
    print_msg $BLUE "\n🔨 重新构建 Docker 镜像..."
    docker-compose build --no-cache
    
    print_msg $BLUE "\n🚀 启动所有服务..."
    docker-compose up -d
    
    print_msg $YELLOW "\n⏳ 等待服务启动..."
    sleep 10
    
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
    echo "  rebuild        重新构建并启动所有服务"
    echo "  logs [服务名]  查看日志 (不指定服务名则查看所有)"
    echo "  status         查看服务状态"
    echo "  help           显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./docker.sh                    # 启动所有服务"
    echo "  ./docker.sh start              # 启动所有服务"
    echo "  ./docker.sh stop               # 停止所有服务"
    echo "  ./docker.sh logs               # 查看所有日志"
    echo "  ./docker.sh logs chatbackend   # 只查看后端日志"
    echo ""
    echo "服务名称: mongodb, chatbackend, chatui, flappybird"
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
