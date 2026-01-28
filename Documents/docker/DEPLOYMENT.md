# 阿里云服务器部署指南

## 服务器信息

- **IP 地址**: 47.118.22.92
- **用户名**: root
- **系统**: Linux (CentOS/Ubuntu)

## 部署方式说明

本项目采用 **Git + Docker** 部署方式：

1. 本地提交代码到 Git 仓库
2. 服务器通过 `git pull` 获取最新代码
3. 使用 Docker 启动所有服务

## 前置准备

### 1. 在服务器上克隆代码库（仅首次需要）

```bash
# SSH 连接到服务器
ssh root@47.118.22.92

# 克隆代码仓库
cd /root
git clone <your-git-repository-url> Ai-chat-Demo

# 退出服务器
exit
```

### 2. 配置 Git 仓库

确保你的本地代码已经关联了远程 Git 仓库：

```bash
# 查看远程仓库
git remote -v

# 如果没有，添加远程仓库
git remote add origin <your-git-repository-url>
```

### 3. 配置 SSH 密钥（可选但推荐）

```bash
# 生成 SSH 密钥
ssh-keygen -t rsa -b 4096

# 复制公钥到服务器
ssh-copy-id root@47.118.22.92

# 之后就可以无密码登录
```

或者安装 sshpass（如需使用密码登录）：

```bash
# Mac 用户
brew install hudochenkov/sshpass/sshpass
```

## 快速部署

### 方式一：使用自动部署脚本（推荐）

```bash
# 1. 给脚本添加执行权限
chmod +x deploy-to-aliyun.sh

# 2. 执行部署
./deploy-to-aliyun.sh
```

脚本会自动完成：
- ✅ 检查本地 Git 状态
- ✅ 提交并推送本地代码（如有更改）
- ✅ 测试服务器连接
- ✅ 安装 Docker 和 Docker Compose（如果未安装）
- ✅ 在服务器上 `git pull` 最新代码
- ✅ 配置环境变量
- ✅ 启动所有服务
- ✅ 配置防火墙规则

### 方式二：手动部署

#### 1. 提交本地代码

```bash
# 查看未提交的更改
git status

# 添加所有更改
git add .

# 提交
git commit -m "your commit message"

# 推送到远程仓库
git push origin main  # 或你的分支名
```

#### 2. 在服务器上更新代码

```bash
# 连接到服务器
ssh root@47.118.22.92

# 进入项目目录
cd /root/Ai-chat-Demo

# 拉取最新代码
git pull origin main  # 或你的分支名

# 启动服务
chmod +x docker.sh
./docker.sh rebuild
```

## 配置阿里云安全组

1. 登录阿里云控制台: https://ecs.console.aliyun.com
2. 选择你的 ECS 实例
3. 点击 **安全组** → **配置规则** → **添加安全组规则**
4. 添加以下入方向规则：

| 端口范围 | 协议 | 授权对象 | 描述 |
|---------|------|---------|------|
| 22/22 | TCP | 0.0.0.0/0 | SSH |
| 3000/3000 | TCP | 0.0.0.0/0 | 前端UI |
| 3001/3001 | TCP | 0.0.0.0/0 | 后端API |
| 3002/3002 | TCP | 0.0.0.0/0 | 游戏 |

## 访问地址

部署完成后，可以通过以下地址访问：

- **前端 UI**: http://47.118.22.92:3000
- **后端 API**: http://47.118.22.92:3001/api
- **游戏**: http://47.118.22.92:3002

## 常用管理命令

```bash
# SSH 连接到服务器
ssh root@47.118.22.92

# 进入项目目录
cd /root/Ai-chat-Demo

# 拉取最新代码
git pull

# 查看服务状态
./docker.sh status

# 查看日志
./docker.sh logs

# 查看特定服务日志
./docker.sh logs chatbackend

# 重启服务
./docker.sh restart

# 停止服务
./docker.sh stop

# 重新构建并启动
./docker.sh rebuild
```

## 更新部署

当代码有更新时：

```bash
# 方式一：使用部署脚本（自动提交并部署）
./deploy-to-aliyun.sh

# 方式二：手动更新
git add .
git commit -m "your message"
git push
ssh root@47.118.22.92 "cd /root/Ai-chat-Demo && git pull && ./docker.sh restart"
```

## 环境变量配置

在服务器的项目目录下创建 `.env` 文件（如果还没有）：

```bash
ssh root@47.118.22.92
cd /root/Ai-chat-Demo
vi .env
```

添加以下内容：

```bash
DEEPSEEK_API_KEY=your_api_key_here
```

## 故障排查

### 1. 无法连接到服务器

```bash
# 测试网络连接
ping 47.118.22.92

# 测试 SSH 端口
telnet 47.118.22.92 22
```

### 2. Git pull 失败

```bash
# 检查 Git 配置
ssh root@47.118.22.92
cd /root/Ai-chat-Demo
git status

# 重置本地更改（谨慎使用）
git reset --hard HEAD
git pull

# 或者使用强制拉取
git fetch --all
git reset --hard origin/main
```

### 3. 端口无法访问

- 检查阿里云安全组规则是否已配置
- 检查服务器防火墙：
  ```bash
  # firewalld
  firewall-cmd --list-all
  
  # ufw
  ufw status
  ```

### 4. 服务启动失败

```bash
# 查看容器状态
docker ps -a

# 查看详细日志
./docker.sh logs

# 重新构建
./docker.sh rebuild
```

### 5. 内存不足

```bash
# 查看服务器资源使用
free -h
df -h

# 清理 Docker 资源
docker system prune -a
```

## 安全建议

### 1. 配置 SSH 密钥登录（强烈推荐）

```bash
# 本地生成密钥
ssh-keygen -t rsa -b 4096

# 复制到服务器
ssh-copy-id root@47.118.22.92

# 在服务器上禁用密码登录
ssh root@47.118.22.92
vi /etc/ssh/sshd_config
# 设置: PasswordAuthentication no
systemctl restart sshd
```

### 2. 配置 Git 凭证缓存（避免重复输入密码）

```bash
# 在服务器上配置
ssh root@47.118.22.92
git config --global credential.helper cache
# 或永久保存
git config --global credential.helper store
```

### 3. 使用 SSH 密钥访问 Git（推荐）

```bash
# 在服务器上生成 SSH 密钥
ssh root@47.118.22.92
ssh-keygen -t rsa -b 4096
cat ~/.ssh/id_rsa.pub

# 将公钥添加到 GitHub/GitLab 的 SSH Keys
# 然后修改远程仓库为 SSH 地址
git remote set-url origin git@github.com:username/repo.git
```

### 4. 配置防火墙规则

只开放必要端口，限制访问来源：

```bash
# 使用 firewalld
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="your-ip" port port="3000-3002" protocol="tcp" accept'
firewall-cmd --reload
```

### 5. 设置自动备份

```bash
# 创建备份脚本
vi /root/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份 MongoDB
docker exec chat-mongodb mongodump --out $BACKUP_DIR/mongo_$DATE

# 备份代码
cd /root/Ai-chat-Demo
git bundle create $BACKUP_DIR/code_$DATE.bundle --all

# 删除 7 天前的备份
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# 添加到 crontab（每天凌晨 2 点备份）
chmod +x /root/backup.sh
crontab -e
# 添加: 0 2 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

## 监控和日志

### 查看实时日志

```bash
# 所有服务
./docker.sh logs

# 特定服务
./docker.sh logs chatbackend
./docker.sh logs chatui
./docker.sh logs mongodb
```

### 配置日志轮转

编辑 Docker daemon 配置：

```bash
vi /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
systemctl restart docker
```

## 性能优化

### 1. 配置 Docker 资源限制

编辑 `docker-compose.yml`，为每个服务添加资源限制：

```yaml
services:
  chatbackend:
    # ...其他配置
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. 使用 Nginx 反向代理

```bash
# 安装 Nginx
yum install nginx  # CentOS
apt install nginx  # Ubuntu

# 配置反向代理
vi /etc/nginx/conf.d/ai-chat.conf
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 技术支持

如遇问题：
1. 查看项目文档
2. 检查 Docker 日志：`./docker.sh logs`
3. 查看系统日志：`journalctl -xe`
4. 检查服务器资源：`htop` 或 `top`
