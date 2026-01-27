#!/bin/bash

# Docker 镜像源配置脚本 (macOS/Linux)

CONFIG_FILE="$HOME/.docker/daemon.json"
BACKUP_FILE="$HOME/.docker/daemon.json.bak"
DIR_PATH="$HOME/.docker"

# 定义要设置的镜像源
MIRRORS='[
    "https://docker.m.daocloud.io",
    "https://huecker.io",
    "https://docker.1panel.live",
    "https://mirror.ccs.tencentyun.com"
]'

echo "🔧 正在配置 Docker 镜像源..."

# 1. 确保目录存在
if [ ! -d "$DIR_PATH" ]; then
    echo "📂 创建目录: $DIR_PATH"
    mkdir -p "$DIR_PATH"
fi

# 2. 备份现有配置
if [ -f "$CONFIG_FILE" ]; then
    echo "📦 备份现有配置到: $BACKUP_FILE"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
else
    echo "{}" > "$CONFIG_FILE"
fi

# 3. 使用 Python 更新 JSON 配置 (macOS 默认预装 Python3 或使用 python)
# 尝试查找 python 命令
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ 未找到 Python，无法自动修改 JSON。请手动编辑 $CONFIG_FILE"
    exit 1
fi

echo "📝 更新配置文件..."

# 使用 Python 脚本注入新的镜像源配置
$PYTHON_CMD -c "
import json
import os
import sys

config_path = '$CONFIG_FILE'
mirrors = $MIRRORS

try:
    with open(config_path, 'r') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            data = {}

    # 更新 registry-mirrors
    data['registry-mirrors'] = mirrors

    with open(config_path, 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f'✅ 成功将镜像源写入 {config_path}')
except Exception as e:
    print(f'❌ 写入失败: {e}')
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 配置完成！"
    echo "⚠️  重要提示：您必须【重启 Docker Desktop】才能使配置生效！"
    echo "   您可以点击菜单栏 Docker 图标 -> Quit Docker，然后重新打开。"
else
    echo "❌ 配置失败"
fi
