# 点餐模块 (Ordering Module)

## 模块概述

点餐模块提供基于DeepSeek AI的智能点餐功能，支持自然语言交互、购物车管理和订单生成。用户可以通过对话方式描述就餐需求，AI将根据用户偏好智能推荐菜品，并完成从选菜到下单的完整流程。

## 功能列表

### 1. AI智能点餐
- **功能描述**：通过DeepSeek AI对话接口，理解用户就餐需求，智能推荐菜品并添加到购物车
- **详细需求**：[AI智能点餐需求](./ordering/ai-ordering.md)
- **国际化补充**：进入聊天界面后的欢迎提示使用前端 i18n 文案，随语言切换显示

### 2. 刷新菜单
- **功能描述**：根据用户保存的查询条件，使用随机采样重新查询菜品，更新推荐列表
- **详细需求**：[刷新菜单需求](./refresh-menu.md)
- **前端实现**：✅ 已集成到用户点餐界面
  - 文件位置：`ChatUI/src/pages/UserOrder/UserOrder.js`
  - UI位置：菜单推荐卡片底部的操作区域
  - 按钮样式：🔄 刷新（默认颜色） + 支付（成功色）
  - 交互流程：
    1. 点击刷新按钮
    2. 显示加载动画："正在为您重新推荐菜品..."
    3. 调用 `POST /ordering/refresh-menu` 接口
    4. 展示新的推荐菜单
  - 用户体验：
    - 加载中禁用按钮防止重复点击
    - 友好的错误提示
    - 只在未确认订单且非历史消息时显示
- **实现日期**：2026-02-02

### 3. 编辑购物车
- **功能描述**：允许用户编辑购物车中的菜品数量，支持从AI推荐或菜单列表中修改
- **API接口**：`PUT /ordering/cart`
- **测试用例**：[编辑购物车测试用例](./ordering/cart-edit.testcase.md)
- **实现文档**：[购物车编辑实现](./ordering/cart-edit-implementation.md)
- **实现要点**：
  - 打开菜单时自动获取并显示购物车内容
  - 修改菜品数量后实时更新总价
  - 确认选择后同步更新到后端购物车

#### 3.1 购物车实时更新（2026-02-02 新增）
- **功能描述**：用户在菜单 popup 中修改菜品数量时，自动实时调用购物车编辑 API
- **实现文档**：[购物车实时更新实现](./ordering/cart-realtime-update.md)
- **测试用例**：[购物车实时更新测试用例](./ordering/cart-realtime-update.testcase.md)
- **核心特性**：
  - 使用 800ms 防抖机制避免频繁请求
  - 静默后台更新，不打扰用户操作
  - 组件卸载时清理定时器，防止内存泄漏
  - 完全兼容现有"确认选择"功能

### 4. 创建订单
- **功能描述**：基于购物车内容生成正式订单，保存到数据库
- **详细需求**：[创建订单需求](./ordering/create-order.md)

### 5. 清空购物车和聊天历史（2026-02-02 新增）
- **功能描述**：每次重新进入聊天界面时清空购物车和聊天历史，开启新的点餐会话
- **API接口**：`POST /ordering/clear-cart`
- **测试用例**：[清空购物车测试用例](./ordering/clear-cart.testcase.md)
- **实现要点**：
  - 清空购物车中的所有菜品
  - 清空购物车中的查询条件
  - 重置购物车总价为 0
  - 清空聊天历史记录
  - 如果购物车或聊天历史不存在，不抛出异常
- **使用场景**：
  - 前端在进入聊天界面时调用此接口
  - 确保每次进入都是全新的点餐体验
  - 避免历史数据干扰新的点餐流程

### 6. 修改订单状态
- **功能描述**：允许用户修改自己订单的状态，用于订单状态流转管理
- **详细需求**：支持将订单状态在 pending, confirmed, preparing, completed, cancelled 之间切换
- **测试用例**：[修改订单状态测试用例](./ordering/update-order-status.testcase.md)

### 7. 订单 Socket 实时更新（2026-02-06 新增）
- **功能描述**：通过 WebSocket 实时推送订单创建和状态变更通知，商家端订单列表自动刷新
- **Socket Namespace**：`/order`（独立于座位管理 `/seat` 和聊天）
- **测试用例**：[订单 Socket 实时更新测试用例](./ordering/order-socket.testcase.md)
- **核心特性**：
  - 订单创建时广播 `orderUpdated` 事件（event: 'created'）
  - 订单状态变更时广播 `orderUpdated` 事件（event: 'statusChanged'）
  - 前端订单列表页面实时刷新，无需手动下拉
  - 多设备/多浏览器订单状态实时同步
  - Toast 提示通知商家有新订单或订单更新
- **实现要点**：
  - 后端：`order.gateway.ts` 实现独立的 WebSocket Gateway
  - 后端：`ordering.service.ts` 在创建订单和更新状态时触发广播
  - 前端：`OrderList.js` 连接 Socket 并监听 `orderUpdated` 事件
  - 组件卸载时正确清理 Socket 连接，防止内存泄漏

## 技术方案

### 技术栈
- **框架**：NestJS
- **AI服务**：DeepSeek API
- **数据库**：MongoDB + Mongoose
- **认证方式**：JWT (继承自认证模块)

### 数据模型

#### Dish Document (菜品集合 - 已存在)
```typescript
{
  _id: ObjectId;           // MongoDB自动生成的ID
  name: string;            // 菜品名称
  price: number;           // 价格（元）
  tags: string[];          // 标签数组
  isDelisted: boolean;     // 是否下架
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

#### Cart Document (购物车集合)
```typescript
{
  _id: ObjectId;           // MongoDB自动生成的ID
  userId: string;          // 用户ID (UUID)
  dishes: [                // 菜品列表
    {
      dishId: ObjectId;    // 菜品ID（引用dishes集合）
      name: string;        // 菜品名称
      price: number;       // 价格
      quantity: number;    // 数量
    }
  ],
  preferences: {           // 单一查询条件（用于简单需求如"想吃辣的"）
    numberOfPeople: number;  // 就餐人数
    tags: string[];          // 偏好标签
    excludeTags: string[];   // 排除标签
    limit: number;           // 推荐数量
  },
  queries: [               // 批量查询条件（用于复杂需求如"八荤八素三个主食"）
    {
      tags: string[];          // 包含标签
      excludeTags: string[];   // 排除标签
      limit: number;           // 推荐数量
      description: string;     // 查询描述（如"荤菜"、"素菜"、"主食"）
    }
  ],
  totalPrice: number;      // 总价
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

#### Order Document (订单集合)
```typescript
{
  _id: ObjectId;           // MongoDB自动生成的ID
  orderId: string;         // 订单号 (UUID)
  userId: string;          // 用户ID (UUID)
  dishes: [                // 菜品列表
    {
      dishId: ObjectId;    // 菜品ID（引用dishes集合）
      name: string;        // 菜品名称
      price: number;       // 单价
      quantity: number;    // 数量
    }
  ],
  totalPrice: number;      // 总价
  status: string;          // 订单状态: pending(待处理), confirmed(已确认), completed(已完成), cancelled(已取消)
  note: string;            // 订单备注
  createdAt: Date;         // 下单时间
  updatedAt: Date;         // 更新时间
}
```

#### ChatHistory Document (对话历史集合)
```typescript
{
  _id: ObjectId;           // MongoDB自动生成的ID
  userId: string;          // 用户ID (UUID)
  messages: [              // 消息列表
    {
      role: string;        // 角色: user/assistant
      content: string;     // 消息内容
      timestamp: Date;     // 消息时间
    }
  ],
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

### API 端点

| 方法 | 路径 | 描述 | 需要认证 |
|------|------|------|----------|
| POST | /api/ordering/ai-order | AI智能点餐对话 | ✅ |
| POST | /api/ordering/refresh-menu | 刷新菜单（随机采样） | ✅ |
| POST | /api/ordering/create-order | 创建订单 | ✅ |
| POST | /api/ordering/clear-cart | 清空购物车和聊天历史 | ✅ |
| GET | /api/ordering/cart | 获取购物车 | ✅ |
| PUT | /api/ordering/cart | 编辑购物车 | ✅ |
| GET | /api/ordering/my-orders | 获取当前用户的订单列表 | ✅ |
| GET | /api/ordering/orders | 获取订单列表 | ✅ |
| GET | /api/ordering/chat-history | 获取聊天历史记录 | ✅ |
| PATCH | /api/ordering/orders/:orderId/status | 修改订单状态 | ✅ |
| GET | /api/ordering/reports/today-revenue | 查询今日总收入 | ❌ |
| GET | /api/ordering/reports/dish-ranking | 查询菜品排行榜 | ❌ |

## AI 交互流程

### 1. 对话模式
用户通过自然语言描述就餐需求，AI解析并响应：

```
用户: "我们3个人，想吃点辣的，有什么推荐吗？"
AI: "好的，为3位客人推荐以下辣味菜品：
    1. 宫保鸡丁 - ¥38
    2. 水煮鱼 - ¥98
    3. 辣子鸡 - ¥55
    已为您添加到购物车，需要添加其他菜品吗？"
```

### 2. 关键信息提取
AI从用户消息中提取：
- **就餐人数**：影响菜品数量
- **口味偏好**：辣/不辣、清淡/重口味
- **饮食禁忌**：素食、不吃海鲜、清真等
- **场合**：相亲、带领导、儿童、爸妈等
- **价格范围**：性价比、高级等
- **复杂多样需求**：八荤八素、主食、饮料等组合需求

### 3. AI转化为查询条件

#### 简单需求（使用 preferences）
适用于单一条件查询，如"想吃辣的"、"3个人不吃海鲜"：
```json
{
  "message": "好的，为您推荐以下辣味菜品...",
  "dishes": [],
  "preferences": {
    "numberOfPeople": 3,
    "tags": ["辣", "性价比"],
    "excludeTags": ["海鲜"],
    "limit": 5
  }
}
```

**数据库查询示例：**
```javascript
db.dishes.find({
  isDelisted: false,
  tags: { 
    $in: ["辣", "性价比"],
    $nin: ["海鲜"]
  }
}).limit(5).sort({ createdAt: -1 })
```

#### 复杂需求（使用 queries 数组）
适用于多种类组合需求，如"八荤八素三个主食两个饮料"：
```json
{
  "message": "好的，为7位客人准备丰盛大餐...",
  "dishes": [],
  "queries": [
    {
      "tags": ["热菜", "猪肉"],
      "excludeTags": ["素食"],
      "limit": 8,
      "description": "荤菜"
    },
    {
      "tags": ["素食"],
      "limit": 8,
      "description": "素菜"
    },
    {
      "tags": ["主食"],
      "limit": 3,
      "description": "主食"
    },
    {
      "tags": ["饮料"],
      "limit": 2,
      "description": "饮料"
    }
  ]
}
```

**查询规则：**
- 荤菜：tags包含"热菜"和任一肉类标签（猪肉、牛肉、羊肉、鸡肉、鸭肉、鱼、海鲜），excludeTags包含"素食"
- 素菜：tags包含"素食"即可
- 主食：tags包含"主食"
- 饮料：tags包含"饮料"

**数据库查询示例：**
```javascript
// 荤菜查询
db.dishes.find({
  isDelisted: false,
  tags: { 
    $in: ["热菜", "猪肉"],
    $nin: ["素食"]
  }
}).limit(8).sort({ createdAt: -1 })

// 素菜查询
db.dishes.find({
  isDelisted: false,
  tags: { $in: ["素食"] }
}).limit(8).sort({ createdAt: -1 })

// 主食查询
db.dishes.find({
  isDelisted: false,
  tags: { $in: ["主食"] }
}).limit(3).sort({ createdAt: -1 })

// 饮料查询
db.dishes.find({
  isDelisted: false,
  tags: { $in: ["饮料"] }
}).limit(2).sort({ createdAt: -1 })
```

系统会执行批量查询，合并结果并去重（通过 Set），最终返回21道不重复的菜品。

### 4. 购物车管理与缓存策略

#### 购物车保存策略
- **保存菜品**：将数据库查询到的实际菜品保存到购物车的 `dishes` 字段
- **保存查询条件**：
  - 简单需求：保存到 `preferences` 字段
  - 复杂需求：保存到 `queries` 数组字段

#### 刷新菜单策略
- **查询条件复用**：
  - 优先使用 `queries` 数组（批量查询）
  - 若无则使用 `preferences`（单一查询）
- **随机采样**：使用 MongoDB `$sample` 聚合管道进行随机采样，确保每次刷新返回不同的菜品组合

**刷新菜单随机查询示例：**
```javascript
// 使用 $sample 进行随机采样
db.dishes.aggregate([
  { $match: { isDelisted: false, tags: { $in: ["辣"] } } },
  { $sample: { size: 5 } }
])
```

#### AI对话缓存策略
- **缓存键生成**：`hash(systemPrompt + userMessage + history)`
- **包含对话历史**：确保上下文准确性，相同消息在不同历史下可能有不同响应
- **TTL**：默认86400秒（可通过 `DEEPSEEK_CACHE_TTL` 配置）
- **持久化**：保存到 `cache/deepseek-cache.json` 文件
- **自动清理**：缓存超过100条时自动清理最旧的20条

### 5. 无关消息处理
当用户消息与点餐无关时，AI统一引导：
```
"请问您是几人就餐，有什么口味偏好和忌口吗？我可以为您推荐合适的菜品。"
```

### 6. MongoDB查询日志
系统提供通用的MongoDB查询日志工具（`MongoLogger`），用于调试和监控：

```typescript
// 标准查询日志示例
🔍 [荤菜] db.dishes.find({"isDelisted":false,"tags":{"$in":["热菜","猪肉"],"$nin":["素食"]}}).sort({"createdAt":-1}).limit(8)
✅ Result: 8 documents (15ms) - 红烧肉, 宫保鸡丁, 回锅肉...

// 随机查询日志示例
🎲 [素菜] db.dishes.aggregate([{$match:{"isDelisted":false,"tags":{"$in":["素食"]}}},{$sample:{size:8}}])
✅ Result: 8 documents (12ms) - 清炒时蔬, 麻婆豆腐, 番茄炒蛋...
```

**MongoLogger 支持的操作：**
- `logQuery()`: 记录查询操作
- `logResult()`: 记录查询结果（数量、耗时、样本数据）
- `logUpdate()`: 记录更新操作
- `logInsert()`: 记录插入操作
- `logDelete()`: 记录删除操作
- `logAggregate()`: 记录聚合操作

## 安全考虑

1. **认证要求**
   - 所有点餐API必须通过JWT认证
   - 用户只能访问自己的购物车和订单

2. **数据验证**
   - 验证菜品ID存在性
   - 验证数量为正整数
   - 防止购物车超量（最多50个菜品）
   - 防止菜品已下架（`isDelisted: false`）

3. **幂等性保证**
   - 订单ID使用UUID确保唯一性
   - 防止重复提交订单

4. **错误处理**
   - 统一的错误响应格式
   - 400: 请求参数错误
   - 401: 未授权
   - 404: 资源不存在
   - 500: 服务器内部错误

## 依赖模块

### NestJS 模块
- `@nestjs/mongoose` - MongoDB集成
- `mongoose` - MongoDB ODM
- `uuid` - 生成唯一订单号

### 外部服务
- **DeepSeek API** - AI对话服务
  - 端点：`https://api.deepseek.com/v1/chat/completions`
  - 需要API Key配置

### 内部模块依赖
- **Auth Module** - 用户认证和授权
- **Dish Module** - 菜品数据管理

## 环境配置

```env
# DeepSeek AI 配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_API_LOG=false              # 是否打印API请求/响应日志（默认false）
DEEPSEEK_CACHE_TTL=86400            # 缓存过期时间（秒），0表示禁用缓存

# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/chat-demo

# JWT 配置（继承自Auth模块）
JWT_SECRET=your_jwt_secret
```

## 数据库索引

### carts 集合
- `userId`: 唯一索引（一个用户一个购物车）
- `updatedAt`: 普通索引

### orders 集合
- `orderId`: 唯一索引
- `userId`: 普通索引（查询用户订单）
- `status`: 普通索引（按状态过滤）
- `createdAt`: 普通索引（按时间排序）

### chatHistories 集合
- `userId`: 普通索引（查询用户对话历史）
- `updatedAt`: 普通索引

### dishes 集合
- `isDelisted`: 普通索引（过滤下架菜品）
- `tags`: 普通索引（标签查询）
- `createdAt`: 普通索引（排序用）

## 技术亮点

1. **批量查询与去重**：支持多条件并行查询，Set去重确保不重复推荐
2. **随机采样刷新**：使用 MongoDB `$sample` 实现高效随机刷新，每次返回不同菜品
3. **智能缓存机制**：基于完整对话上下文（systemPrompt + userMessage + history）的缓存，避免重复API调用
4. **通用日志工具**：MongoLogger 支持所有 MongoDB 操作的标准化日志，输出可直接在 mongosh 中执行
5. **灵活查询策略**：queries 数组 + preferences 混合支持简单和复杂需求
6. **对话历史管理**：自动保留最近20条消息，用于上下文理解

## 后续扩展

- [ ] 订单状态管理（商家确认、配送等）
- [ ] 订单支付功能
- [ ] 订单评价和反馈
- [ ] 菜品推荐算法优化（基于用户历史偏好）
- [ ] 智能去重优化（避免推荐过于相似的菜品）
- [ ] 多语言支持（i18n）
- [ ] 语音点餐功能
- [ ] 订单历史记录和再次下单
- [ ] 批量查询性能优化（并行查询）
- [ ] 缓存预热和失效策略优化
- [ ] 菜品库存管理
- [ ] 实时订单状态推送
