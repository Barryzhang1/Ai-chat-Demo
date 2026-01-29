# ChatBackEnd 后端项目文档

## 📑 目录

- [ChatBackEnd 后端项目文档](#chatbackend-后端项目文档)
  - [📑 目录](#-目录)
  - [📦 项目信息](#-项目信息)
  - [📁 文件目录结构](#-文件目录结构)
  - [🏗️ 项目结构及描述](#️-项目结构及描述)
    - [核心模块说明](#核心模块说明)
  - [🔌 API 接口列表](#-api-接口列表)
    - [1. 认证模块 (Auth)](#1-认证模块-auth)
    - [2. 智能点餐模块 (Ordering)](#2-智能点餐模块-ordering)
    - [3. 菜品管理模块 (Dish)](#3-菜品管理模块-dish)
    - [4. 类别管理模块 (Category)](#4-类别管理模块-category)
    - [5. 座位管理模块 (Seat)](#5-座位管理模块-seat)
    - [6. DeepSeek AI 模块](#6-deepseek-ai-模块)
  - [💻 技术栈](#-技术栈)
  - [⚙️ 环境变量配置](#️-环境变量配置)
    - [环境变量说明](#环境变量说明)
    - [配置步骤](#配置步骤)
  - [🚀 如何启动](#-如何启动)
    - [开发环境启动](#开发环境启动)
    - [生产环境启动](#生产环境启动)
    - [其他常用命令](#其他常用命令)
  - [📝 开发规范](#-开发规范)
  - [🚨 常见问题](#-常见问题)
  - [📖 参考资源](#-参考资源)

## 📦 项目信息

- **项目名称**: ChatBackEnd (智能餐厅后端系统)
- **框架版本**: NestJS 11.0.1
- **Node.js 版本**: v22.14.0
- **TypeScript**: 5.7.3
- **数据库**: MongoDB + Redis
- **运行端口**: 3001
- **API 文档**: http://localhost:3001/api

## 📁 文件目录结构

```text
ChatBackEnd/
├── src/                            # 源代码目录
│   ├── main.ts                     # 应用入口文件
│   ├── app.module.ts               # 根模块，集成所有功能模块
│   ├── common/                     # 公共资源
│   │   ├── filters/                # HTTP 异常过滤器
│   │   ├── interceptors/           # 响应拦截器、日志拦截器
│   │   ├── guards/                 # 路由守卫
│   │   ├── pipes/                  # 管道
│   │   └── decorators/             # 自定义装饰器
│   ├── redis/                      # Redis 模块
│   │   ├── redis.module.ts         # Redis 模块定义
│   │   └── redis.service.ts        # Redis 服务
│   └── modules/                    # 功能模块目录
│       ├── auth/                   # 认证模块
│       │   ├── auth.controller.ts  # 认证控制器
│       │   ├── auth.service.ts     # 认证服务
│       │   ├── auth.module.ts      # 认证模块
│       │   ├── jwt.strategy.ts     # JWT 策略
│       │   ├── guards/             # 认证守卫
│       │   ├── dto/                # 数据传输对象
│       │   ├── schemas/            # MongoDB 模式
│       │   ├── entities/           # 实体定义
│       │   ├── interfaces/         # 接口定义
│       │   └── doc/                # 模块文档
│       ├── ordering/               # 智能点餐模块
│       │   ├── ordering.controller.ts  # 点餐控制器
│       │   ├── ordering.service.ts     # 点餐服务（AI 推荐）
│       │   ├── ordering.module.ts      # 点餐模块
│       │   ├── dto/                    # 数据传输对象
│       │   ├── schemas/                # MongoDB 模式
│       │   └── doc/                    # 模块文档
│       ├── dish/                   # 菜品管理模块
│       │   ├── dish.controller.ts  # 菜品控制器
│       │   ├── dish.service.ts     # 菜品服务
│       │   ├── dish.module.ts      # 菜品模块
│       │   ├── dto/                # 数据传输对象
│       │   └── entities/           # 实体定义
│       ├── category/               # 类别管理模块
│       │   ├── category.controller.ts  # 类别控制器
│       │   ├── category.service.ts     # 类别服务
│       │   ├── category.module.ts      # 类别模块
│       │   ├── dto/                    # 数据传输对象
│       │   └── schemas/                # MongoDB 模式
│       ├── seat/                   # 座位管理模块
│       │   ├── seat.controller.ts  # 座位控制器
│       │   ├── seat.service.ts     # 座位服务
│       │   ├── seat.module.ts      # 座位模块
│       │   ├── dto/                # 数据传输对象
│       │   └── schemas/            # MongoDB 模式
│       └── deepseek/               # DeepSeek AI 模块
│           ├── deepseek.controller.ts  # AI 控制器
│           ├── deepseek.service.ts     # AI 服务
│           ├── deepseek.module.ts      # AI 模块
│           ├── dto/                    # 数据传输对象
│           ├── entities/               # 实体定义
│           └── doc/                    # 模块文档
├── test/                           # 测试目录
│   └── jest-e2e.json               # E2E 测试配置
├── cache/                          # 缓存目录
│   └── deepseek-cache.json         # DeepSeek API 缓存
├── guide/                          # 配置指南
│   └── DEEPSEEK_SETUP_GUIDE.md     # DeepSeek API 配置指南
├── .env                            # 环境变量配置（不提交到版本控制）
├── .env.example                    # 环境变量示例模板
├── .env.test                       # 测试环境变量
├── package.json                    # 项目依赖和脚本
├── tsconfig.json                   # TypeScript 配置
├── tsconfig.build.json             # 构建配置
├── eslint.config.mjs               # ESLint 配置
├── nest-cli.json                   # NestJS CLI 配置
├── Dockerfile                      # Docker 镜像配置
└── README.md                       # 项目说明
```

## 🏗️ 项目结构及描述

ChatBackEnd 采用 NestJS 框架，遵循模块化、分层架构设计，每个功能模块独立且职责清晰。

### 核心模块说明

| 模块 | 路径 | 功能描述 |
|------|------|----------|
| **认证模块** | `src/modules/auth` | 用户注册、JWT 认证、权限管理 |
| **智能点餐模块** | `src/modules/ordering` | AI 驱动的智能点餐推荐、订单管理 |
| **菜品管理模块** | `src/modules/dish` | 菜品的增删改查、分类、库存管理 |
| **类别管理模块** | `src/modules/category` | 菜品分类管理 |
| **座位管理模块** | `src/modules/seat` | 座位状态管理、排队系统 |
| **DeepSeek AI 模块** | `src/modules/deepseek` | AI 对话、代码解释、智能建议 |
| **Redis 模块** | `src/redis` | 缓存服务、会话管理 |

**技术特性**：
- ✅ 模块化设计，职责单一
- ✅ 依赖注入，松耦合架构
- ✅ DTO 自动验证 (class-validator)
- ✅ Swagger API 文档自动生成
- ✅ 统一异常处理
- ✅ 全局日志记录
- ✅ MongoDB + Redis 双数据库支持
- ✅ JWT 认证和授权
- ✅ WebSocket 实时通信（准备中）

## 🔌 API 接口列表

### 1. 认证模块 (Auth)

**基础路径**: `/api/auth`

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/register` | 用户注册 | ❌ |
| GET | `/me` | 获取当前用户信息 | ✅ |

#### POST `/register` - 用户注册

**请求参数**：
```json
{
  "nickname": "string",  // 用户昵称（必需）
  "role": "customer"     // 用户角色（可选，默认 customer）
}
```

**返回数据**：
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // JWT token
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",     // 用户 ID (UUID)
      "nickname": "用户昵称",                              // 用户昵称
      "createdAt": "2026-01-29T10:00:00.000Z"           // 创建时间
    }
  }
}
```

#### GET `/me` - 获取当前用户信息

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",     // 用户 ID
    "nickname": "用户昵称",                             // 用户昵称
    "createdAt": "2026-01-29T10:00:00.000Z",         // 创建时间
    "updatedAt": "2026-01-29T12:00:00.000Z"          // 更新时间
  }
}
```

**示例**：
```bash
# 注册用户
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname": "张三", "role": "customer"}'

# 获取当前用户信息
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### 2. 智能点餐模块 (Ordering)

**基础路径**: `/api/ordering`

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/ai-order` | AI 智能点餐推荐 | ✅ |
| POST | `/refresh-menu` | 刷新菜单 | ✅ |
| POST | `/create-order` | 创建订单 | ✅ |
| GET | `/history` | 获取订单历史 | ✅ |
| GET | `/reports/today-revenue` | 查询今日总收入 | ❌ |
| GET | `/reports/dish-ranking` | 查询菜品排行榜 | ❌ |

#### POST `/ai-order` - AI 智能点餐推荐

**请求参数**：
```json
{
  "query": "推荐一些健康的晚餐",    // 用户查询（必需）
  "preferences": {                   // 偏好（可选）
    "spicy": false,
    "vegetarian": true
  }
}
```

**返回数据**：
```json
{
  "code": 0,
  "message": "推荐成功",
  "data": {
    "aiResponse": "根据您的需求，推荐以下健康晚餐...",  // AI 回复
    "cart": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "message": "根据您的需求，推荐以下健康晚餐...",
      "dishes": [                                        // 推荐的菜品列表
        {
          "dishId": "65a1b2c3d4e5f6789012345",
          "name": "清炒时蔬",
          "price": 28,
          "categoryId": "65a1b2c3d4e5f678901234a",
          "description": "新鲜蔬菜，清淡健康",
          "tags": ["健康", "素食"],
          "isDelisted": false
        }
      ],
      "totalPrice": 28,
      "lastQuery": "推荐一些健康的晚餐",
      "createdAt": "2026-01-29T10:00:00.000Z",
      "updatedAt": "2026-01-29T10:00:00.000Z"
    }
  }
}
```

#### POST `/refresh-menu` - 刷新菜单

**返回数据**：
```json
{
  "code": 0,
  "message": "菜单已刷新",
  "data": {
    "aiResponse": "为您重新推荐了其他美味菜品...",
    "cart": {
      "dishes": [...],  // 新的推荐菜品列表
      "totalPrice": 156
    }
  }
}
```

#### POST `/create-order` - 创建订单

**请求参数**：
```json
{
  "seatId": "65a1b2c3d4e5f678901234b",  // 座位 ID（可选）
  "note": "少盐少油"                      // 订单备注（可选）
}
```

**返回数据**：
```json
{
  "code": 0,
  "message": "订单创建成功",
  "data": {
    "_id": "65a1b2c3d4e5f678901234c",
    "orderNumber": "ORD20260129001",      // 订单编号
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "seatId": "65a1b2c3d4e5f678901234b",
    "dishes": [...],                      // 订单菜品列表
    "totalPrice": 156,
    "status": "pending",                  // 订单状态
    "note": "少盐少油",
    "createdAt": "2026-01-29T10:00:00.000Z"
  }
}
```

#### GET `/history` - 获取订单历史

**返回数据**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "_id": "65a1b2c3d4e5f678901234c",
      "orderNumber": "ORD20260129001",
      "totalPrice": 156,
      "status": "completed",              // pending/preparing/completed/cancelled
      "createdAt": "2026-01-29T10:00:00.000Z"
    }
  ]
}
```

#### GET `/reports/today-revenue` - 查询今日总收入

**查询参数**：
- `date` (可选): 查询日期，格式YYYY-MM-DD，不传则查询今日

**示例请求**：
```bash
GET /api/ordering/reports/today-revenue
GET /api/ordering/reports/today-revenue?date=2026-01-28
```

**返回数据**：
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "date": "2026-01-29",           // 查询日期
    "totalRevenue": 1580.50,        // 总收入（已完成订单）
    "orderCount": 15                // 订单数量
  }
}
```

**功能说明**：
- 只统计status为'completed'的订单
- 按照订单创建时间(createdAt)过滤指定日期
- 日期范围：00:00:00 到 23:59:59

#### GET `/reports/dish-ranking` - 查询菜品排行榜

**查询参数**：
- `limit` (可选): 返回菜品数量，默认10，最大50

**示例请求**：
```bash
GET /api/ordering/reports/dish-ranking
GET /api/ordering/reports/dish-ranking?limit=20
```

**返回数据**：
```json
{
  "code": 0,
  "message": "查询成功",
  "data": [
    {
      "dishId": "507f1f77bcf86cd799439011",  // 菜品ID
      "dishName": "宫保鸡丁",                 // 菜品名称
      "totalQuantity": 128,                   // 总销量
      "totalRevenue": 3584.00,                // 总收入
      "orderCount": 98                        // 出现在订单中的次数
    },
    {
      "dishId": "507f1f77bcf86cd799439012",
      "dishName": "鱼香肉丝",
      "totalQuantity": 115,
      "totalRevenue": 3220.00,
      "orderCount": 87
    }
  ]
}
```

**功能说明**：
- 只统计status为'completed'的订单
- 按照菜品总销量(totalQuantity)降序排列
- 使用MongoDB聚合管道统计各菜品的销量和收入

**AI 推荐特性**：
- 基于用户偏好的智能推荐
- 考虑季节、天气等因素
- DeepSeek AI 驱动的个性化建议

### 3. 菜品管理模块 (Dish)

**基础路径**: `/api/dish`

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/` | 创建菜品 | ✅ (商家) |
| GET | `/` | 获取所有菜品 | ❌ |
| PUT | `/:id` | 更新菜品信息 | ✅ (商家) |
| PATCH | `/:id/status` | 更新菜品状态 | ✅ (商家) |

#### POST `/` - 创建菜品

**请求参数**：
```json
{
  "name": "宫保鸡丁",                   // 菜品名称（必需）
  "price": 38,                         // 价格（必需）
  "categoryId": "65a1b2c3d4e5f678901234a",  // 分类 ID（必需）
  "description": "经典川菜",            // 描述（可选）
  "tags": ["招牌菜", "微辣"]            // 标签（可选）
}
```

**返回数据**：
```json
{
  "_id": "65a1b2c3d4e5f6789012345",
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "65a1b2c3d4e5f678901234a",
  "description": "经典川菜",
  "tags": ["招牌菜", "微辣"],
  "isDelisted": false,                   // 是否下架
  "createdAt": "2026-01-29T10:00:00.000Z",
  "updatedAt": "2026-01-29T10:00:00.000Z"
}
```

#### GET `/` - 获取所有菜品

**返回数据**：
```json
[
  {
    "_id": "65a1b2c3d4e5f6789012345",
    "name": "宫保鸡丁",
    "price": 38,
    "categoryId": "65a1b2c3d4e5f678901234a",
    "description": "经典川菜",
    "tags": ["招牌菜", "微辣"],
    "isDelisted": false,
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T10:00:00.000Z"
  }
]
```

#### PUT `/:id` - 更新菜品信息

**请求参数**：
```json
{
  "name": "宫保鸡丁（改良版）",
  "price": 42,
  "description": "改良版经典川菜，口味更佳",
  "tags": ["招牌菜", "微辣", "新品"]
}
```

**返回数据**：菜品对象（同创建菜品）

#### PATCH `/:id/status` - 更新菜品状态

**请求参数**：
```json
{
  "isDelisted": true  // 是否下架
}
```

**返回数据**：菜品对象（同创建菜品）

### 4. 类别管理模块 (Category)

**基础路径**: `/api/categories`

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/` | 创建分类 | ✅ (商家) |
| GET | `/` | 获取所有分类 | ❌ |
| GET | `/:id` | 获取分类详情 | ❌ |
| PATCH | `/:id` | 更新分类 | ✅ (商家) |
| DELETE | `/:id` | 删除分类 | ✅ (商家) |

#### POST `/` - 创建分类

**请求参数**：
```json
{
  "name": "热菜",            // 分类名称（必需）
  "description": "各类热菜", // 描述（可选）
  "sortOrder": 1            // 排序（可选）
}
```

**返回数据**：
```json
{
  "_id": "65a1b2c3d4e5f678901234a",
  "name": "热菜",
  "description": "各类热菜",
  "sortOrder": 1,
  "createdAt": "2026-01-29T10:00:00.000Z",
  "updatedAt": "2026-01-29T10:00:00.000Z"
}
```

#### GET `/` - 获取所有分类

**返回数据**：
```json
[
  {
    "_id": "65a1b2c3d4e5f678901234a",
    "name": "热菜",
    "description": "各类热菜",
    "sortOrder": 1,
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T10:00:00.000Z"
  },
  {
    "_id": "65a1b2c3d4e5f678901234b",
    "name": "凉菜",
    "description": "各类凉菜",
    "sortOrder": 2
  }
]
```

#### GET `/:id` - 获取分类详情

**返回数据**：分类对象（同创建分类）

#### PATCH `/:id` - 更新分类

**请求参数**：
```json
{
  "name": "精品热菜",
  "description": "精选热菜系列",
  "sortOrder": 1
}
```

**返回数据**：分类对象（同创建分类）

#### DELETE `/:id` - 删除分类

**返回数据**：
```json
{
  "message": "删除成功"
}
```

### 5. 座位管理模块 (Seat)

**基础路径**: `/api/seats`

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/` | 创建座位 | ✅ (商家) |
| GET | `/` | 获取所有座位 | ❌ |
| GET | `/with-status` | 获取带状态的座位 | ❌ |
| GET | `/available` | 获取可用座位 | ❌ |
| GET | `/statistics` | 获取座位统计 | ✅ (商家) |
| GET | `/:id` | 获取座位详情 | ❌ |
| GET | `/:id/status` | 获取座位状态 | ❌ |
| PATCH | `/:id` | 更新座位信息 | ✅ (商家) |
| DELETE | `/:id` | 删除座位 | ✅ (商家) |
| POST | `/queue/join` | 加入排队 | ✅ |
| DELETE | `/queue/leave` | 离开排队 | ✅ |
| GET | `/queue/list` | 获取排队列表 | ✅ (商家) |
| GET | `/queue/position` | 获取排队位置 | ✅ |

#### POST `/` - 创建座位

**请求参数**：
```json
{
  "seatNumber": "A01",      // 座位号（必需）
  "capacity": 4,            // 可容纳人数（必需）
  "location": "靠窗",       // 位置（可选）
  "description": "景观位"   // 描述（可选）
}
```

**返回数据**：
```json
{
  "_id": "65a1b2c3d4e5f678901234b",
  "seatNumber": "A01",
  "capacity": 4,
  "location": "靠窗",
  "description": "景观位",
  "isDeleted": false,
  "createdAt": "2026-01-29T10:00:00.000Z",
  "updatedAt": "2026-01-29T10:00:00.000Z"
}
```

#### GET `/` - 获取所有座位

**返回数据**：座位对象数组（同创建座位）

#### GET `/with-status` - 获取带状态的座位

**返回数据**：
```json
[
  {
    "_id": "65a1b2c3d4e5f678901234b",
    "seatNumber": "A01",
    "capacity": 4,
    "location": "靠窗",
    "status": "available",     // available/occupied/reserved
    "currentOrder": null,
    "occupiedSince": null
  }
]
```

#### GET `/available` - 获取可用座位

**返回数据**：可用座位数组（同带状态座位）

#### GET `/statistics` - 获取座位统计

**返回数据**：
```json
{
  "total": 20,              // 总座位数
  "available": 12,          // 可用座位数
  "occupied": 7,            // 已占用座位数
  "reserved": 1,            // 预订座位数
  "occupancyRate": 0.35     // 占用率
}
```

#### GET `/:id/status` - 获取座位状态

**返回数据**：
```json
{
  "status": "available",
  "seatNumber": "A01",
  "currentOrder": null,
  "occupiedSince": null
}
```

#### PATCH `/:id` - 更新座位信息

**请求参数**：
```json
{
  "capacity": 6,
  "location": "靠窗VIP",
  "description": "大型景观位"
}
```

**返回数据**：座位对象（同创建座位）

#### DELETE `/:id` - 删除座位（软删除）

**返回数据**：
```json
{
  "message": "座位已删除"
}
```

#### POST `/queue/join` - 加入排队

**请求参数**：
```json
{
  "socketId": "socket_abc123",  // Socket ID（必需）
  "nickname": "张三",            // 昵称（必需）
  "partySize": 4                // 人数（必需）
}
```

**返回数据**：
```json
{
  "position": 3,                // 排队位置
  "estimatedWaitTime": 15,      // 预计等待时间（分钟）
  "queueNumber": "Q003"         // 排队号
}
```

#### DELETE `/queue/leave` - 离开排队

**请求参数**：
```json
{
  "socketId": "socket_abc123"
}
```

**返回数据**：
```json
{
  "message": "已离开排队"
}
```

#### GET `/queue/list` - 获取排队列表

**返回数据**：
```json
[
  {
    "queueNumber": "Q001",
    "nickname": "张三",
    "partySize": 4,
    "joinedAt": "2026-01-29T10:00:00.000Z",
    "position": 1
  }
]
```

#### GET `/queue/position` - 获取排队位置

**查询参数**：`?socketId=socket_abc123`

**返回数据**：
```json
{
  "position": 3,
  "estimatedWaitTime": 15,
  "queueNumber": "Q003"
}
```

### 6. DeepSeek AI 模块

**基础路径**: `/api/deepseek`

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/status` | 检查 API 状态 | ❌ |
| POST | `/suggest` | 获取 AI 建议 | ✅ |
| POST | `/execute` | 执行自定义命令 | ✅ |

#### GET `/status` - 检查 API 状态

**返回数据**：
```json
{
  "available": true,           // API 是否可用
  "version": "v1",            // API 版本
  "model": "deepseek-chat",   // 使用的模型
  "configured": true          // 是否已配置
}
```

或错误时：
```json
{
  "available": false,
  "error": "API Key 未配置"
}
```

#### POST `/suggest` - 获取 AI 建议

**请求参数**：
```json
{
  "prompt": "推荐一些健康的晚餐菜品"  // 提示词（必需）
}
```

**返回数据**：
```json
{
  "success": true,
  "result": "根据健康饮食原则，我推荐以下晚餐菜品...",  // AI 回复
  "executionTime": 1234,                               // 执行时间（毫秒）
  "model": "deepseek-chat",                           // 使用的模型
  "timestamp": "2026-01-29T10:00:00.000Z"
}
```

#### POST `/execute` - 执行自定义命令

**请求参数**：
```json
{
  "command": "analyze",                    // 命令类型
  "prompt": "分析这个菜单的营养搭配",      // 提示词（必需）
  "context": {                             // 上下文（可选）
    "dishes": ["宫保鸡丁", "清炒时蔬"]
  }
}
```

**返回数据**：
```json
{
  "success": true,
  "result": "从营养角度分析，这个菜单搭配合理...",
  "executionTime": 1456,
  "model": "deepseek-chat",
  "timestamp": "2026-01-29T10:00:00.000Z"
}
```

**错误响应**：
```json
{
  "success": false,
  "error": "API 调用失败",
  "details": "余额不足"
}
```

**示例**：
```bash
# 检查 AI 状态
curl http://localhost:3001/api/deepseek/status

# 获取 AI 建议
curl -X POST http://localhost:3001/api/deepseek/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"prompt": "推荐一些健康的晚餐菜品"}'

# 执行自定义命令
curl -X POST http://localhost:3001/api/deepseek/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"command": "analyze", "prompt": "分析菜单营养", "context": {}}'
```

## 💻 技术栈

**核心框架**：
- `@nestjs/common` ^11.0.1 - NestJS 核心功能
- `@nestjs/core` ^11.0.1 - NestJS 核心
- `@nestjs/platform-express` ^11.0.1 - Express 适配器
- `@nestjs/config` ^4.0.2 - 配置管理
- `@nestjs/swagger` ^11.2.5 - API 文档生成

**数据库与缓存**：
- `@nestjs/mongoose` ^11.0.4 - MongoDB 集成
- `mongoose` ^9.1.5 - MongoDB ODM
- `redis` ^5.10.0 - Redis 客户端

**认证与安全**：
- `@nestjs/jwt` ^11.0.2 - JWT 认证
- `@nestjs/passport` ^11.0.5 - Passport 集成
- `passport` ^0.7.0 - 认证中间件
- `passport-jwt` ^4.0.1 - JWT 策略

**实时通信**：
- `@nestjs/websockets` ^11.1.12 - WebSocket 支持
- `@nestjs/platform-socket.io` ^11.1.12 - Socket.IO 适配器
- `socket.io` ^4.8.3 - Socket.IO 服务端
- `socket.io-client` ^4.8.3 - Socket.IO 客户端

**验证与转换**：
- `class-validator` ^0.14.3 - DTO 验证
- `class-transformer` ^0.5.1 - 对象转换

**开发工具**：
- `typescript` ^5.7.3 - TypeScript 编译器
- `typescript-eslint` ^8.20.0 - TypeScript ESLint
- `eslint` ^9.18.0 - 代码检查
- `prettier` ^3.4.2 - 代码格式化
- `jest` ^30.0.0 - 测试框架

## ⚙️ 环境变量配置

### 环境变量说明

项目使用 `.env` 文件管理环境变量配置。以下是所有可用的环境变量及其说明：

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `NODE_ENV` | string | development | 运行环境（development/production/test） |
| `PORT` | number | 3001 | 后端服务端口 |
| `HOST` | string | 0.0.0.0 | 服务监听地址 |
| `DEEPSEEK_API_KEY` | string | - | DeepSeek AI API 密钥（**必需**） |
| `ALLOWED_ORIGINS` | string | http://localhost:3000 | CORS 允许的前端地址（逗号分隔） |
| `MONGO_HOST` | string | localhost | MongoDB 主机地址 |
| `MONGO_PORT` | string | 27017 | MongoDB 端口 |
| `MONGO_USER` | string | root | MongoDB 用户名 |
| `MONGO_PASSWORD` | string | password | MongoDB 密码 |
| `MONGO_DATABASE` | string | restaurant | MongoDB 数据库名 |
| `MONGO_AUTH_SOURCE` | string | admin | MongoDB 认证数据库 |
| `JWT_SECRET` | string | - | JWT 签名密钥（**必需**） |
| `JWT_EXPIRATION` | number | 86400 | JWT 过期时间（秒） |

### 配置步骤

**1. 复制环境变量模板**

```bash
cd ChatBackEnd
cp .env.example .env
```

**2. 编辑 `.env` 文件**

使用任意文本编辑器打开 `.env` 文件，填写必要的配置：

```bash
# 应用配置
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# DeepSeek API（必须配置）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# CORS 配置
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# MongoDB 数据库配置
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_USER=root
MONGO_PASSWORD=password
MONGO_DATABASE=restaurant
MONGO_AUTH_SOURCE=admin

# JWT 配置（生产环境必须修改）
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRATION=86400
```

**3. 获取 DeepSeek API 密钥**

1. 访问 [DeepSeek 平台](https://platform.deepseek.com)
2. 注册并登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制 API Key 并填入 `.env` 文件

详细配置指南请参考：[ChatBackEnd/guide/DEEPSEEK_SETUP_GUIDE.md](../ChatBackEnd/guide/DEEPSEEK_SETUP_GUIDE.md)

**4. 生成 JWT 密钥**

```bash
# 生成随机密钥（推荐）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将生成的密钥填入 `JWT_SECRET`。

**⚠️ 重要提示**：
- 不要将 `.env` 文件提交到版本控制系统
- 生产环境务必修改默认密码和密钥
- 定期轮换 API 密钥和 JWT 密钥
- 使用强密码和复杂密钥

## 🚀 如何启动

### 开发环境启动

**方式一：使用启动脚本（推荐）**

```bash
cd /Users/bzhang1/Desktop/Ai-chat-Demo
./start-backend.sh
```

此脚本会自动：
- 检查 `.env` 文件是否存在
- 检查 MongoDB 是否运行
- 安装依赖（如果需要）
- 启动开发服务器

**方式二：手动启动**

```bash
# 1. 进入项目目录
cd ChatBackEnd

# 2. 安装依赖（首次运行）
npm install

# 3. 确保 MongoDB 正在运行
# Docker 方式：
docker-compose -f docker-compose.db.yml up -d

# 或使用本地 MongoDB 服务

# 4. 启动开发服务器（带热重载）
npm run start:dev
```

**启动成功标志**：

```text
[Nest] 12345  - 2026/01/29 10:00:00     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 2026/01/29 10:00:00     LOG [InstanceLoader] ConfigModule dependencies initialized +20ms
[Nest] 12345  - 2026/01/29 10:00:00     LOG [InstanceLoader] MongooseModule dependencies initialized +50ms
[Nest] 12345  - 2026/01/29 10:00:00     LOG [Bootstrap] Application is running on: http://0.0.0.0:3001
```

访问 Swagger API 文档：http://localhost:3001/api

### 生产环境启动

```bash
# 1. 构建项目
npm run build

# 2. 启动生产服务器
npm run start:prod
```

**使用 Docker 部署**：

```bash
# 构建镜像
docker build -t chatbackend:latest .

# 运行容器
docker run -d \
  --name chatbackend \
  -p 3001:3001 \
  --env-file .env \
  chatbackend:latest
```

### 其他常用命令

```bash
# 开发模式（带热重载）
npm run start:dev

# 调试模式
npm run start:debug

# 单元测试
npm run test

# 测试覆盖率
npm run test:cov

# E2E 测试
npm run test:e2e

# 代码检查
npm run lint

# 自动修复代码问题
npm run lint -- --fix

# 代码格式化
npm run format

# 更新菜品数据（自定义脚本）
npm run update-dishes

# 随机分配菜品分类（自定义脚本）
npm run random-assign-category
```

## 📝 开发规范

项目严格遵循 NestJS 企业级开发规范，详见 [backend-code-specifications.md](./skills/bankend/SKILL.md)

**核心规范**：

1. **模块化设计**
   - 按功能领域划分模块
   - 遵循单一职责原则
   - 模块间低耦合

2. **依赖注入**
   - 构造函数注入
   - 使用 TypeScript 类型自动解析
   - 避免循环依赖

3. **RESTful API 设计**
   - 统一路由风格
   - 资源名称使用复数形式
   - HTTP 方法语义正确

4. **DTO 验证**
   - 使用 class-validator 进行请求数据验证
   - 定义清晰的 DTO 类
   - 使用装饰器进行验证规则声明

5. **异常处理**
   - 使用 NestJS 内置异常类
   - 统一错误响应格式
   - 记录关键错误日志

6. **日志管理**
   - 使用 Logger 记录关键操作
   - 日志级别合理
   - 包含必要的上下文信息

7. **API 文档**
   - Swagger 自动生成
   - 详细的接口描述
   - 示例请求和响应

8. **代码风格**
   - ESLint + Prettier 保证代码质量
   - 遵循 TypeScript 最佳实践
   - 注释清晰准确

9. **测试**
   - 单元测试覆盖核心逻辑
   - E2E 测试覆盖关键流程
   - Mock 外部依赖

10. **安全**
    - 输入验证
    - SQL/NoSQL 注入防护
    - 敏感信息加密存储

## 🚨 常见问题

### 1. 端口被占用

**错误**：`Error: listen EADDRINUSE: address already in use :::3001`

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :3001

# 杀死进程
kill -9 <PID>

# 或修改 .env 文件中的 PORT 变量
```

### 2. MongoDB 连接失败

**错误**：`MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**解决方案**：
```bash
# 检查 MongoDB 是否运行
docker ps | grep mongo

# 启动 MongoDB
docker-compose -f docker-compose.db.yml up -d

# 或启动本地 MongoDB 服务
brew services start mongodb-community
```

### 3. DeepSeek API 错误

**错误**: `402 Payment Required`

**原因**: 账户余额不足

**解决方案**: 登录 DeepSeek 平台充值

---

**错误**: `401 Unauthorized`

**原因**: API Key 无效或过期

**解决方案**: 重新生成 API Key 并更新 `.env` 文件

---

**错误**: `DEEPSEEK_API_KEY not configured`

**原因**: 环境变量未配置

**解决方案**: 检查 `.env` 文件是否存在并包含正确的 API Key

### 4. 模块解析错误

**错误**: `Cannot find module 'xxx'`

**解决方案**:
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 清理缓存
npm cache clean --force
```

### 5. TypeScript 编译错误

**错误**: `TS2307: Cannot find module 'xxx' or its corresponding type declarations`

**解决方案**:
```bash
# 确保导入路径包含 .js 扩展名（nodenext 模块解析）
import { xxx } from './xxx.js';

# 重新构建
npm run build
```

### 6. 测试 API 连接

```bash
# 快速测试健康检查
curl http://localhost:3001/api/deepseek/status

# 测试用户注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "role": "customer"}'
```

### 7. 查看日志

```bash
# 开发模式日志会实时显示在终端

# 生产模式查看日志
pm2 logs chatbackend

# Docker 查看日志
docker logs -f chatbackend
```

## 📖 参考资源

- [NestJS 官方文档](https://docs.nestjs.com)
- [NestJS GitHub](https://github.com/nestjs/nest)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [DeepSeek 配置指南](../ChatBackEnd/guide/DEEPSEEK_SETUP_GUIDE.md)
- [MongoDB 文档](https://docs.mongodb.com)
- [Redis 文档](https://redis.io/documentation)
- [Swagger/OpenAPI 规范](https://swagger.io/specification/)
- [后端代码规范](./skills/bankend/SKILL.md)

---

**项目状态**: ✅ 运行中  
**AI 集成**: ✅ DeepSeek API 已集成  
**创建日期**: 2026年1月23日  
**最后更新**: 2026年1月29日  
**服务地址**: http://localhost:3001  
**API 文档**: http://localhost:3001/api  
**技术栈**: NestJS 11.x + TypeScript 5.7 + MongoDB + Redis + DeepSeek AI
