# 修改订单状态接口测试用例

## 测试场景

### 场景1：成功修改订单状态（pending → completed）
**前置条件**：
- 用户已登录并获得JWT token
- 已存在一个状态为"pending"的订单

**测试步骤**：
1. 发送PATCH请求到 `/ordering/orders/{orderId}/status`
2. 请求头携带Authorization: Bearer {token}
3. 请求体：
```json
{
  "status": "completed"
}
```

**预期结果**：
- HTTP状态码：200
- 响应体：
```json
{
  "code": 0,
  "message": "订单状态修改成功",
  "data": {
    "orderId": "xxx",
    "userId": "xxx",
    "status": "completed",
    "dishes": [...],
    "totalPrice": 100.5,
    "note": "订单备注",
    "createdAt": "2026-01-29T...",
    "updatedAt": "2026-01-29T..."
  }
}
```

### 场景2：修改不存在的订单
**测试步骤**：
1. 使用一个不存在的orderId
2. 发送PATCH请求

**预期结果**：
- HTTP状态码：404
- 错误信息："订单不存在"

### 场景3：修改其他用户的订单
**前置条件**：
- 用户A登录
- 订单属于用户B

**测试步骤**：
1. 用户A尝试修改用户B的订单
2. 发送PATCH请求

**预期结果**：
- HTTP状态码：400
- 错误信息："无权限修改此订单"

### 场景4：状态参数验证
**测试步骤**：
1. 发送无效的status值（如"invalid_status"）
2. 发送PATCH请求

**预期结果**：
- HTTP状态码：400
- 错误信息：包含状态验证失败的信息

### 场景5：未授权访问
**测试步骤**：
1. 不携带JWT token
2. 发送PATCH请求

**预期结果**：
- HTTP状态码：401
- 错误信息："未授权"

## 手动测试示例

### 使用curl测试

```bash
# 1. 先创建一个订单（假设已有订单ID）
ORDER_ID="your-order-id"
TOKEN="your-jwt-token"

# 2. 修改订单状态为completed
curl -X PATCH http://localhost:3000/ordering/orders/${ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "completed"}'

# 3. 尝试修改为confirmed
curl -X PATCH http://localhost:3000/ordering/orders/${ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "confirmed"}'

# 4. 尝试使用无效状态（应该失败）
curl -X PATCH http://localhost:3000/ordering/orders/${ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "invalid"}'
```

### 使用Postman测试

**请求配置**：
- Method: PATCH
- URL: `http://localhost:3000/ordering/orders/{orderId}/status`
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer {your_token}
- Body (raw JSON):
```json
{
  "status": "completed"
}
```

## 测试数据准备

1. 确保数据库中有测试用户
2. 创建测试订单：
```bash
# 登录获取token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "test_phone", "password": "test_password"}'

# 创建订单
curl -X POST http://localhost:3000/ordering/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"note": "测试订单"}'
```

## 验证检查点

✅ 订单状态成功更新  
✅ updatedAt时间戳已更新  
✅ 只有订单所属用户可以修改  
✅ 无效状态被正确拒绝  
✅ 不存在的订单返回404  
✅ 未授权请求返回401  
✅ API文档正确显示（访问 http://localhost:3000/api 查看Swagger文档）
