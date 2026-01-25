# Docker 部署指南

## 项目架构

本项目包含以下服务：
- **MongoDB**: 数据库服务（端口 27017）
- **ChatBackEnd**: NestJS 后端服务（端口 3001）
- **ChatUI**: React 前端界面（端口 3000）
- **FlappyBird**: 游戏服务（端口 3002）

## 快速开始

### 1. 环境准备

确保已安装：
- Docker (>= 20.10)
- Docker Compose (>= 1.29)

### 2. 配置环境变量

在项目根目录创建 `.env` 文件（可选）：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 3. 构建和启动所有服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 访问服务

- 前端 UI: http://localhost:3000
- 后端 API: http://localhost:3001/api
- 游戏: http://localhost:3002
- MongoDB: localhost:27017

### 5. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 单独管理服务

```bash
# 只启动特定服务
docker-compose up -d chatbackend

# 重启服务
docker-compose restart chatui

# 查看特定服务日志
docker-compose logs -f chatbackend

# 进入容器
docker-compose exec chatbackend sh
```

## 开发模式

如果需要在开发模式下运行某个服务：

```bash
# 停止容器化的服务
docker-compose stop chatbackend

# 本地运行
cd ChatBackEnd
npm run start:dev
```

## 生产部署

### 构建优化的镜像

```bash
# 构建生产镜像
docker-compose build --no-cache

# 推送到镜像仓库
docker tag ai-chat-demo_chatbackend:latest your-registry/chatbackend:v1.0
docker push your-registry/chatbackend:v1.0
```

### 数据备份

```bash
# 备份 MongoDB 数据
docker-compose exec mongodb mongodump --out /data/backup

# 从容器复制备份
docker cp chat-mongodb:/data/backup ./backup
```

## 故障排查

### 查看日志
```bash
docker-compose logs -f [service-name]
```

### 重建服务
```bash
docker-compose up -d --build --force-recreate [service-name]
```

### 清理资源
```bash
# 清理未使用的镜像
docker image prune -a

# 清理所有资源
docker system prune -a --volumes
```

## 端口映射

| 服务 | 容器端口 | 主机端口 |
|------|---------|---------|
| MongoDB | 27017 | 27017 |
| ChatBackEnd | 3001 | 3001 |
| ChatUI | 3000 | 3000 |
| FlappyBird | 3002 | 3002 |

## 健康检查

所有服务都配置了健康检查：
- MongoDB: 每 10 秒检查数据库连接
- ChatBackEnd: 每 30 秒检查 API 响应

查看健康状态：
```bash
docker-compose ps
```

## 注意事项

1. 首次启动可能需要几分钟来构建镜像
2. 确保端口 3000, 3001, 3002, 27017 未被占用
3. MongoDB 数据持久化在 `./ChatBackEnd/mongo-data` 目录
4. 生产环境请修改默认的密钥和密码
