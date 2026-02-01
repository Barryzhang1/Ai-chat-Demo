# 游戏排行榜功能需求文档

## 1. 系统概述

实现FlappyBird游戏的分数统计和排行榜展示功能，玩家在游戏结束后自动提交分数，商家可以在管理后台查看游戏排行榜。

## 2. 架构设计

### 2.1 系统架构
```
FlappyBird (前端游戏) 
    ↓ (游戏结束时提交分数)
ChatBackEnd (后端API)
    ↓ (存储到数据库)
MongoDB (数据持久化)
    ↓ (查询排行榜)
ChatUI (商家管理界面展示)
```

### 2.2 数据流
1. 游戏结束 → FlappyBird提交分数到后端
2. 后端接收 → 验证并存储到MongoDB
3. 商家查看 → ChatUI请求排行榜数据
4. 后端返回 → 按分数排序的排行榜列表

## 3. 功能特性

### 3.1 FlappyBird游戏端
- 游戏结束时自动提交分数
- 获取当前登录用户信息（如果已登录）
- 支持匿名玩家提交分数
- 提交失败时本地记录

### 3.2 ChatBackEnd后端
- 提供游戏分数提交API
- **每个玩家只保留最高分记录**
  - 首次提交：创建新记录
  - 再次提交更高分数：更新原记录
  - 再次提交更低分数：保留原记录，不更新
- 提供游戏排行榜查询API
- 支持分页查询
- 支持按时间范围筛选（日榜、周榜、月榜、总榜）
- 记录玩家信息（用户名、提交时间、分数）

### 3.3 ChatUI商家管理界面
- 在商家管理界面添加"游戏排行榜"菜单
- 展示排行榜列表（排名、玩家、分数、时间）
- 支持切换不同榜单类型（日榜、周榜、月榜、总榜）
- 支持导出排行榜数据

## 4. 技术实现

### 4.1 数据模型
```typescript
GameScore {
  _id: ObjectId,
  playerId: string,          // 玩家ID（如果已登录）
  playerName: string,        // 玩家名称
  score: number,             // 游戏分数
  gameType: string,          // 游戏类型（FlappyBird）
  playTime: Date,            // 游戏时长（秒）
  createdAt: Date,           // 提交时间
  updatedAt: Date            // 更新时间
}
```

### 4.2 技术栈
- **FlappyBird**: React, Canvas API, Fetch API
- **ChatBackEnd**: NestJS, MongoDB, Mongoose
- **ChatUI**: React, Ant Design

## 5. API 接口文档

### 5.1 提交游戏分数
```
POST /api/game-scores
Content-Type: application/json

Request Body:
{
  "playerName": "玩家昵称",
  "score": 100,
  "gameType": "FlappyBird",
  "playTime": 60
}

Response:
{
  "code": 201,
  "message": "分数提交成功",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "score": 100,
    "rank": 10,
    "isNewRecord": true,      // 是否为新创建的记录
    "isHighScore": true       // 是否打破了该玩家的最高分
  }
}

说明：
- 每个玩家（通过playerName识别）只保留一条最高分记录
- 如果新提交的分数高于已有记录，则更新分数
- 如果新提交的分数低于已有记录，则保留原分数，返回原最高分
```

### 5.2 查询游戏排行榜
```
GET /api/game-scores/leaderboard?gameType=FlappyBird&period=all&page=1&limit=100

Query Parameters:
- gameType: 游戏类型（FlappyBird）
- period: 时间范围（today/week/month/all）
- page: 页码（默认1）
- limit: 每页数量（默认100）

Response:
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "playerName": "玩家A",
        "score": 150,
        "rank": 1,
        "createdAt": "2026-02-02T10:00:00Z"
      }
    ],
    "total": 500,
    "page": 1,
    "limit": 100
  }
}
```

## 6. 数据模型

### 6.1 GameScore Collection
```javascript
{
  _id: ObjectId,
  playerId: String,          // 索引
  playerName: String,
  score: Number,             // 索引（降序）
  gameType: String,          // 索引
  playTime: Number,
  createdAt: Date,           // 索引
  updatedAt: Date
}

// 复合索引
{ gameType: 1, score: -1, createdAt: -1 }
{ gameType: 1, createdAt: -1 }
```

## 7. 使用指南

### 7.1 玩家使用流程
1. 打开FlappyBird游戏
2. 开始游戏
3. 游戏结束后自动提交分数
4. 查看自己的排名

### 7.2 商家使用流程
1. 登录商家管理后台
2. 点击"游戏排行榜"菜单
3. 选择榜单类型（日榜/周榜/月榜/总榜）
4. 查看排行榜数据
5. 可导出数据用于活动奖励

## 8. 注意事项

1. 分数提交需要防刷机制（后期可添加）
2. 匿名玩家通过设备指纹识别（后期优化）
3. 排行榜数据需要缓存提升性能
4. 考虑数据隐私保护
5. 异常情况下确保数据一致性
