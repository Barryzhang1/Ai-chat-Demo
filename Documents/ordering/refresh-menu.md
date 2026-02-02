# 刷新菜单功能需求

## 功能描述

用户对当前推荐的菜品不满意时，可以点击刷新按钮，系统会基于上次保存的查询条件（人数、口味、忌口、价格范围等），**随机**重新查询数据库，返回不同的菜品结果，并自动更新购物车。

**注意**：
- 刷新后会替换购物车中的所有菜品
- 如果用户已经下单，购物车和查询条件已清空，刷新菜单会返回错误，提示用户重新点餐

## API 规范

### 请求

**端点**：`POST /ordering/refresh-menu`

**认证方式**：Bearer Token

**请求头**：
```
**请求体**：
```json
{
  "preferences": {
    "numberOfPeople": 3,
    "tags": ["辣", "性价比"],
    "excludeTags": ["海鲜"],
    "limit": 5
  }
}
```

或者不传递任何参数，使用购物车中保存的查询条件：

```json
{}
**字段说明**：

| 字段 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| preferences | object | ❌ | 就餐偏好信息（不传则使用购物车保存的条件） | - |
| preferences.numberOfPeople | number | ❌ | 就餐人数 | 1-50之间的整数 |
| preferences.tags | string[] | ❌ | 偏好标签（包含） | 数组长度0-10 |
| preferences.excludeTags | string[] | ❌ | 排除标签 | 数组长度0-10 |
| preferences.limit | number | ❌ | 推荐菜品数量 | 1-20之间的整数，默认5 |
|------|------|------|------|----------|
| preferences | object | ✅ | 就餐偏好信息 | - |
| preferences.numberOfPeople | number | ❌ | 就餐人数 | 1-50之间的整数 |
| preferences.tags | string[] | ❌ | 偏好标签（包含） | 数组长度0-10 |
| preferences.excludeTags | string[] | ❌ | 排除标签 | 数组长度0-10 |
| preferences.limit | number | ❌ | 推荐菜品数量 | 1-20之间的整数，默认5 |

### 响应

#### 成功响应 (200 OK)

```json
{
  "code": 0,
  "message": "菜单已刷新",
  "data": {
    "dishes": [
      {
        "dishId": "507f1f77bcf86cd799439015",
        "name": "水煮鱼",
        "price": 98,
        "quantity": 1,
        "tags": ["热菜", "鱼", "辣", "热门", "重口味"]
      },
      {
        "dishId": "507f1f77bcf86cd799439016",
        "name": "小炒肉",
        "price": 45,
        "quantity": 1,
        "tags": ["热菜", "猪肉", "辣", "下饭", "性价比"]
      },
      {
        "dishId": "507f1f77bcf86cd799439017",
        "name": "酸菜鱼",
        "price": 88,
        "quantity": 1,
        "tags": ["热菜", "鱼", "辣", "热门", "爸妈"]
      },
      {
        "dishId": "507f1f77bcf86cd799439018",
        "name": "鱼香肉丝",
        "price": 38,
        "quantity": 1,
        "tags": ["热菜", "猪肉", "辣", "性价比", "热门"]
      },
      {
        "dishId": "507f1f77bcf86cd799439019",
        "name": "手撕包菜",
        "price": 25,
        "quantity": 1,
        "tags": ["热菜", "素食", "辣", "性价比", "下饭"]
      }
    ],
    "cart": {
      "totalPrice": 294,
      "totalItems": 5
    }
  }
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 响应码，0表示成功 |
| message | string | 响应消息 |
| data.dishes | array | 刷新后的菜品列表 |
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

**购物车不存在 (404 Not Found)**：
```json
{
  "code": 404,
  "message": "购物车不存在，请先通过AI点餐"
}
```

**无保存的查询条件 (400 Bad Request)**：
```json
{
  "statusCode": 400,
  "message": "购物车中没有保存的查询条件，无法刷新菜单。请先通过AI点餐或重新开始点餐",
  "error": "Bad Request"
}
```

**说明**：当用户下单后，购物车和查询条件会被清空，此时调用刷新菜单接口会返回此错误。

**无符合条件的菜品 (200 OK)**：
```json
{
  "code": 0,
  "message": "暂无符合条件的菜品",
  "data": {
    "dishes": [],
    "cart": {
      "totalPrice": 0,
      "totalItems": 0
    }
  }
}
```

**服务器错误 (500 Internal Server Error)**：
```json
{
  "code": 500,
  "message": "服务器内部错误"
}
1. **接收请求**
   - 验证用户已认证（JWT token）
   - 从JWT token中提取 `userId`

2. **获取购物车和查询条件**
   - 根据 `userId` 查询购物车
   - 检查购物车是否存在
   - 从购物车的 `queries` 和 `preferences` 字段读取查询条件
   - 如果购物车不存在或没有保存的查询条件（`queries` 和 `preferences` 都为空），返回错误提示
   - **注意**：用户下单后，购物车的 `queries` 和 `preferences` 会被清空，此时刷新菜单将失败

3. **构建MongoDB查询**
   - 根据 `preferences.tags` 构建 `$in` 查询条件
   - 根据 `preferences.excludeTags` 构建 `$nin` 查询条件
   - 根据 `preferences.minPrice` 和 `preferences.maxPrice` 构建价格范围条件
   - 设置查询结果数量限制
   - 验证请求参数格式和范围

4. **查询菜品**
   - 执行MongoDB查询获取菜品列表
   - 如果没有查询到菜品，返回空列表
   - 支持随机排序（可选），避免每次返回相同菜品

5. **更新购物车**
   - **覆盖写入**新的菜品列表（清空旧内容）
   - **保持 `preferences` 字段不变**（继续使用原有查询条件）
   - 每个菜品的 `quantity` 默认为1
   - 计算 `totalPrice` 和 `totalItems`
6. **返回响应**
   - 返回刷新后的菜品列表和购物车信息

### MongoDB 查询构建

**基础查询**：
```javascript
const query: any = {};

// 添加包含标签条件
if (preferences.tags && preferences.tags.length > 0) {
  query.tags = { $in: preferences.tags };
}

// 添加排除标签条件
if (preferences.excludeTags && preferences.excludeTags.length > 0) {
  if (query.tags) {
    query.tags.$nin = preferences.excludeTags;
  } else {
    query.tags = { $nin: preferences.excludeTags };
  }
}

// 添加价格范围条件
if (preferences.minPrice !== undefined || preferences.maxPrice !== undefined) {
  query.price = {};
  if (preferences.minPrice !== undefined) {
    query.price.$gte = preferences.minPrice;
  }
  if (preferences.maxPrice !== undefined) {
    query.price.$lte = preferences.maxPrice;
  }
}

// 执行查询
const dishes = await dishModel
  .find(query)
  .limit(preferences.limit || 5)
  .exec();
```

**随机排序查询**（可选）：
```javascript
const dishes = await dishModel
  .aggregate([
    { $match: query },
    { $sample: { size: preferences.limit || 5 } }
  ])
  .exec();
```

### 购物车更新逻辑

```typescript
// 构建购物车菜品数据
const cartDishes = dishes.map(dish => ({
  dishId: dish._id,
  name: dish.name,
  price: dish.price,
  quantity: 1,
}));

// 计算总价
const totalPrice = cartDishes.reduce(
  (sum, item) => sum + item.price * item.quantity, 
  0
);

// 覆盖更新购物车（保持queries和preferences不变）
await cartModel.findOneAndUpdate(
  { userId },
  {
    userId,
    dishes: cartDishes,
    totalPrice,
    // queries 和 preferences 字段不更新，保持原有值
    updatedAt: new Date(),
  },
  { upsert: true, new: true }
);
```

**注意事项**：
- 刷新菜单仅更新 `dishes` 和 `totalPrice` 字段
- `queries` 和 `preferences` 字段保持不变，以便用户继续使用相同条件刷新
- 如果用户下单，购物车的 `queries` 和 `preferences` 将被清空，之后无法继续刷新菜单

## 数据存储

### 购物车集合

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
      quantity: number,        // 数量
    }
  ],
  queries: string[],           // DeepSeek查询记录（仅用于刷新菜单，下单后清空）
  preferences: {               // 查询条件（用于刷新菜单，下单后清空）
    numberOfPeople: number,    // 就餐人数
    tags: string[],            // 偏好标签
    excludeTags: string[],     // 排除标签
    minPrice: number,          // 最低价格
    maxPrice: number,          // 最高价格
    totalBudget: number,       // 总预算
    limit: number,             // 推荐数量
  },
  totalPrice: number,          // 总价
  createdAt: Date,
  updatedAt: Date,
}
```

**更新策略**：
- 刷新菜单时，覆盖 `dishes` 和 `totalPrice`，保持 `queries` 和 `preferences` 不变
- 下单后，清空 `dishes`、`queries`、`preferences` 和 `totalPrice`，启动新会话
### DTO 验证

无需DTO验证，因为不接收请求参数。

### Service 方法

```typescript
async refreshMenu(userId: string): Promise<RefreshMenuResponse> {
  // 1. 获取购物车和查询条件
  const cart = await this.cartModel.findOne({ userId });
  
  if (!cart) {
    throw new NotFoundException('购物车不存在，请先通过AI点餐');
  }
  
  // 检查是否有保存的查询条件（queries 或 preferences）
  if (!cart.queries?.length && !cart.preferences) {
    throw new BadRequestException(
      '没有保存的查询条件，请先通过AI点餐。注意：下单后查询条件会被清空，需要重新开始点餐流程。'
    );
  }
  
  const queryPreferences = cart.preferences;
  
  // 2. 构建查询条件
  const query = this.buildQuery(queryPreferences);
  
  // 3. 查询菜品（支持随机）
  const dishes = await this.dishModel
    .aggregate([
      { $match: query },
      { $sample: { size: queryPreferences.limit || 5 } }
    ])
    .exec();
  
  // 4. 更新购物车
  const updateData: any = {
    userId,
    dishes: dishes.map(d => ({
      dishId: d._id,
      name: d.name,
      price: d.price,
      quantity: 1,
### 场景1：用户觉得推荐不满意
- **操作**：点击刷新菜单按钮
- **系统行为**：使用购物车保存的查询条件，重新随机推荐菜品

### 场景2：用户想看更多选择
- **操作**：多次点击刷新
- **系统行为**：每次使用相同的查询条件，返回不同的菜品组合

### 场景3：与AI点餐配合
- **流程**：
  1. 用户通过AI点餐："我想吃辣的"
  2. AI推荐并更新购物车，同时保存查询条件 `{"tags": ["辣"], "limit": 5}`
  3. 用户点击刷新菜单
  4. 系统自动使用保存的查询条件重新推荐辣味菜品

### 场景4：用户修改需求
- **操作**：需要通过AI点餐重新描述需求
- **流程**：
  1. 用户对AI说："换成清淡的菜吧"
  2. AI生成新的查询条件并保存到购物车
  3. 之后的刷新操作将使用新的查询条件, new: true }
  );
  
  // 5. 返回结果
  return {
    dishes: dishes.map(d => ({
      dishId: d._id.toString(),
      name: d.name,
      price: d.price,
      quantity: 1,
      tags: d.tags,
### 测试场景1：正常刷新（使用保存的条件）
- **前置条件**：购物车中有保存的查询条件
- **输入**：空请求体 `{}`
- **预期**：使用购物车的 `preferences` 重新查询，返回新菜品

### 测试场景2：排除标签
- **输入**：
  ```json
  {
    "preferences": {
      "tags": ["热菜"],
      "excludeTags": ["海鲜", "辣"],
      "limit": 3
    }
  }
  ```
- **预期**：返回3道热菜，不包含海鲜和辣味

### 测试场景3：价格范围过滤
- **输入**：通过AI点餐说"预算500，推荐5道菜"
- **预期**：购物车保存 `totalBudget: 500`，刷新菜单时根据人数和菜品数量计算单价上限

### 测试场景4：下单后刷新失败
- **前置条件**：用户已完成下单，购物车的 `queries` 和 `preferences` 已被清空
- **输入**：空请求体 `{}`
- **预期**：返回400错误，提示"没有保存的查询条件，请先通过AI点餐。注意：下单后查询条件会被清空，需要重新开始点餐流程。"

### 测试场景5：无匹配结果
## 使用场景

### 场景1：用户觉得推荐不满意
- **操作**：点击刷新菜单按钮
- **系统行为**：使用购物车保存的查询条件，重新随机推荐菜品

### 场景2：用户想看更多选择
- **操作**：多次点击刷新
- **系统行为**：每次使用相同的查询条件，返回不同的菜品组合

### 场景3：与AI点餐配合
- **流程**：
  1. 用户通过AI点餐："我想吃辣的"
  2. AI推荐并更新购物车，同时保存查询条件 `{"tags": ["辣"], "limit": 5}`
  3. 用户点击刷新菜单
  4. 系统自动使用保存的查询条件重新推荐辣味菜品

### 场景4：用户修改需求
- **操作**：需要通过AI点餐重新描述需求
- **流程**：
  1. 用户对AI说："换成清淡的菜吧"
  2. AI生成新的查询条件并保存到购物车
  3. 之后的刷新操作将使用新的查询条件

## 性能优化

1. **查询优化**
   - 在 `tags` 字段上建立索引
   - 使用 `$sample` 实现随机排序（性能优于 `sort()`）

2. **缓存策略**（可选）
   - 缓存常见标签组合的查询结果
   - 缓存过期时间：5分钟

3. **防抖处理**（前端）
   - 限制用户频繁点击刷新
   - 前端实现防抖，间隔至少1秒

## 测试用例

### 测试场景1：正常刷新
- **前置条件**：购物车中有保存的查询条件
- **操作**：调用刷新菜单API
- **预期**：使用购物车的 `preferences` 重新查询，返回新菜品列表

### 测试场景2：多次刷新验证随机性
- **前置条件**：购物车中有查询条件 `{"tags": ["辣"], "limit": 5}`
- **操作**：连续调用刷新API 3次
- **预期**：每次返回不同的5道辣味菜品（随机）

### 测试场景3：购物车不存在
- **前置条件**：用户从未创建过购物车
- **操作**：调用刷新菜单API
- **预期**：返回404错误，提示"购物车不存在，请先通过AI点餐"

### 测试场景4：无匹配结果
- **前置条件**：购物车中有查询条件 `{"tags": ["不存在的标签"], "limit": 5}`
- **操作**：调用刷新菜单API
- **预期**：返回空菜品列表，购物车清空

## 与其他功能的关联

### 与AI点餐的关系
- AI点餐会将查询条件（包括价格偏好）保存到购物车的 `queries` 和 `preferences` 字段
- 刷新菜单直接复用这些查询条件，无需用户重复输入
- 两个API返回的数据结构完全一致（都包含 `cart` 对象）

### 与下单功能的关系
- 下单后，购物车的 `dishes`、`queries`、`preferences` 和 `totalPrice` 全部清空
- 清空后尝试刷新菜单将返回错误，要求用户重新开始点餐流程
- 这种设计实现了点餐会话的隔离，避免新订单被旧的查询条件影响
- 刷新菜单直接使用保存的条件，无需用户重新输入
- 如果用户想修改需求，需要通过AI点餐重新描述
- 刷新菜单专注于"换一批"功能，不改变用户偏好

### 与购物车的关系
- 刷新菜单会**完全覆盖**购物车内容
- 不保留用户之前手动调整的数量
- 建议前端在刷新前提示用户确认

### 与下单的关系
- 刷新菜单后，购物车内容改变
- 用户需要重新确认后才能下单

## 前端集成建议

### 按钮位置
- ✅ **已实现**：放置在菜单推荐卡片的操作区域
- 与"支付"按钮并排显示
- 图标：🔄 刷新

### UI展示
- 刷新按钮使用默认颜色（`color="default"`），支付按钮使用成功色
- 在加载状态时禁用按钮（`disabled={isGenerating}`）
- 只在未确认订单且非历史消息时显示

### 加载状态
```
正在为您重新推荐菜品...
```

### 实现位置
- 文件：`ChatUI/src/pages/UserOrder/UserOrder.js`
- 函数：`handleRefreshMenu()`
- UI组件：菜单卡片的 `menu-actions` 区域

### 用户体验流程
1. 用户通过AI点餐获得推荐菜单
2. 菜单卡片底部显示"🔄 刷新"和"支付"两个按钮
3. 点击"刷新"按钮
4. 显示加载动画："正在为您重新推荐菜品..."
5. 后端返回新的推荐结果
6. 替换loading消息为新的菜单卡片
7. 用户可以继续刷新或选择支付

### 错误处理
- 显示友好的错误提示："刷新失败，请稍后重试"
- 自动移除loading消息
- 保持之前的菜单状态不变

### 结果展示
```
已为您重新推荐以下菜品：
[新的菜单卡片]
```

### 防止重复请求
- 使用 `isGenerating` 状态控制
- 在请求进行中禁用刷新按钮
- 使用 `e.stopPropagation()` 防止事件冒泡

## 依赖服务

### 内部依赖
- **Auth Module**：用户认证
- **Dish Collection**：菜品数据
- **Cart Collection**：购物车数据

### 无外部依赖
- 此接口不依赖DeepSeek API
- 纯数据库查询操作
