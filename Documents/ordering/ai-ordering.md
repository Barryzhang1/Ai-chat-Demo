# AI智能点餐功能需求

## 功能描述

通过DeepSeek AI的自然语言处理能力，实现智能对话点餐功能。用户可以用自然语言描述就餐需求（人数、口味偏好、忌口等），AI解析需求后智能推荐菜品，并将推荐的菜品添加到用户购物车中。对于与点餐无关的消息，AI会引导用户进行点餐。

## API 规范

### 请求

**端点**：`POST /ordering/ai-order`

**认证方式**：Bearer Token

**请求头**：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**：
```json
{
  "message": "我们3个人，想吃点辣的，不吃海鲜"
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| message | string | ✅ | 用户消息内容 | 1-500个字符 |

### 响应

#### 成功响应 - 推荐菜品 (200 OK)

```json
{
  "code": 0,
  "message": "推荐成功",
  "data": {
    "reply": "好的，为3位客人推荐以下辣味菜品：\n1. 宫保鸡丁 - ¥38\n2. 回锅肉 - ¥48\n3. 辣子鸡 - ¥55\n4. 麻婆豆腐 - ¥28\n已为您添加到购物车，需要添加其他菜品吗？",
    "dishes": [
      {
        "dishId": "507f1f77bcf86cd799439011",
        "name": "宫保鸡丁",
        "price": 38,
        "quantity": 1,
        "tags": ["热菜", "鸡肉", "辣", "性价比", "经典"]
      },
      {
        "dishId": "507f1f77bcf86cd799439012",
        "name": "回锅肉",
        "price": 48,
        "quantity": 1,
        "tags": ["热菜", "猪肉", "辣", "经典", "下饭"]
      },
      {
        "dishId": "507f1f77bcf86cd799439013",
        "name": "辣子鸡",
        "price": 55,
        "quantity": 1,
        "tags": ["热菜", "鸡肉", "特辣", "下酒", "重口味"]
      },
      {
        "dishId": "507f1f77bcf86cd799439014",
        "name": "麻婆豆腐",
        "price": 28,
        "quantity": 1,
        "tags": ["热菜", "素食", "辣", "经典", "性价比"]
      }
    ],
    "cart": {
      "totalPrice": 169,
      "totalItems": 4
    }
  }
}
```

#### 成功响应 - 引导点餐 (200 OK)

```json
{
  "code": 0,
  "message": "响应成功",
  "data": {
    "reply": "请问您是几人就餐，有什么口味偏好和忌口吗？我可以为您推荐合适的菜品。",
    "dishes": [],
    "cart": {
      "totalPrice": 0,
      "totalItems": 0
    }
  }
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 响应码，0表示成功 |
| message | string | 响应消息 |
| data.reply | string | AI回复内容 |
| data.dishes | array | 推荐的菜品列表 |
| data.dishes[].dishId | string | 菜品ID (ObjectId) |
| data.dishes[].name | string | 菜品名称 |
| data.dishes[].price | number | 菜品价格 |
| data.dishes[].quantity | number | 数量 |
| data.dishes[].tags | string[] | 菜品标签 |
| data.cart.totalPrice | number | 购物车总价 |
| data.cart.totalItems | number | 购物车菜品总数 |

#### 失败响应

**未授权 (401 Unauthorized)**：
```json
{
  "statusCode": 401,
  "message": "未授权，请先登录"
}
```

**消息为空 (400 Bad Request)**：
```json
{
  "code": 400,
  "message": "消息内容不能为空"
}
```

**消息过长 (400 Bad Request)**：
```json
{
  "code": 400,
  "message": "消息内容不能超过500个字符"
}
```

**AI服务异常 (500 Internal Server Error)**：
```json
{
  "code": 500,
  "message": "AI服务暂时不可用，请稍后重试"
}
```

**服务器错误 (500 Internal Server Error)**：
```json
{
  "code": 500,
  "message": "服务器内部错误"
}
```

## 业务逻辑

### 处理流程

1. **接收用户消息**
   - 验证用户已认证（JWT token）
   - 验证消息不为空且长度合法

2. **构建对话上下文**
   - 获取用户的对话历史（最近10条）
   - 构建系统提示词（System Prompt）
   - 将用户消息添加到对话历史

3. **调用DeepSeek AI**
   - 发送请求到DeepSeek API
   - 传递对话历史和用户消息
   - 接收AI响应

4. **解析AI响应**
   - **场景A：点餐相关**
     - AI提取关键信息（人数、口味、忌口等）
     - AI返回结构化的MongoDB查询条件（JSON格式）
     - 解析AI返回的查询条件
   - **场景B：非点餐相关**
     - 返回引导语："请问您是几人就餐，有什么口味偏好和忌口吗？我可以为您推荐合适的菜品。"

5. **执行数据库查询**
   - 使用AI返回的查询条件查询菜品数据库
   - 获取实际的菜品列表
   - 如果查询结果为空，提示用户调整需求

6. **更新购物车**
   - 查找或创建用户购物车
   - 覆盖写入查询到的菜品（清空旧内容）
   - **保存查询条件**到购物车（用于刷新菜单功能）
   - 计算总价和总数量

7. **保存对话历史**
   - 将用户消息和AI回复保存到chatHistories集合
   - 限制每个用户保留最近50条对话记录

8. **返回响应**
   - 返回AI回复、实际查询到的菜品和购物车信息

### 系统提示词 (System Prompt)

```text
你是一个专业的餐厅点餐助手。你的任务是：

1. 理解用户的就餐需求，包括：
   - 就餐人数
   - 口味偏好（辣/不辣、清淡/重口味等）
   - 饮食禁忌（素食、不吃海鲜、清真、儿童等）
   - 就餐场合（相亲、带领导、爸妈、儿童等）
   - 价格预算（性价比、高级等）

2. 如果用户的消息与点餐无关，请统一回复：
   "请问您是几人就餐，有什么口味偏好和忌口吗？我可以为您推荐合适的菜品。"

3. 如果用户开始点餐，请：
   - 提取关键信息（人数、偏好、忌口）
   - 生成MongoDB查询条件
   - **必须返回JSON格式的查询条件**，格式如下：
     ```json
     {
       "numberOfPeople": 3,
       "tags": ["辣", "性价比"],
       "excludeTags": ["海鲜"],
       "limit": 5
     }
     ```
   - 同时返回友好的文字回复：
     ```
     好的，为您查询3人份的辣味性价比菜品，已排除海鲜。
     ```
   
   **重要**：
   - 必须在回复中包含 `QUERY_START` 和 `QUERY_END` 标记
   - 查询条件放在标记之间，例如：
     ```
     好的，为您查询3人份的辣味性价比菜品。
     QUERY_START
     {"numberOfPeople": 3, "tags": ["辣", "性价比"], "excludeTags": ["海鲜"], "limit": 5}
     QUERY_END
     ```

4. 可用的菜品标签包括：
   - 分类：凉菜、热菜、汤、主食
   - 食材：猪肉、牛肉、羊肉、鸡肉、鸭肉、鱼、海鲜、素食
   - 口味：辣、不辣、特辣、甜口、清爽
   - 场合：相亲、带领导、爸妈、儿童、下酒
   - 特点：性价比、热门、硬菜、经典、健康、高级、滋补
   - 饮食：清真、素食

保持友好、专业的服务态度。
```

### 关键信息提取逻辑

从用户消息中提取以下信息，构建MongoDB查询：

| 用户表达 | 提取信息 | MongoDB查询 |
|---------|---------|-------------|
| "3个人" | 人数：3 | 推荐3-5道菜 |
| "喜欢辣的" | 口味：辣 | `{ tags: { $in: ["辣"] } }` |
| "不吃辣" | 口味：不辣 | `{ tags: { $in: ["不辣"] } }` |
| "不吃海鲜" | 忌口：海鲜 | `{ tags: { $nin: ["海鲜"] } }` |
| "素食" | 饮食：素食 | `{ tags: { $in: ["素食"] } }` |
### AI返回查询条件示例

**示例1：3人就餐，喜欢辣的，不吃海鲜**

AI回复：
```
好的，为您查询3人份的辣味菜品，已排除海鲜。
QUERY_START
{"numberOfPeople": 3, "tags": ["辣", "热菜", "性价比"], "excludeTags": ["海鲜"], "limit": 5}
QUERY_END
```

后端执行查询：
```javascript
db.dishes.find({
  tags: { 
    $in: ["辣", "热菜", "性价比"],
    $nin: ["海鲜"]
  }
}).limit(5)
```

**示例2：带领导，高级菜品**

AI回复：
```
好的，为您推荐适合商务宴请的高级菜品。
QUERY_START
{"tags": ["带领导", "高级", "硬菜"], "limit": 4}
QUERY_END
```

后端执行查询：
```javascript
db.dishes.find({
  tags: { 
    $in: ["带领导", "高级", "硬菜"]
  }
### 1. 购物车更新

**集合名称：** `carts`

**文档结构：**
```typescript
{
  _id: ObjectId,
  userId: string,              // 用户ID
  dishes: [
    {
      dishId: ObjectId,        // 菜品ID
      name: string,            // 菜品名称
      price: number,           // 价格
      quantity: number,        // 数量（默认为1）
    }
  ],
  preferences: {               // 查询条件（用于刷新菜单）
    numberOfPeople: number,    // 就餐人数
    tags: string[],            // 偏好标签
    excludeTags: string[],     // 排除标签
    limit: number,             // 推荐数量
  },
  totalPrice: number,          // 总价
  createdAt: Date,
  updatedAt: Date,
}
```

**更新策略：**
- 使用 `findOneAndUpdate` 方法，如果购物车不存在则创建
- 每次AI推荐后，**覆盖写入**新的菜品列表（清空旧内容）
- **保存查询条件**到 `preferences` 字段，供刷新菜单功能使用
- 自动计算 `totalPrice`

## 数据存储

### 1. 购物车更新

**集合名称：** `carts`

**文档结构：**
```typescript
{
  _id: ObjectId,
  userId: string,              // 用户ID
  dishes: [
    {
      dishId: ObjectId,        // 菜品ID
      name: string,            // 菜品名称
      price: number,           // 价格
      quantity: number,        // 数量（默认为1）
    }
  ],
  totalPrice: number,          // 总价
  createdAt: Date,
### DeepSeek API 调用

**端点**：`https://api.deepseek.com/v1/chat/completions`

**请求示例**：
```typescript
{
  model: "deepseek-chat",
  messages: [
    {
      role: "system",
      content: "[系统提示词]"
    },
    {
      role: "user",
      content: "我们3个人，想吃点辣的"
    }
  ],
  temperature: 0.7,
  max_tokens: 1000
}
```

**响应示例**：
```typescript
{
  choices: [
    {
      message: {
        role: "assistant",
        content: "好的，为您查询3人份的辣味菜品。\nQUERY_START\n{\"numberOfPeople\": 3, \"tags\": [\"辣\", \"热菜\", \"性价比\"], \"limit\": 5}\nQUERY_END"
      }
    }
  ]
}
```

### 解析AI响应

后端需要解析AI响应，提取查询条件：

```typescript
function parseAIResponse(content: string): { 
  reply: string, 
  queryConditions: any 
} {
  const queryStart = content.indexOf('QUERY_START');
  const queryEnd = content.indexOf('QUERY_END');
  
  if (queryStart !== -1 && queryEnd !== -1) {
    // 提取查询条件JSON
    const jsonStr = content.substring(
      queryStart + 'QUERY_START'.length, 
      queryEnd
    ).trim();
    
    const queryConditions = JSON.parse(jsonStr);
    
    // 提取纯文本回复（去除查询条件部分）
    const reply = content.substring(0, queryStart).trim();
    
    return { reply, queryConditions };
  }
  
  // 非点餐消息，没有查询条件
  return { reply: content, queryConditions: null };
}
```

### 执行数据库查询

```typescript
async function queryDishes(preferences: any): Promise<Dish[]> {
  const query: any = {};
  
  // 构建查询条件
  if (preferences.tags && preferences.tags.length > 0) {
    query.tags = { $in: preferences.tags };
  }
  
  if (preferences.excludeTags && preferences.excludeTags.length > 0) {
    if (query.tags) {
      query.tags.$nin = preferences.excludeTags;
    } else {
      query.tags = { $nin: preferences.excludeTags };
    }
  }
  
  // 执行查询
  const dishes = await dishModel
    .find(query)
    .limit(preferences.limit || 5)
    .exec();
  
  return dishes;
}
```技术实现

### DeepSeek API 调用

**端点**：`https://api.deepseek.com/v1/chat/completions`

**请求示例**：
```typescript
{
  model: "deepseek-chat",
  messages: [
### 测试场景1：正常点餐
- **输入**：`"我们3个人，想吃点辣的，不吃海鲜"`
- **预期AI响应**：包含查询条件JSON
- **预期行为**：
  1. 解析AI返回的查询条件
  2. 执行数据库查询获取菜品
  3. 返回实际查询到的菜品
  4. 更新购物车并保存查询条件
    },
    {
      role: "user",
      content: "我们3个人，想吃点辣的"
    }
  ],
  temperature: 0.7,
### 测试场景3：追加需求
- **输入**：`"再来点汤吧"`
- **预期AI响应**：包含汤品查询条件
- **预期行为**：
  1. AI返回查询条件：`{"tags": ["汤"], "limit": 3}`
  2. 查询数据库获取汤品
  3. 覆盖购物车，保存新的查询条件

**响应示例**：
```typescript
{
  choices: [
    {
      message: {
        role: "assistant",
        content: "好的，为3位客人推荐以下辣味菜品：..."
      }
    }
  ]
}
```

### DTO 验证

```typescript
class AiOrderDto {
  @IsString()
  @IsNotEmpty({ message: '消息内容不能为空' })
  @Length(1, 500, { message: '消息内容长度必须在1-500个字符之间' })
  message: string;
}
```

### 异常处理

| 异常类型 | HTTP状态码 | 处理方式 |
|---------|-----------|---------|
| DeepSeek API超时 | 500 | 返回"AI服务暂时不可用" |
| DeepSeek API限流 | 429 | 返回"请求过于频繁，请稍后重试" |
| MongoDB连接失败 | 500 | 返回"数据库服务异常" |
| 菜品查询为空 | 200 | 返回"暂无符合条件的菜品，请调整需求" |

## 性能优化

1. **对话历史限制**
   - 每次只加载最近10条对话记录
   - 超过50条自动删除最旧的记录

2. **菜品查询优化**
   - 在 `tags` 字段上建立索引
   - 限制查询结果数量（3-5道菜）

3. **缓存机制**（可选）
   - 缓存常见查询组合的结果
   - 缓存过期时间：1小时

4. **并发控制**
   - 同一用户的请求排队处理
   - 防止并发更新购物车

## 测试用例

### 测试场景1：正常点餐
- **输入**：`"我们3个人，想吃点辣的，不吃海鲜"`
- **预期**：返回3-5道辣味菜品，不包含海鲜，更新购物车

### 测试场景2：无关消息
- **输入**：`"今天天气怎么样？"`
- **预期**：返回引导语，不更新购物车

### 测试场景3：追加需求
- **输入**：`"再来点汤吧"`
- **预期**：推荐汤品，覆盖购物车

### 测试场景4：特殊饮食
- **输入**：`"我吃素，要清淡的"`
- **预期**：返回素食、不辣的菜品

### 测试场景5：带场合
- **输入**：`"今天带领导，要高档点的"`
- **预期**：返回高级、硬菜标签的菜品

## 依赖服务

### 外部依赖
- **DeepSeek API**：AI对话服务
  - 需要配置 `DEEPSEEK_API_KEY`
  - 需要网络连接

### 内部依赖
- **Auth Module**：用户认证
- **Dish Collection**：菜品数据（需预先导入）

## 相关API

### 获取聊天历史记录

**端点**：`GET /ordering/chat-history`

**认证方式**：Bearer Token

**请求头**：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**查询参数**：

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| limit | number | ❌ | 返回的消息数量 | 20 |

**成功响应 (200 OK)**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "messages": [
      {
        "role": "user",
        "content": "我们3个人，想吃点辣的",
        "timestamp": "2026-01-27T10:30:00.000Z"
      },
      {
        "role": "assistant",
        "content": "{\"message\":\"好的，为3位客人推荐以下辣味菜品...\",\"dishes\":[...]}",
        "timestamp": "2026-01-27T10:30:05.000Z"
      }
    ],
    "total": 10
  }
}
```

**错误响应 (401 Unauthorized)**：
```json
{
  "code": 401,
  "message": "未授权",
  "error": "Unauthorized"
}
```

**错误响应 (404 Not Found)**：
```json
{
  "code": 404,
  "message": "聊天历史不存在",
  "error": "NotFound"
}
```

**功能说明**：
- 返回当前用户的聊天历史记录
- 按时间倒序排列（最新的在前）
- 默认返回最近20条消息
- 可通过 `limit` 参数控制返回数量（最大100条）
- 用于前端展示历史对话记录

## 数据初始化

使用 `Documents/sample_data.js` 初始化菜品数据：

```bash
mongosh chat-demo < Documents/sample_data.js
```

确保所有菜品都有正确的 `tags` 字段，用于智能推荐。
