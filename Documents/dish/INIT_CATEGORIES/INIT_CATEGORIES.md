# 菜品类别初始化脚本使用说明

## 概述

本项目提供了两个脚本用于初始化10个菜品类别到MongoDB数据库：

1. **init-categories.sh** - 通用版本（本地MongoDB）
2. **init-categories-docker.sh** - Docker版本（Docker容器中的MongoDB）

## 初始化的类别列表

脚本会初始化以下10个菜品类别（按sortOrder排序）：

| 序号 | 类别名称 | sortOrder | 状态 |
|------|---------|-----------|------|
| 1 | 凉菜 | 10 | 启用 |
| 2 | 热菜 | 9 | 启用 |
| 3 | 汤羹 | 8 | 启用 |
| 4 | 主食 | 7 | 启用 |
| 5 | 小吃 | 6 | 启用 |
| 6 | 甜品 | 5 | 启用 |
| 7 | 饮品 | 4 | 启用 |
| 8 | 海鲜 | 3 | 启用 |
| 9 | 素食 | 2 | 启用 |
| 10 | 特色菜 | 1 | 启用 |

## 使用方法

### 方法一：本地MongoDB（推荐用于开发环境）

使用 `init-categories.sh` 脚本：

```bash
# 1. 添加执行权限
chmod +x init-categories.sh

# 2. 使用默认配置运行（localhost:27017）
./init-categories.sh

# 3. 或者自定义MongoDB连接参数
MONGO_HOST=localhost \
MONGO_PORT=27017 \
MONGO_USER=root \
MONGO_PASSWORD=password \
MONGO_DATABASE=restaurant \
./init-categories.sh
```

**环境变量说明：**
- `MONGO_HOST`: MongoDB主机地址（默认：localhost）
- `MONGO_PORT`: MongoDB端口（默认：27017）
- `MONGO_USER`: MongoDB用户名（默认：root）
- `MONGO_PASSWORD`: MongoDB密码（默认：password）
- `MONGO_DATABASE`: 数据库名称（默认：restaurant）
- `MONGO_AUTH_SOURCE`: 认证数据库（默认：admin）

### 方法二：Docker环境（推荐用于生产环境）

使用 `init-categories-docker.sh` 脚本：

```bash
# 1. 确保MongoDB容器正在运行
docker-compose -f docker-compose.db.yml up -d

# 2. 添加执行权限
chmod +x init-categories-docker.sh

# 3. 运行脚本
./init-categories-docker.sh
```

## 脚本特性

### 安全性
- ✅ **幂等性**：可以多次运行，不会创建重复数据
- ✅ **Upsert操作**：如果类别已存在则更新，不存在则创建
- ✅ **错误处理**：提供详细的错误信息和连接检查

### 功能
- 🔍 自动检查MongoDB连接状态
- 📊 显示操作统计（新增、更新、错误数量）
- 🎨 彩色输出，易于查看执行结果
- ⚙️ 支持环境变量配置

## 脚本输出示例

```
================================
菜品类别初始化脚本
================================
连接信息:
  数据库: restaurant
  主机: localhost:27017

检查MongoDB连接...
✓ MongoDB连接成功

准备插入10个菜品类别...

✓ 新增类别: 凉菜
✓ 新增类别: 热菜
✓ 新增类别: 汤羹
✓ 新增类别: 主食
✓ 新增类别: 小吃
✓ 新增类别: 甜品
✓ 新增类别: 饮品
✓ 新增类别: 海鲜
✓ 新增类别: 素食
✓ 新增类别: 特色菜

================================
初始化完成
================================
新增: 10 个类别
更新: 0 个类别
错误: 0 个
总计类别数: 10
================================

================================
✓ 菜品类别初始化成功！
================================
```

## 验证初始化结果

### 方法1：使用MongoDB Shell

```bash
# 本地MongoDB
mongosh mongodb://localhost:27017/restaurant

# Docker MongoDB
docker exec -it chat-mongodb mongosh -u root -p password --authenticationDatabase admin restaurant

# 查询所有类别
db.categories.find().pretty()

# 查询类别数量
db.categories.countDocuments()
```

### 方法2：使用后端API

```bash
# 启动后端服务
cd ChatBackEnd
npm run start:dev

# 调用API查询类别
curl http://localhost:3001/categories
```

### 方法3：通过前端界面

1. 启动前端服务：`cd ChatUI && npm start`
2. 访问商家管理页面
3. 进入"类别管理"查看初始化的类别

## 常见问题

### Q1: 提示"无法连接到MongoDB"
**解决方案：**

**步骤1：确认使用正确的脚本版本**
```bash
# 如果使用Docker部署（推荐）
docker-compose -f docker-compose.db.yml up -d
chmod +x init-categories-docker.sh
./init-categories-docker.sh

# 如果使用本地MongoDB，继续下面的步骤
```

**步骤2：检查MongoDB服务状态**
```bash
# macOS - 检查MongoDB是否运行
brew services list | grep mongodb

# 检查端口占用
lsof -i :27017

# 查看MongoDB进程
ps aux | grep mongod
```

**步骤3：启动MongoDB服务**
```bash
# macOS - 使用Homebrew
brew services start mongodb-community

# 或者手动启动（需要先安装MongoDB）
mongod --config /usr/local/etc/mongod.conf

# 如果没有安装MongoDB，建议使用Docker版本
docker-compose -f docker-compose.db.yml up -d
./init-categories-docker.sh
```

**步骤4：验证连接**
```bash
# 测试MongoDB连接
mongosh --eval "db.version()"

# 如果上述命令成功，再运行初始化脚本
./init-categories.sh
```

**步骤5：检查认证设置**
```bash
# 如果MongoDB需要认证，使用环境变量
MONGO_USER=root \
MONGO_PASSWORD=password \
MONGO_AUTH_SOURCE=admin \
./init-categories.sh

# 或者使用Docker版本（已内置认证）
./init-categories-docker.sh
```

### Q2: 提示"command not found: mongosh"
**解决方案：**
```bash
# macOS
brew install mongosh

# Linux (Ubuntu/Debian)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-mongosh

# 或使用Docker版本脚本
./init-categories-docker.sh
```

### Q3: 如何清空已有类别重新初始化？
**方案1：删除所有类别**
```bash
mongosh mongodb://localhost:27017/restaurant
db.categories.deleteMany({})
exit
./init-categories.sh
```

**方案2：修改脚本添加删除逻辑**
在脚本中的MongoDB命令部分添加：
```javascript
// 清空现有类别
db.categories.deleteMany({});
```

### Q4: Docker版本提示找不到容器
**解决方案：**
```bash
# 检查容器名称
docker ps -a | grep mongo

# 默认容器名称为 chat-mongodb
# 如果容器名称不同，修改脚本中的CONTAINER_NAME变量
# 或手动指定容器名称
docker exec -i <your-container-name> mongosh ...
```

## 故障排查流程图

```
遇到连接错误
    ↓
是否使用Docker部署？
    ↓
是 → 执行: docker-compose -f docker-compose.db.yml up -d
    → 使用: ./init-categories-docker.sh
    ↓
否 → 检查MongoDB是否安装？
    ↓
未安装 → 选项A: brew install mongodb-community
        → 选项B: 使用Docker版本（推荐）
    ↓
已安装 → 检查是否运行: ps aux | grep mongod
    ↓
未运行 → 启动服务: brew services start mongodb-community
    ↓
已运行 → 测试连接: mongosh --eval "db.version()"
    ↓
连接成功 → 运行脚本: ./init-categories.sh
```

## 推荐配置

**对于开发环境（推荐使用Docker）：**
```bash
# 1. 启动数据库
docker-compose -f docker-compose.db.yml up -d

# 2. 等待启动完成（约5-10秒）
docker logs chat-mongodb

# 3. 初始化类别
chmod +x init-categories-docker.sh
./init-categories-docker.sh

# 4. 验证结果
chmod +x verify-categories.sh
./verify-categories.sh --docker
```

## 与其他脚本的集成

可以将此脚本集成到项目的启动流程中：

```bash
# 在 start.sh 中添加
echo "初始化数据库..."
./init-categories-docker.sh

echo "启动后端服务..."
./start-backend.sh
```

## 技术细节

### 数据Schema
类别数据遵循以下Schema（定义在 `ChatBackEnd/src/modules/category/schemas/category.schema.ts`）：

```typescript
{
  name: string;        // 类别名称（唯一）
  sortOrder: number;   // 排序顺序（数字越大越靠前）
  isActive: boolean;   // 是否启用
  createdAt: Date;     // 创建时间
  updatedAt: Date;     // 更新时间
}
```

### Upsert逻辑
脚本使用MongoDB的 `updateOne` + `upsert` 操作：
- 根据 `name` 字段查找类别
- 如果存在：更新 `sortOrder`、`isActive` 和 `updatedAt`
- 如果不存在：创建新文档，包含所有字段

## 参考文档

- [菜品模块需求文档](Documents/dish.md)
- [Category Schema](ChatBackEnd/src/modules/category/schemas/category.schema.ts)
- [Category Service](ChatBackEnd/src/modules/category/category.service.ts)
- [Category API](ChatBackEnd/src/modules/category/category.controller.ts)

## 许可证

本脚本属于 Ai-chat-Demo 项目的一部分。
