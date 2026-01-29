# 数据报表功能测试用例

## 测试模块
ordering/reports - 订单数据报表

## 测试日期
2026-01-29

---

## 测试用例 1: 查询今日总收入（默认今日）

### 测试目标
验证不传日期参数时，系统能正确查询今日已完成订单的总收入

### 前置条件
- 数据库中存在今日创建的completed状态订单
- 订单包含有效的totalPrice字段

### 测试步骤
1. 发送GET请求到 `/api/ordering/reports/today-revenue`
2. 不传递任何查询参数

### 预期结果
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
- [ ] 返回的date字段是今日日期（YYYY-MM-DD格式）
- [ ] totalRevenue是数字类型，保留2位小数
- [ ] orderCount等于今日completed订单数量
- [ ] 只统计status='completed'的订单
- [ ] HTTP状态码为200

---

## 测试用例 2: 查询指定日期的总收入

### 测试目标
验证传入指定日期时，系统能正确查询该日期的订单收入

### 前置条件
- 数据库中存在2026-01-28日期的completed订单

### 测试步骤
1. 发送GET请求到 `/api/ordering/reports/today-revenue?date=2026-01-28`
2. 传递date参数：2026-01-28

### 预期结果
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
- [ ] 返回的date字段与请求参数一致
- [ ] 只统计2026-01-28 00:00:00 到 23:59:59之间的订单
- [ ] 只统计status='completed'的订单
- [ ] totalRevenue计算正确

---

## 测试用例 3: 查询没有订单的日期

### 测试目标
验证查询没有完成订单的日期时，返回正确的空结果

### 前置条件
- 2027-01-01日期没有任何completed订单

### 测试步骤
1. 发送GET请求到 `/api/ordering/reports/today-revenue?date=2027-01-01`

### 预期结果
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "date": "2027-01-01",
    "totalRevenue": 0,
    "orderCount": 0
  }
}
```

### 验证点
- [ ] totalRevenue为0
- [ ] orderCount为0
- [ ] 不报错，正常返回

---

## 测试用例 4: 查询菜品排行榜（默认10条）

### 测试目标
验证不传limit参数时，返回销量前10的菜品

### 前置条件
- 数据库中存在至少10个不同的菜品在completed订单中

### 测试步骤
1. 发送GET请求到 `/api/ordering/reports/dish-ranking`
2. 不传递任何查询参数

### 预期结果
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
- [ ] 返回最多10条记录
- [ ] 按totalQuantity降序排列（第一条是销量最高的）
- [ ] 每条记录包含：dishId、dishName、totalQuantity、totalRevenue、orderCount
- [ ] totalRevenue计算正确（price * quantity的总和）
- [ ] 只统计status='completed'的订单

---

## 测试用例 5: 查询指定数量的菜品排行

### 测试目标
验证传入limit参数时，返回指定数量的菜品

### 前置条件
- 数据库中存在足够的菜品数据

### 测试步骤
1. 测试limit=5: `/api/ordering/reports/dish-ranking?limit=5`
2. 测试limit=20: `/api/ordering/reports/dish-ranking?limit=20`
3. 测试limit=100（超过最大值）: `/api/ordering/reports/dish-ranking?limit=100`

### 预期结果
- limit=5时，返回5条记录
- limit=20时，返回20条记录
- limit=100时，返回最多50条记录（被限制）

### 验证点
- [ ] 参数验证：1 <= limit <= 50
- [ ] 返回的记录数不超过limit
- [ ] 如果菜品总数少于limit，返回实际数量
- [ ] 仍然按销量降序排列

---

## 测试用例 6: limit边界值测试

### 测试目标
验证limit参数的边界值处理

### 测试步骤
1. limit=0: `/api/ordering/reports/dish-ranking?limit=0`
2. limit=-5: `/api/ordering/reports/dish-ranking?limit=-5`
3. limit=1: `/api/ordering/reports/dish-ranking?limit=1`
4. limit=50: `/api/ordering/reports/dish-ranking?limit=50`
5. limit=51: `/api/ordering/reports/dish-ranking?limit=51`

### 预期结果
- limit <= 0: 使用默认值10或最小值1
- limit=1: 返回1条记录
- limit=50: 返回最多50条记录
- limit > 50: 被限制为50

### 验证点
- [ ] 边界值处理正确
- [ ] 不会因为非法参数导致错误

---

## 测试用例 7: 收入计算准确性测试

### 测试目标
验证收入计算的准确性

### 前置条件
准备3个测试订单：
- 订单1: totalPrice = 100.50, status = 'completed', 今日
- 订单2: totalPrice = 200.30, status = 'completed', 今日
- 订单3: totalPrice = 150.00, status = 'pending', 今日

### 测试步骤
1. 查询今日收入

### 预期结果
```json
{
  "data": {
    "totalRevenue": 300.80,  // 只统计订单1和订单2
    "orderCount": 2
  }
}
```

### 验证点
- [ ] 只统计completed状态订单
- [ ] 不统计pending状态订单
- [ ] 金额计算准确（100.50 + 200.30 = 300.80）
- [ ] 保留2位小数

---

## 测试用例 8: 菜品销量计算准确性测试

### 测试目标
验证菜品销量和收入的统计准确性

### 前置条件
准备测试数据：
- 订单1: 宫保鸡丁 x2 (price=28), status='completed'
- 订单2: 宫保鸡丁 x3 (price=28), status='completed'  
- 订单3: 宫保鸡丁 x1 (price=28), status='pending'

### 测试步骤
1. 查询菜品排行榜
2. 找到"宫保鸡丁"的记录

### 预期结果
```json
{
  "dishName": "宫保鸡丁",
  "totalQuantity": 5,       // 2 + 3 = 5 (不包括pending订单的1)
  "totalRevenue": 140.00,   // 5 * 28 = 140
  "orderCount": 2           // 出现在2个completed订单中
}
```

### 验证点
- [ ] totalQuantity = 所有completed订单中该菜品的quantity总和
- [ ] totalRevenue = 所有completed订单中该菜品的 price*quantity 总和
- [ ] orderCount = 该菜品出现在多少个completed订单中
- [ ] 不统计pending/cancelled等非completed订单

---

## 测试用例 9: 日期格式验证

### 测试目标
验证日期参数的格式验证

### 测试步骤
1. 正确格式: `?date=2026-01-29`
2. 错误格式1: `?date=2026/01/29`
3. 错误格式2: `?date=20260129`
4. 错误格式3: `?date=2026-1-9`

### 预期结果
- 正确格式：正常返回结果
- 错误格式：可能返回错误或使用默认值（今日）

### 验证点
- [ ] 严格验证YYYY-MM-DD格式
- [ ] 错误格式有合理的错误提示

---

## 测试用例 10: 性能测试

### 测试目标
验证大数据量下的查询性能

### 前置条件
- 数据库中有10,000+条completed订单记录

### 测试步骤
1. 查询今日收入，记录响应时间
2. 查询菜品排行榜，记录响应时间

### 预期结果
- 今日收入查询：响应时间 < 500ms
- 菜品排行榜查询：响应时间 < 1000ms

### 验证点
- [ ] 响应时间在可接受范围内
- [ ] 没有超时错误
- [ ] MongoDB索引正确使用

---

## 集成测试：完整业务流程

### 测试目标
验证从创建订单到查询报表的完整流程

### 测试步骤
1. 创建一个新订单（status='pending'）
2. 查询今日收入（此时不应包含新订单）
3. 更新订单状态为'completed'
4. 再次查询今日收入（应该包含新订单）
5. 查询菜品排行榜（新订单中的菜品应该在排行榜中）

### 验证点
- [ ] pending订单不计入收入统计
- [ ] completed订单立即计入收入统计
- [ ] 菜品销量实时更新
- [ ] 数据一致性正确

---

## 测试环境

### 开发环境
- **Backend**: http://localhost:3001
- **数据库**: MongoDB (localhost:27017)
- **测试工具**: Postman / cURL / REST Client

### 测试数据准备
```javascript
// MongoDB Shell
use restaurant;

// 插入测试订单
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
```

---

## 测试结果汇总

| 测试用例 | 状态 | 备注 |
|---------|------|------|
| 测试用例 1 | 待测试 | 查询今日总收入（默认今日） |
| 测试用例 2 | 待测试 | 查询指定日期的总收入 |
| 测试用例 3 | 待测试 | 查询没有订单的日期 |
| 测试用例 4 | 待测试 | 查询菜品排行榜（默认10条） |
| 测试用例 5 | 待测试 | 查询指定数量的菜品排行 |
| 测试用例 6 | 待测试 | limit边界值测试 |
| 测试用例 7 | 待测试 | 收入计算准确性测试 |
| 测试用例 8 | 待测试 | 菜品销量计算准确性测试 |
| 测试用例 9 | 待测试 | 日期格式验证 |
| 测试用例 10 | 待测试 | 性能测试 |
| 集成测试 | 待测试 | 完整业务流程 |

---

## 缺陷记录

| 编号 | 发现日期 | 描述 | 严重程度 | 状态 | 解决方案 |
|------|---------|------|---------|------|---------|
| - | - | - | - | - | - |

---

## 测试结论

待测试完成后填写。

---

## 附录：快速测试脚本

### Bash脚本
```bash
#!/bin/bash

BASE_URL="http://localhost:3001/api/ordering/reports"

echo "=== 测试1: 查询今日收入 ==="
curl -X GET "$BASE_URL/today-revenue"

echo "\n\n=== 测试2: 查询指定日期收入 ==="
curl -X GET "$BASE_URL/today-revenue?date=2026-01-28"

echo "\n\n=== 测试3: 查询菜品排行榜 ==="
curl -X GET "$BASE_URL/dish-ranking"

echo "\n\n=== 测试4: 查询前20名菜品 ==="
curl -X GET "$BASE_URL/dish-ranking?limit=20"
```

### Postman Collection
导入以下JSON到Postman:
```json
{
  "info": {
    "name": "Reports API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "查询今日收入",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/api/ordering/reports/today-revenue"
      }
    },
    {
      "name": "查询指定日期收入",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/api/ordering/reports/today-revenue?date=2026-01-28"
      }
    },
    {
      "name": "查询菜品排行榜",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/api/ordering/reports/dish-ranking"
      }
    },
    {
      "name": "查询前20名菜品",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/api/ordering/reports/dish-ranking?limit=20"
      }
    }
  ]
}
```
