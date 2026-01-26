# Ai Chat Demo 项目

一个集成了聊天、点餐和游戏功能的全栈应用。

## 项目结构

```
Ai-chat-Demo/
├── ChatBackEnd/       # NestJS 后端服务
├── ChatUI/           # React 前端应用
├── FlappyBird/       # Flappy Bird 游戏
├── Documents/        # 项目文档
└── mongo-data/       # MongoDB 数据目录
```

## 快速开始

### 启动整个项目

```bash
./start.sh
```

这将启动后端、前端和 FlappyBird 游戏。

### 分别启动各个服务

```bash
# 启动后端
./start-backend.sh

# 启动前端
./start-ui.sh

# 启动 FlappyBird
./start-flappybird.sh
```

## 可用脚本

### 数据管理脚本

#### 1. 随机分配分类

为数据库中的所有菜品随机分配分类。

```bash
# 方式1：使用 Shell 脚本（推荐）
./random-assign-category.sh

# 方式2：直接运行 npm 命令
cd ChatBackEnd
npm run random-assign-category
```

**功能说明**:
- 从数据库中读取所有分类和菜品
- 为每道菜品随机分配一个分类
- 显示详细的执行进度和结果

**详细文档**: [Documents/scripts/random-assign-category.md](Documents/scripts/random-assign-category.md)

#### 2. 更新菜品信息

更新特定菜品的属性（辣度、配料、烹饪时间等）。

```bash
cd ChatBackEnd
npm run update-dishes
```

#### 3. 初始化菜品数据

批量插入测试菜品数据。

```bash
node seed-dishes.js
```

### 开发脚本

```bash
# 后端开发模式
cd ChatBackEnd
npm run start:dev

# 前端开发模式
cd ChatUI
npm run dev

# 运行测试
cd ChatBackEnd
npm run test

# 运行 E2E 测试
cd ChatBackEnd
npm run test:e2e
```

### Docker 部署

```bash
# 构建和启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 部署到阿里云
./deploy-to-aliyun.sh
```

## 项目端口

- **后端 API**: http://localhost:3000
- **前端应用**: http://localhost:8080
- **FlappyBird**: http://localhost:8082
- **MongoDB**: localhost:27017

## 主要功能

### 1. 用户功能
- 聊天功能
- 在线点餐
- 语音识别点餐
- FlappyBird 游戏

### 2. 商家功能
- 菜品管理（增删改查）
- 类别管理
- 订单管理
- 数据报表
- 游戏排行榜

## 技术栈

### 后端
- **框架**: NestJS
- **数据库**: MongoDB with Mongoose
- **认证**: JWT
- **API 文档**: Swagger

### 前端
- **框架**: React
- **UI 库**: Ant Design Mobile
- **路由**: React Router
- **构建工具**: Webpack

### 游戏
- **引擎**: Phaser 3
- **语言**: TypeScript

## 开发规范

- **后端规范**: [.github/skills/backend-code-specifications.md](.github/skills/backend-code-specifications.md)
- **前端规范**: [.github/skills/fontend-code-specifications.md](.github/skills/fontend-code-specifications.md)
- **开发流程**: [development_workflow.md](development_workflow.md)

## 文档

### 功能文档
- [认证模块](Documents/auth.md)
- [菜品模块](Documents/dish.md)
- [点餐流程](Documents/ordering-food-work-process.md)

### 部署文档
- [Docker 部署](Documents/DOCKER_DEPLOYMENT.md)
- [阿里云部署](Documents/DEPLOYMENT.md)
- [MongoDB 外部访问](Documents/MONGODB_EXTERNAL_ACCESS.md)
- [JWT 配置](Documents/JWT_SETUP.md)

### 脚本文档
- [随机分配分类脚本](Documents/scripts/random-assign-category.md)

## 故障排查

### 后端无法启动

1. 检查 MongoDB 是否运行
2. 检查端口 3000 是否被占用
3. 检查环境变量配置

### 前端无法连接后端

1. 确认后端服务正在运行
2. 检查 API 地址配置
3. 查看浏览器控制台错误信息

### 数据库连接失败

1. 确认 MongoDB 服务运行中
2. 检查数据库连接字符串
3. 验证数据库用户名和密码

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。
