#!/bin/bash

# Docker/Colima 启动脚本
# 用途：检查并启动 Docker 守护进程（通过 Colima）

echo "🔍 检查 Docker/Colima 状态..."

# 检查 Colima 是否安装
if ! command -v colima &> /dev/null; then
    echo "❌ Colima 未安装，请先安装: brew install colima"
    exit 1
fi

# 检查 Colima 状态
if colima status &> /dev/null; then
    echo "✅ Colima 已在运行"
    docker ps &> /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Docker 连接正常"
        echo ""
        echo "当前运行的容器："
        docker ps
        exit 0
    else
        echo "⚠️  Colima 在运行但 Docker 连接失败"
    fi
else
    echo "⚠️  Colima 未运行，正在启动..."
    
    # 尝试启动 Colima
    if colima start; then
        echo "✅ Colima 启动成功"
        echo ""
        echo "当前运行的容器："
        docker ps
        exit 0
    else
        echo "❌ Colima 启动失败，可能是磁盘被占用"
        echo "🔄 尝试删除旧实例并重新创建..."
        
        # 删除旧实例
        echo "y" | colima delete
        
        if [ $? -eq 0 ]; then
            echo "✅ 旧实例已删除"
            echo "🔄 正在重新创建 Colima..."
            
            # 重新启动
            if colima start; then
                echo "✅ Colima 重新启动成功"
                echo ""
                echo "当前运行的容器："
                docker ps
                exit 0
            else
                echo "❌ Colima 重新启动失败，请检查系统日志"
                exit 1
            fi
        else
            echo "❌ 删除旧实例失败"
            exit 1
        fi
    fi
fi
