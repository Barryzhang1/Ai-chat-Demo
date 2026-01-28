# 创建订单功能需求

## 功能描述

用户确认购物车内容后，点击下单按钮，系统根据购物车数据创建正式订单并保存到MongoDB订单集合中。订单创建成功后，清空购物车（包括菜品、查询条件和偏好设置），并启动新的点餐会话，返回订单详情。

## API 规范

### 请求

**端点**：`POST /ordering/create-order`

**认证方式**：Bearer Token

**请求头**：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**：
```json
{
  "note": "少放辣，多放醋"
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| note | string | ❌ | 订单备注 | 最多200个字符 |

### 响应

#### 成功响应 (201 Created)

```json
{
  "code": 0,
  "message": "订单创建成功",
  "data": {
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "dishes": [
      {
        "dishId": "507f1f77bcf86cd799439011",
        "name": "宫保鸡丁",
        "price": 38,
        "quantity": 1
      },
      {
        "dishId": "507f1f77bcf86cd799439012",
        "name": "回锅肉",
        "price": 48,
        "quantity": 1
      },
      {
        "dishId": "507f1f77bcf86cd799439013",
        "name": "麻婆豆腐",
        "price": 28,
        "quantity": 1
      }
    ],
    "totalPrice": 114,
    "status": "pending",
    "note": "少放辣，多放醋",
    "createdAt": "2026-01-26T10:30:00.000Z"
  }
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 响应码，0表示成功 |
| message | string | 响应消息 |
| data.orderId | string | 订单唯一标识 (UUID) |
| data.userId | string | 用户ID (UUID) |
| data.dishes | array | 订单菜品列表 |
| data.dishes[].dishId | string | 菜品ID (ObjectId) |
| data.dishes[].name | string | 菜品名称 |
| data.dishes[].price | number | 菜品单价 |
| data.dishes[].quantity | number | 数量 |
| data.totalPrice | number | 订单总价 |
| data.status | string | 订单状态 (pending: 待处理) |
| data.note | string | 订单备注 |
| data.createdAt | string | 订单创建时间 (ISO 8601) |

#### 失败响应

**未授权 (401 Unauthorized)**：
```json
{
  "statusCode": 401,
  "message": "未授权，请先登录"
}
```

**购物车为空 (400 Bad Request)**：
```json
{
  "code": 400,
  "message": "购物车为空，无法创建订单"
}
```

**备注过长 (400 Bad Request)**：
```json
{
  "code": 400,
  "message": "订单备注不能超过200个字符"
}
```

**购物车不存在 (404 Not Found)**：
```json
{
  "code": 404,
  "message": "购物车不存在"
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

1. **验证用户认证**
   - 从JWT token中提取 `userId`
   - 验证用户登录状态

2. **验证请求参数**
   - 验证备注长度（最多200字符）

3. **获取购物车**
   - 根据 `userId` 查询购物车
   - 检查购物车是否存在
   - 检查购物车是否为空（`dishes.length > 0`）

4. **生成订单**
   - 生成订单ID（UUID v4）
   - 复制购物车菜品数据到订单
   - 设置订单状态为 `pending`
   - 记录创建时间

5. **保存订单**
   - 将订单数据插入 `orders` 集合
   - 使用事务确保数据一致性（可选）

6. **清空购物车**
   - 清空购物车 `dishes` 数组
   - 清空 `queries` 和 `preferences` 查询条件
   - 重置 `totalPrice` 为 0
   - **启动新会话**：下次点餐时，AI只会看到下单后的对话历史

7. **返回响应**
   - 返回订单详细信息

### 流程图

```
用户点击下单 → 验证认证 → 获取购物车 → 验证购物车 → 生成订单 → 保存订单 → 清空购物车和查询条件 → 返回订单详情
                ↓           ↓            ↓                                                     ↓
              401错误     404错误      400错误                                          启动新会话
```

## 数据存储

### 订单集合

**集合名称：** `orders`

**文档结构：**
```typescript
{
  _id: ObjectId,               // MongoDB自动生成的ID
  orderId: string,             // 订单号 (UUID v4)
  userId: string,              // 用户ID (UUID)
  dishes: [
    {
      dishId: ObjectId,        // 菜品ID（引用dishes集合）
      name: string,            // 菜品名称
      price: number,           // 单价
      quantity: number,        // 数量
    }
  ],
  totalPrice: number,          // 订单总价
  status: string,              // 订单状态
  note: string,                // 订单备注（可选）
  createdAt: Date,             // 下单时间
  updatedAt: Date,             // 更新时间
}
```

**字段说明**：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| _id | ObjectId | PRIMARY KEY | MongoDB自动生成 |
| orderId | String | REQUIRED, UNIQUE | 订单号 (UUID v4) |
| userId | String | REQUIRED, INDEXED | 用户ID |
| dishes | Array | REQUIRED | 菜品列表，至少1个 |
| totalPrice | Number | REQUIRED | 总价，必须大于0 |
| status | String | REQUIRED | 订单状态，枚举值 |
| note | String | OPTIONAL | 订单备注，最多200字符 |
| createdAt | Date | REQUIRED | 创建时间 |
| updatedAt | Date | REQUIRED | 更新时间 |

**订单状态枚举**：
- `pending`：待处理（初始状态）
- `confirmed`：已确认
- `preparing`：制作中
- `completed`：已完成
- `cancelled`：已取消

### 购物车清空策略

**方式1：删除文档**（推荐）
```typescript
await this.cartModel.deleteOne({ userId });
```

**方式2：清空菜品数组**
```typescript
await this.cartModel.updateOne(
  { userId },
  { 
    $set: { 
      dishes: [], 
      totalPrice: 0,
      updatedAt: new Date() 
    } 
  }
);
```

## 技术实现

### DTO 验证

```typescript
class CreateOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '订单备注不能超过200个字符' })
  note?: string;
}
```

### Service 方法

```typescript
async createOrder(
  userId: string, 
  createOrderDto: CreateOrderDto
): Promise<Order> {
  // 1. 获取购物车
  const cart = await this.cartModel.findOne({ userId });
  
  if (!cart) {
    throw new NotFoundException('购物车不存在');
  }
  
  if (!cart.dishes || cart.dishes.length === 0) {
    throw new BadRequestException('购物车为空，无法创建订单');
  }
  
  // 2. 生成订单数据
  const orderId = uuidv4();
  const orderData = {
    orderId,
    userId,
    dishes: cart.dishes.map(dish => ({
      dishId: dish.dishId,
      name: dish.name,
      price: dish.price,
      quantity: dish.quantity,
    })),
    totalPrice: cart.totalPrice,
    status: 'pending',
    note: createOrderDto.note || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // 3. 保存订单
  const order = await this.orderModel.create(orderData);
  
  // 4. 清空购物车
  await this.cartModel.deleteOne({ userId });
  
  // 5. 返回订单
  return order;
}
```

### 使用事务（可选）

如果需要确保订单创建和购物车清空的原子性：

```typescript
const session = await this.connection.startSession();
session.startTransaction();

try {
  // 创建订单
  const order = await this.orderModel.create([orderData], { session });
  
  // 清空购物车
  await this.cartModel.deleteOne({ userId }, { session });
  
  await session.commitTransaction();
  return order[0];
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## 订单状态管理

### 状态流转

```
pending (待处理)
   ↓
confirmed (已确认) ← 商家确认
   ↓
preparing (制作中) ← 开始制作
   ↓
completed (已完成) ← 完成订单
   
cancelled (已取消) ← 可从任意状态取消
```

### 状态更新API（扩展）

**端点**：`PATCH /ordering/orders/:orderId/status`

**请求体**：
```json
{
  "status": "confirmed"
}
```

## 业务规则

### 订单有效性检查

1. **购物车非空**：至少包含1个菜品
2. **价格一致性**：订单总价 = Σ(菜品单价 × 数量)
3. **菜品存在性**（可选）：验证所有 `dishId` 在 `dishes` 集合中存在

### 幂等性保证

- 使用UUID作为订单号，确保唯一性
- 短时间内重复提交，返回相同订单（可选）
- 前端防抖处理，避免重复点击

### 并发控制

- 使用数据库事务确保订单创建和购物车清空的原子性
- 防止同一用户并发创建多个订单

## 扩展功能

### 1. 获取购物车API

**端点**：`GET /ordering/cart`

**响应**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "dishes": [...],
    "totalPrice": 114,
    "totalItems": 3
  }
}
```

### 2. 获取订单列表API

**端点**：`GET /ordering/orders`

**查询参数**：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `status`: 订单状态过滤（可选）

**响应**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "orders": [...],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

### 3. 获取订单详情API

**端点**：`GET /ordering/orders/:orderId`

**响应**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "orderId": "...",
    "dishes": [...],
    "totalPrice": 114,
    "status": "pending",
    "createdAt": "..."
  }
}
```

### 4. 取消订单API

**端点**：`DELETE /ordering/orders/:orderId`

**业务规则**：
- 只能取消 `pending` 状态的订单
- 已确认或已完成的订单不可取消

## 测试用例

### 测试场景1：正常下单
- **前置条件**：购物车中有3道菜
- **操作**：调用创建订单API
- **预期**：订单创建成功，购物车清空

### 测试场景2：空购物车下单
- **前置条件**：购物车为空
- **操作**：调用创建订单API
- **预期**：返回400错误，提示购物车为空

### 测试场景3：购物车不存在
- **前置条件**：用户从未创建过购物车
- **操作**：调用创建订单API
- **预期**：返回404错误，提示购物车不存在

### 测试场景4：带备注下单
- **前置条件**：购物车中有菜品
- **操作**：调用API，传递备注 "少放辣"
- **预期**：订单创建成功，备注保存

### 测试场景5：备注过长
- **前置条件**：购物车中有菜品
- **操作**：传递超过200字符的备注
- **预期**：返回400错误，提示备注过长

### 测试场景6：并发下单
- **操作**：同一用户同时发送2个下单请求
- **预期**：只创建1个订单，另一个返回错误

### 测试场景7：下单后查询购物车
- **操作**：下单成功后，查询购物车
- **预期**：购物车为空或不存在

## 性能优化

1. **索引优化**
   - `orderId`：唯一索引（查询订单详情）
   - `userId`：普通索引（查询用户订单列表）
   - `status`：普通索引（按状态过滤）
   - `createdAt`：普通索引（按时间排序）

2. **查询优化**
   - 订单列表使用分页查询
   - 使用投影（projection）减少返回字段

3. **事务使用**
   - 仅在必要时使用事务（订单创建 + 购物车清空）
   - 评估是否需要事务（根据业务重要性）

## 监控和日志

### 关键日志

- **订单创建成功**：记录 `orderId`、`userId`、`totalPrice`
- **订单创建失败**：记录失败原因和用户信息
- **购物车清空失败**：记录错误信息（需要人工处理）

### 监控指标

- 订单创建成功率
- 平均订单金额
- 订单创建耗时
- 失败原因分布

## 依赖服务

### 内部依赖
- **Auth Module**：用户认证
- **Cart Collection**：购物车数据
- **Dish Collection**：菜品数据（验证菜品存在性）

### 无外部依赖
- 此接口不依赖第三方服务
- 纯数据库操作

## 安全考虑

1. **权限控制**
   - 用户只能创建自己的订单
   - 用户只能访问自己的订单

2. **数据验证**
   - 验证备注内容，防止XSS攻击
   - 验证菜品数量为正整数
   - 验证总价 > 0

3. **防刷单**
   - 限制用户短时间内创建订单的频率（可选）
   - 前端防抖处理

4. **异常处理**
   - 订单创建失败，回滚所有操作
   - 记录详细错误日志，便于排查

## 数据迁移

如果需要从购物车导入历史订单：

```javascript
// 迁移脚本示例
db.carts.find().forEach(function(cart) {
  if (cart.dishes && cart.dishes.length > 0) {
    db.orders.insertOne({
      orderId: UUID(),
      userId: cart.userId,
      dishes: cart.dishes,
      totalPrice: cart.totalPrice,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
});
```

## 后续扩展

- [ ] 订单支付功能集成
- [ ] 订单评价和反馈
- [ ] 订单分享功能
- [ ] 订单历史记录和再次下单
- [ ] 订单发票功能
- [ ] 订单通知（短信、邮件）
