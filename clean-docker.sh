#!/bin/bash

# Docker 清理脚本 - 释放磁盘空间

set -e

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

# 显示磁盘使用情况
show_disk_usage() {
    print_step "💾 当前磁盘使用情况"
    df -h /
    echo ""
    print_msg $BLUE "Docker 磁盘使用："
    docker system df || true
}

# 清理停止的容器
clean_containers() {
    print_step "🗑️  清理停止的容器"
    stopped_containers=$(docker ps -aq -f status=exited 2>/dev/null || true)
    if [ -n "$stopped_containers" ]; then
        docker rm $stopped_containers
        print_msg $GREEN "✅ 已清理停止的容器"
    else
        print_msg $YELLOW "⚠️  没有停止的容器需要清理"
    fi
}

# 清理悬空镜像
clean_dangling_images() {
    print_step "🗑️  清理悬空镜像"
    dangling_images=$(docker images -qf "dangling=true" 2>/dev/null || true)
    if [ -n "$dangling_images" ]; then
        docker rmi $dangling_images
        print_msg $GREEN "✅ 已清理悬空镜像"
    else
        print_msg $YELLOW "⚠️  没有悬空镜像需要清理"
    fi
}

# 清理未使用的镜像
clean_unused_images() {
    print_step "🗑️  清理未使用的镜像"
    print_msg $YELLOW "这将删除所有未被容器使用的镜像"
    docker image prune -a -f
    print_msg $GREEN "✅ 已清理未使用的镜像"
}

# 清理构建缓存
clean_build_cache() {
    print_step "🗑️  清理 Docker 构建缓存"
    docker builder prune -af
    print_msg $GREEN "✅ 已清理构建缓存"
}

# 清理未使用的卷
clean_volumes() {
    print_step "🗑️  清理未使用的卷"
    docker volume prune -f
    print_msg $GREEN "✅ 已清理未使用的卷"
}

# 清理网络
clean_networks() {
    print_step "🗑️  清理未使用的网络"
    docker network prune -f
    print_msg $GREEN "✅ 已清理未使用的网络"
}

# 深度清理
deep_clean() {
    print_step "🔥 执行深度清理"
    print_msg $YELLOW "这将清理所有未使用的 Docker 资源"
    docker system prune -af --volumes
    print_msg $GREEN "✅ 深度清理完成"
}

# 清理系统日志
clean_system_logs() {
    print_step "🗑️  清理系统日志"
    if [ -d "/var/log" ]; then
        # 清理日志文件（保留最近7天）
        find /var/log -type f -name "*.log" -mtime +7 -delete 2>/dev/null || true
        # 清理旧的日志归档
        find /var/log -type f -name "*.gz" -mtime +7 -delete 2>/dev/null || true
        find /var/log -type f -name "*.1" -mtime +7 -delete 2>/dev/null || true
        print_msg $GREEN "✅ 已清理旧日志文件"
    fi
}

# 清理 npm 缓存
clean_npm_cache() {
    print_step "🗑️  清理 npm 缓存"
    if command -v npm &> /dev/null; then
        npm cache clean --force
        print_msg $GREEN "✅ 已清理 npm 缓存"
    fi
}

# 显示菜单
show_menu() {
    echo ""
    print_msg $GREEN "Docker 清理工具"
    echo "==============================================="
    echo "1. 显示磁盘使用情况"
    echo "2. 清理停止的容器"
    echo "3. 清理悬空镜像"
    echo "4. 清理未使用的镜像（谨慎）"
    echo "5. 清理构建缓存"
    echo "6. 清理未使用的卷"
    echo "7. 清理未使用的网络"
    echo "8. 清理系统日志"
    echo "9. 清理 npm 缓存"
    echo "10. 深度清理（清理所有未使用的资源）"
    echo "11. 全部清理（推荐用于磁盘空间不足）"
    echo "0. 退出"
    echo "==============================================="
}

# 全部清理
clean_all() {
    print_step "🔥 执行全部清理"
    clean_containers
    clean_dangling_images
    clean_build_cache
    clean_volumes
    clean_networks
    clean_system_logs
    clean_npm_cache
    print_msg $GREEN "✅ 全部清理完成"
}

# 主流程
main() {
    if [ "$1" == "auto" ] || [ "$1" == "all" ]; then
        # 自动模式 - 全部清理
        show_disk_usage
        clean_all
        show_disk_usage
        exit 0
    fi
    
    while true; do
        show_menu
        read -p "请选择操作 [0-11]: " choice
        
        case $choice in
            1)
                show_disk_usage
                ;;
            2)
                clean_containers
                ;;
            3)
                clean_dangling_images
                ;;
            4)
                clean_unused_images
                ;;
            5)
                clean_build_cache
                ;;
            6)
                clean_volumes
                ;;
            7)
                clean_networks
                ;;
            8)
                clean_system_logs
                ;;
            9)
                clean_npm_cache
                ;;
            10)
                deep_clean
                ;;
            11)
                clean_all
                ;;
            0)
                print_msg $GREEN "退出清理工具"
                exit 0
                ;;
            *)
                print_msg $RED "无效选择，请重试"
                ;;
        esac
        
        echo ""
        read -p "按回车键继续..." dummy
    done
}

# 运行主流程
main "$@"
