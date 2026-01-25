# MongoDB 外部访问配置指南

## 📋 问题
无法从外部连接到服务器上的 MongoDB (47.118.22.92:27017)

## ✅ 已完成的修复

### 1. Docker Compose 配置
在 `docker-compose.yml` 中添加了 MongoDB 绑定配置：

```yaml
mongodb:
  command: mongod --bind_ip_all  # 允许所有IP访问
```

### 2. 部署脚本更新
在 `deploy-to-aliyun.sh` 中添加了 27017 端口配置。

## 🚀 部署步骤

### 方式1: 使用自动部署脚本（推荐）
```bash
./deploy-to-aliyun.sh
```

### 方式2: 手动部署
```bash
# SSH 到服务器
ssh root@47.118.22.92

# 进入项目目录
cd /root/Ai-chat-Demo

# 拉取最新代码
git pull origin master

# 重新构建容器
./docker.sh rebuild
```

## 🔒 配置阿里云安全组

**必须完成此步骤，否则无法从外部访问！**

1. 登录阿里云控制台：https://ecs.console.aliyun.com
2. 选择你的 ECS 实例
3. 点击「安全组」→「配置规则」
4. 点击「添加安全组规则」，添加以下规则：

| 端口范围 | 授权对象 | 协议 | 说明 |
|---------|---------|------|------|
| 27017/27017 | 0.0.0.0/0 | TCP | MongoDB 数据库 |
| 3000/3000 | 0.0.0.0/0 | TCP | 前端 UI |
| 3001/3001 | 0.0.0.0/0 | TCP | 后端 API |
| 3002/3002 | 0.0.0.0/0 | TCP | 游戏服务 |

## 📱 连接信息

部署完成后，使用以下信息连接 MongoDB：

```
主机: 47.118.22.92
端口: 27017
用户名: root
密码: password
认证数据库: admin
```

### MongoDB Compass 连接字符串
```
mongodb://root:password@47.118.22.92:27017/?authSource=admin
```

### Node.js 连接字符串
```javascript
const uri = 'mongodb://root:password@47.118.22.92:27017/restaurant?authSource=admin';
```

## 🔍 验证连接

### 从本地测试连接
```bash
# 使用 mongosh
mongosh "mongodb://root:password@47.118.22.92:27017/?authSource=admin"

# 或使用 mongo
mongo "mongodb://root:password@47.118.22.92:27017/?authSource=admin"
```

### 使用诊断脚本
```bash
./diagnose-server.sh
```

## ⚠️ 安全警告

**生产环境建议：**

1. **修改默认密码**
   ```bash
   # 在 docker-compose.yml 中修改
   MONGO_INITDB_ROOT_PASSWORD: your_strong_password_here
   ```

2. **限制访问 IP**
   - 在阿里云安全组中，将 `0.0.0.0/0` 改为你的办公室/家庭 IP
   - 或使用 VPN 后仅开放内网访问

3. **启用 SSL/TLS**
   ```yaml
   command: mongod --bind_ip_all --tlsMode requireTLS --tlsCertificateKeyFile /path/to/cert
   ```

4. **使用防火墙规则**
   ```bash
   # 仅允许特定 IP 访问 MongoDB
   ufw allow from YOUR_IP to any port 27017
   ```

## 🐛 故障排查

### 1. 检查容器状态
```bash
ssh root@47.118.22.92 "docker ps | grep mongodb"
```

### 2. 检查 MongoDB 日志
```bash
ssh root@47.118.22.92 "docker logs chat-mongodb"
```

### 3. 检查端口监听
```bash
ssh root@47.118.22.92 "netstat -tlnp | grep 27017"
```

### 4. 测试内部连接
```bash
ssh root@47.118.22.92 "docker exec chat-mongodb mongosh -u root -p password --authenticationDatabase admin"
```

### 5. 检查防火墙
```bash
ssh root@47.118.22.92 "ufw status | grep 27017"
```

## 📚 相关文档

- [MongoDB 官方文档](https://docs.mongodb.com/)
- [Docker Compose MongoDB 配置](https://hub.docker.com/_/mongo)
- [阿里云安全组配置](https://help.aliyun.com/document_detail/25471.html)
