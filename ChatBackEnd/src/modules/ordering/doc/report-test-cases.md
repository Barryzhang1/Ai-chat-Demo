# 数据报表功能测试用例

## 测试环境
- API Base URL: `http://localhost:3001/api`
- 测试工具: Postman / cURL / REST Client

## 前置条件
1. MongoDB中orders表需要有已完成（status='completed'）的订单数据
2. 订单数据需要包含不同日期的记录
3. 订单中需要包含菜品信息（dishes数组）

---

## 测试用例1：查询今日总收入（默认查询今日）

### 请求信息
- **接口**: `GET /api/ordering/reports/today-revenue`
- **方法**: GET
- **认证**: 不需要（根据实际需求可添加认证）

### 测试步骤
```bash
curl -X GET "http://localhost:3001/api/ordering/reports/today-revenue"
```

### 预期响应
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "date": "2026-01-29",
    "totalRevenue": 1580.50,
    "orderCount": 15
  }
}
```

### 验证点
- ✅ 返回的date字段是今日日期（YYYY-MM-DD格式）
- ✅ totalRevenue是数字类型，保留2位小数
- ✅ orderCount是整数，表示已完成订单数量
- ✅ 如果今日没有完成订单，totalRevenue应为0，orderCount应为0

---

## 测试用例2：查询指定日期的总收入

### 请求信息
- **接口**: `GET /api/ordering/reports/today-revenue?date=2026-01-28`
- **方法**: GET
- **参数**: 
  - `date`: 查询日期（YYYY-MM-DD格式）

### 测试步骤
```bash
curl -X GET "http://localhost:3001/api/ordering/reports/today-revenue?date=2026-01-28"
```

### 预期响应
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "date": "2026-01-28",
    "totalRevenue": 2350.80,
    "orderCount": 22
  }
}
```

### 验证点
- ✅ 返回的date字段与请求参数一致
- ✅ 只统计指定日期00:00:00到23:59:59之间的订单
- ✅ 只统计status='completed'的订单

---

## 测试用例3：查询菜品排行榜（默认前10名）

### 请求信息
- **接口**: `GET /api/ordering/reports/dish-ranking`
- **方法**: GET

### 测试步骤
```bash
curl -X GET "http://localhost:3001/api/ordering/reports/dish-ranking"
```

### 预期响应
```json
{
  "code": 0,
  "message": "查询成功",
  "data": [
    {
      "dishId": "507f1f77bcf86cd799439011",
      "dishName": "宫保鸡丁",
      "totalQuantity": 128,
      "totalRevenue": 3584.00,
      "orderCount": 98
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

### 验证点
- ✅ 返回最多10条记录（默认）
- ✅ 按totalQuantity降序排列
- ✅ 每条记录包含：dishId、dishName、totalQuantity、totalRevenue、orderCount
- ✅ totalRevenue是正确计算的（price * quantity的总和）
- ✅ 只统计status='completed'的订单

---

## 测试用例4：查询菜品排行榜（指定返回数量）

### 请求信息
- **接口**: `GET /api/ordering/reports/dish-ranking?limit=20`
- **方法**: GET
- **参数**: 
  - `limit`: 返回的菜品数量（最大50）

### 测试步骤
```bash
# 查询前20名
curl -X GET "http://localhost:3001/api/ordering/reports/dish-ranking?limit=20"

# 查询前5名
curl -X GET "http://localhost:3001/api/ordering/reports/dish-ranking?limit=5"

# 测试边界值（超过最大值50）
curl -X GET "http://localhost:3001/api/ordering/reports/dish-ranking?limit=100"
```

### 预期响应
- limit=20时，返回最多20条记录
- limit=5时，返回最多5条记录
- limit=100时，应该被限制为50条记录

### 验证点
- ✅ 参数验证：1 <= limit <= 50
- ✅ 返回的记录数不超过limit
- ✅ 如果菜品总数少于limit，返回实际数量

---

## 测试用例5：边界情况测试

### 5.1 没有已完成订单的情况
```bash
# 清空completed订单后测试
curl -X GET "http://localhost:3001/api/ordering/reports/today-revenue"
```
**预期**: 返回 totalRevenue=0, orderCount=0

### 5.2 日期格式错误
```bash
curl -X GET "http://localhost:3001/api/ordering/reports/today-revenue?date=2026/01/29"
```
**预期**: 可能返回错误或默认查询今日

### 5.3 未来日期查询
```bash
curl -X GET "http://localhost:3001/api/ordering/reports/today-revenue?date=2027-01-01"
```
**预期**: 返回 totalRevenue=0, orderCount=0

### 5.4 limit边界值测试
```bash
# limit=0
curl -X GET "http://localhost:3001/api/ordering/reports/dish-ranking?limit=0"

# limit为负数
curl -X GET "http://localhost:3001/api/ordering/reports/dish-ranking?limit=-5"
```
**预期**: 应该使用默认值或最小值1

---

## 性能测试

### 大数据量测试
- **场景**: orders表中有10,000+条记录
- **测试点**:
  - 查询今日收入的响应时间 < 500ms
  - 查询菜品排行榜的响应时间 < 1000ms
  - MongoDB索引是否正确使用（status、createdAt字段应有索引）

### 并发测试
- **场景**: 10个并发请求同时查询报表
- **测试点**:
  - 所有请求都能正常响应
  - 响应数据一致性
  - 无数据库连接错误

---

## 集成测试流程

### 完整业务流程测试
1. 创建订单（status='pending'）
2. 更新订单状态为'completed'
3. 查询今日收入，验证新订单已计入
4. 查询菜品排行榜，验证菜品销量更新

```bash
# 步骤1：创建订单
curl -X POST "http://localhost:3001/api/ordering/create-order" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'

# 步骤2：更新订单状态（假设orderId=abc123）
curl -X PATCH "http://localhost:3001/api/ordering/orders/abc123/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# 步骤3：查询今日收入
curl -X GET "http://localhost:3001/api/ordering/reports/today-revenue"

# 步骤4：查询菜品排行榜
curl -X GET "http://localhost:3001/api/ordering/reports/dish-ranking"
```

---

## 数据准备脚本（MongoDB）

如果需要准备测试数据，可以使用以下脚本：

```javascript
// 在MongoDB Shell中执行

use restaurant;

// 插入测试订单数据
db.orders.insertMany([
  {
    orderId: "test-order-1",
    userId: "user-1",
    dishes: [
      { dishId: ObjectId(), name: "宫保鸡丁", price: 28, quantity: 2 },
      { dishId: ObjectId(), name: "鱼香肉丝", price: 26, quantity: 1 }
    ],
    totalPrice: 82,
    status: "completed",
    createdAt: new Date("2026-01-29T12:00:00Z"),
    updatedAt: new Date("2026-01-29T12:30:00Z")
  },
  {
    orderId: "test-order-2",
    userId: "user-2",
    dishes: [
      { dishId: ObjectId(), name: "宫保鸡丁", price: 28, quantity: 1 },
      { dishId: ObjectId(), name: "麻婆豆腐", price: 22, quantity: 2 }
    ],
    totalPrice: 72,
    status: "completed",
    createdAt: new Date("2026-01-29T13:00:00Z"),
    updatedAt: new Date("2026-01-29T13:30:00Z")
  }
]);

// 验证数据
db.orders.find({ status: "completed" }).count();
```

---

## 测试检查清单

- [ ] 今日收入查询功能正常
- [ ] 指定日期收入查询功能正常
- [ ] 菜品排行榜查询功能正常
- [ ] limit参数验证正常
- [ ] 只统计completed状态订单
- [ ] 日期范围过滤正确
- [ ] 菜品销量统计准确
- [ ] 菜品收入计算准确
- [ ] 边界情况处理正常
- [ ] 性能满足要求
- [ ] API文档准确（Swagger）
- [ ] 日志输出正常

---

## 问题记录

| 日期 | 问题描述 | 解决方案 | 状态 |
|------|---------|---------|------|
| 2026-01-29 | 初始测试 | - | 待测试 |
