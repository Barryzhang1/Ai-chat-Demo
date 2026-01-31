# 部署指南

## 问题诊断：Failed to fetch 错误

### 问题原因

前端在生产环境中使用相对路径 `/api` 访问后端，需要通过 nginx 代理转发。如果直接访问 Docker 容器端口而不是 nginx 端口，会导致 API 请求失败。

### 解决方案

#### ✅ 正确的访问方式

部署完成后，应该通过以下地址访问：

```
主应用（通过 nginx）：  http://47.118.22.92       或 http://47.118.22.92:3000
后端 API（直连）：     http://47.118.22.92:3001/api
游戏（独立服务）：     http://47.118.22.92:3002
```

#### 🔧 架构说明

```
用户浏览器
    ↓
http://47.118.22.92 (或 :3000)
    ↓
Nginx (ChatUI 容器内)
    ├─→ /api/*      → 代理到 chatbackend:3001/api/*
    ├─→ /socket.io/ → 代理到 chatbackend:3001/socket.io/
    └─→ /*          → 返回前端静态文件
```

### 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | 主应用入口 | **推荐使用**，nginx 自动代理前后端 |
| 3000 | 主应用备用端口 | 与 80 端口相同，兼容旧配置 |
| 3001 | 后端 API | 可直连，主要用于调试 |
| 3002 | FlappyBird 游戏 | 独立服务 |
| 27017 | MongoDB | 数据库（不对外开放） |

### 环境变量配置

#### 前端 (.env.production)

```env
NODE_ENV=production

# 生产环境默认使用相对路径，通过 nginx 代理
# 不需要设置 REACT_APP_API_URL 和 REACT_APP_SOCKET_URL

# 如果需要直连后端（跨域部署），才需要设置：
# REACT_APP_API_URL=http://47.118.22.92:3001/api
# REACT_APP_SOCKET_URL=http://47.118.22.92:3001
```

#### 后端 (.env.production)

```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# 允许的跨域来源
ALLOWED_ORIGINS=http://47.118.22.92,http://47.118.22.92:3000,http://47.118.22.92:80

# MongoDB 连接
MONGODB_URI=mongodb://mongodb:27017/ai-chat

# DeepSeek API
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_BASE_URL=https://api.deepseek.com/v1

# JWT 密钥
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d
```

### 快速修复步骤

如果遇到 "Failed to fetch" 错误：

1. **确认访问地址**
   ```bash
   # 应该访问
   http://47.118.22.92
   
   # 而不是
   http://47.118.22.92:3001
   ```

2. **检查服务状态**
   ```bash
   ssh root@47.118.22.92
   cd /root/Ai-chat-Demo
   docker ps
   ```

3. **查看日志**
   ```bash
   # 前端日志
   docker logs chat-ui
   
   # 后端日志
   docker logs chatbackend
   ```

4. **重启服务**
   ```bash
   cd /root/Ai-chat-Demo
   ./docker.sh restart
   ```

5. **清理并重新部署**
   ```bash
   # 在本地
   ./deploy-to-aliyun.sh
   ```

### 防火墙配置

确保阿里云安全组已开放以下端口：

- **80** - HTTP 主入口（必需）
- **3000** - 备用端口（可选）
- **3001** - 后端 API（可选，用于调试）
- **3002** - 游戏服务（可选）
- **22** - SSH（必需）

### 常见问题

#### 1. 无法连接到后端

**症状：** 页面加载但无法登录/注册，控制台显示 "Failed to fetch"

**原因：** 直接访问了 Docker 容器端口而不是 nginx 端口

**解决：** 访问 `http://47.118.22.92` 或 `http://47.118.22.92:3000`，不要访问 `:3001`

#### 2. CORS 错误

**症状：** 控制台显示跨域错误

**原因：** 后端 ALLOWED_ORIGINS 未包含当前访问域名

**解决：** 检查 [.env.production](.env.production) 中的 ALLOWED_ORIGINS 配置

#### 3. Socket.IO 连接失败

**症状：** 实时功能不工作

**原因：** WebSocket 连接未通过 nginx 代理

**解决：** 确认通过 80 或 3000 端口访问（nginx 会自动代理 Socket.IO）

### 测试清单

部署后依次测试：

- [ ] 访问 http://47.118.22.92 可以打开页面
- [ ] 可以成功注册/登录
- [ ] 可以查看菜单和菜品
- [ ] 可以进行点餐
- [ ] 实时座位状态更新正常
- [ ] 可以访问游戏 http://47.118.22.92:3002

### 监控命令

```bash
# 查看所有容器状态
docker ps

# 查看服务日志
docker logs -f chatbackend
docker logs -f chat-ui

# 查看磁盘使用
df -h

# 查看 Docker 资源使用
docker system df

# 进入容器调试
docker exec -it chatbackend sh
docker exec -it chat-ui sh
```
