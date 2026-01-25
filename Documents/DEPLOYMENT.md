# 阿里云服务器部署指南

## 服务器信息

- **IP 地址**: 47.118.22.92
- **用户名**: root
- **系统**: Linux (CentOS/Ubuntu)

## 快速部署

### 方式一：使用自动部署脚本（推荐）

```bash
# 1. 给脚本添加执行权限
chmod +x deploy-to-aliyun.sh

# 2. 执行部署
./deploy-to-aliyun.sh
```

脚本会自动完成：
- ✅ 测试服务器连接
- ✅ 安装 Docker 和 Docker Compose（如果未安装）
- ✅ 上传项目文件
- ✅ 配置环境变量
- ✅ 启动所有服务
- ✅ 配置防火墙规则

### 方式二：手动部署

#### 1. 安装 sshpass（Mac 用户）

```bash
brew install hudochenkov/sshpass/sshpass
```

#### 2. 或者配置 SSH 密钥（更安全，推荐）

```bash
# 生成 SSH 密钥（如果还没有）
ssh-keygen -t rsa -b 4096

# 复制公钥到服务器
ssh-copy-id root@47.118.22.92

# 之后就可以无密码登录了
ssh root@47.118.22.92
```

#### 3. 手动上传和启动

```bash
# 连接到服务器
ssh root@47.118.22.92

# 在服务器上安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 退出服务器
exit

# 从本地上传项目文件
scp -r ./ root@47.118.22.92:/root/ai-chat-demo/

# 重新连接服务器
ssh root@47.118.22.92

# 进入项目目录
cd /root/ai-chat-demo

# 配置环境变量（可选）
echo "DEEPSEEK_API_KEY=your_api_key_here" > .env

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
cd /root/ai-chat-demo

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

当代码有更新时，重新运行部署脚本即可：

```bash
./deploy-to-aliyun.sh
```

## 故障排查

### 1. 无法连接到服务器

```bash
# 测试网络连接
ping 47.118.22.92

# 测试 SSH 端口
telnet 47.118.22.92 22
```

### 2. 端口无法访问

- 检查阿里云安全组规则是否已配置
- 检查服务器防火墙：`firewall-cmd --list-all` 或 `ufw status`

### 3. 服务启动失败

```bash
# 查看容器状态
docker ps -a

# 查看详细日志
docker-compose logs
```

### 4. 内存不足

```bash
# 查看服务器资源使用
free -h
df -h

# 清理 Docker 资源
docker system prune -a
```

## 安全建议

1. **修改 SSH 端口**（可选）
   ```bash
   # 编辑 SSH 配置
   vi /etc/ssh/sshd_config
   # 修改 Port 22 为其他端口（如 2222）
   # 重启 SSH 服务
   systemctl restart sshd
   ```

2. **配置 SSH 密钥登录**（推荐）
   ```bash
   # 禁用密码登录，只允许密钥登录
   vi /etc/ssh/sshd_config
   # 设置 PasswordAuthentication no
   ```

3. **配置 SSL 证书**（生产环境必须）
   - 使用 Let's Encrypt 免费证书
   - 配置 Nginx 反向代理
   - 启用 HTTPS

4. **定期备份**
   ```bash
   # 备份 MongoDB 数据
   docker exec chat-mongodb mongodump --out /backup
   ```

## 监控和维护

### 设置自动重启

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 3 点检查并重启）
0 3 * * * cd /root/ai-chat-demo && ./docker.sh restart
```

### 日志轮转

```bash
# 配置 Docker 日志大小限制
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

## 技术支持

如遇问题，请查看：
- 项目文档
- Docker 日志
- 服务器系统日志：`journalctl -xe`
