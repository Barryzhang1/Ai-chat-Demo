# 菜品上架库存检查功能 - 测试用例

## 功能描述
在菜品上架时，系统需要检查该菜品绑定的所有食材库存是否充足。如果有任何食材库存为0，则拒绝上架并提示具体哪个食材不足。

## 测试环境
- **API端点**: `PATCH /dish/:id/status`
- **请求体**: `{ "isDelisted": false }`
- **涉及数据表**: `dishes`, `inventories`

---

## 测试用例

### 测试用例 1: 上架菜品 - 所有食材库存充足
**前置条件**:
- 菜品A（_id: dish001）状态为下架（isDelisted: true）
- 菜品A绑定了2种食材：
  - 食材1（_id: inv001, productName: "番茄", quantity: 50）
  - 食材2（_id: inv002, productName: "鸡蛋", quantity: 30）

**测试步骤**:
1. 发送 PATCH 请求到 `/dish/dish001/status`
2. 请求体: `{ "isDelisted": false }`

**预期结果**:
- ✅ HTTP 状态码: 200
- ✅ 菜品成功上架
- ✅ 响应数据中 isDelisted 为 false

---

### 测试用例 2: 上架菜品 - 单个食材库存为0
**前置条件**:
- 菜品B（_id: dish002）状态为下架（isDelisted: true）
- 菜品B绑定了3种食材：
  - 食材1（_id: inv003, productName: "牛肉", quantity: 0）⚠️
  - 食材2（_id: inv004, productName: "洋葱", quantity: 20）
  - 食材3（_id: inv005, productName: "青椒", quantity: 15）

**测试步骤**:
1. 发送 PATCH 请求到 `/dish/dish002/status`
2. 请求体: `{ "isDelisted": false }`

**预期结果**:
- ❌ HTTP 状态码: 400
- ❌ 错误消息: "牛肉食材不足，无法上架"
- ❌ 菜品保持下架状态（isDelisted: true）

---

### 测试用例 3: 上架菜品 - 多个食材库存为0
**前置条件**:
- 菜品C（_id: dish003）状态为下架（isDelisted: true）
- 菜品C绑定了4种食材：
  - 食材1（_id: inv006, productName: "鸡肉", quantity: 0）⚠️
  - 食材2（_id: inv007, productName: "土豆", quantity: 25）
  - 食材3（_id: inv008, productName: "胡萝卜", quantity: 0）⚠️
  - 食材4（_id: inv009, productName: "酱油", quantity: 10）

**测试步骤**:
1. 发送 PATCH 请求到 `/dish/dish003/status`
2. 请求体: `{ "isDelisted": false }`

**预期结果**:
- ❌ HTTP 状态码: 400
- ❌ 错误消息: "鸡肉、胡萝卜食材不足，无法上架"
- ❌ 菜品保持下架状态（isDelisted: true）

---

### 测试用例 4: 上架菜品 - 未绑定任何食材
**前置条件**:
- 菜品D（_id: dish004）状态为下架（isDelisted: true）
- 菜品D没有绑定任何食材（ingredients: []）

**测试步骤**:
1. 发送 PATCH 请求到 `/dish/dish004/status`
2. 请求体: `{ "isDelisted": false }`

**预期结果**:
- ✅ HTTP 状态码: 200
- ✅ 菜品成功上架（未绑定食材的菜品可以直接上架）
- ✅ 响应数据中 isDelisted 为 false

---

### 测试用例 5: 下架菜品 - 不检查库存
**前置条件**:
- 菜品E（_id: dish005）状态为上架（isDelisted: false）
- 菜品E绑定了食材，但所有食材库存为0

**测试步骤**:
1. 发送 PATCH 请求到 `/dish/dish005/status`
2. 请求体: `{ "isDelisted": true }`

**预期结果**:
- ✅ HTTP 状态码: 200
- ✅ 菜品成功下架
- ✅ 响应数据中 isDelisted 为 true
- ✅ 不检查库存（下架操作不需要库存检查）

---

### 测试用例 6: 上架菜品 - 绑定的食材ID不存在
**前置条件**:
- 菜品F（_id: dish006）状态为下架（isDelisted: true）
- 菜品F绑定了不存在的食材ID（ingredients: ["nonexistent_id"]）

**测试步骤**:
1. 发送 PATCH 请求到 `/dish/dish006/status`
2. 请求体: `{ "isDelisted": false }`

**预期结果**:
- ❌ HTTP 状态码: 400 或 404
- ❌ 错误消息: "部分绑定食材不存在"
- ❌ 菜品保持下架状态

---

### 测试用例 7: 上架菜品 - 食材库存临界值（quantity = 1）
**前置条件**:
- 菜品G（_id: dish007）状态为下架（isDelisted: true）
- 菜品G绑定了1种食材：
  - 食材1（_id: inv010, productName: "香菜", quantity: 1）

**测试步骤**:
1. 发送 PATCH 请求到 `/dish/dish007/status`
2. 请求体: `{ "isDelisted": false }`

**预期结果**:
- ✅ HTTP 状态码: 200
- ✅ 菜品成功上架（quantity = 1 也算有库存）
- ✅ 响应数据中 isDelisted 为 false

---

## 测试数据准备脚本

```javascript
// MongoDB 插入测试数据
db.dishes.insertMany([
  {
    _id: ObjectId("dish001"),
    name: "番茄炒蛋",
    price: 18,
    categoryId: "cat001",
    isDelisted: true,
    ingredients: ["inv001", "inv002"],
    tags: []
  },
  {
    _id: ObjectId("dish002"),
    name: "黑椒牛肉",
    price: 38,
    categoryId: "cat002",
    isDelisted: true,
    ingredients: ["inv003", "inv004", "inv005"],
    tags: []
  }
]);

db.inventories.insertMany([
  { _id: ObjectId("inv001"), productName: "番茄", quantity: 50, lastPrice: 3 },
  { _id: ObjectId("inv002"), productName: "鸡蛋", quantity: 30, lastPrice: 1 },
  { _id: ObjectId("inv003"), productName: "牛肉", quantity: 0, lastPrice: 45 },
  { _id: ObjectId("inv004"), productName: "洋葱", quantity: 20, lastPrice: 2 },
  { _id: ObjectId("inv005"), productName: "青椒", quantity: 15, lastPrice: 3 }
]);
```

---

## 测试验收标准
- ✅ 上架时必须检查所有绑定食材的库存
- ✅ 任何食材库存为0时，拒绝上架并提示具体食材名称
- ✅ 多个食材库存为0时，错误消息中列出所有不足的食材
- ✅ 下架操作不需要进行库存检查
- ✅ 未绑定食材的菜品可以直接上架
- ✅ 错误消息格式清晰，便于用户理解
