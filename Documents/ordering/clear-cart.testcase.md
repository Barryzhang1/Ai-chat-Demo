# 清空购物车和聊天历史测试用例

## 测试场景
当用户重新进入聊天界面时，需要清空购物车和聊天历史，以便开启新的点餐会话。

---

## 测试用例1：清空购物车和聊天历史 - 成功
**测试目标**：验证清空购物车和聊天历史接口能够正常工作

**前置条件**：
- 用户已登录，有有效的 JWT token
- 用户的购物车中有菜品数据
- 用户有聊天历史记录

**测试步骤**：
1. 发送 POST 请求到 `/api/ordering/clear-cart`
2. 请求头包含：`Authorization: Bearer <valid_token>`

**预期结果**：
- HTTP 状态码：200
- 响应体：
  ```json
  {
    "code": 0,
    "message": "购物车和聊天历史已清空",
    "data": null
  }
  ```
- 购物车中的菜品数组为空
- 购物车中的查询条件为空
- 购物车中的总价格为 0
- 聊天历史记录被清空

**验证方式**：
- 调用 GET `/api/ordering/cart` 查询购物车，确认 dishes 为空数组
- 调用 GET `/api/ordering/chat-history` 查询聊天历史，确认返回空数组

---

## 测试用例2：清空购物车和聊天历史 - 用户未登录
**测试目标**：验证未登录用户无法清空购物车

**前置条件**：
- 用户未登录或token无效

**测试步骤**：
1. 发送 POST 请求到 `/api/ordering/clear-cart`
2. 请求头不包含 Authorization 或包含无效token

**预期结果**：
- HTTP 状态码：401
- 响应体：
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```

---

## 测试用例3：清空购物车和聊天历史 - 购物车不存在
**测试目标**：验证当购物车不存在时，接口仍能正常工作

**前置条件**：
- 用户已登录，有有效的 JWT token
- 用户从未创建过购物车

**测试步骤**：
1. 发送 POST 请求到 `/api/ordering/clear-cart`
2. 请求头包含：`Authorization: Bearer <valid_token>`

**预期结果**：
- HTTP 状态码：200
- 响应体：
  ```json
  {
    "code": 0,
    "message": "购物车和聊天历史已清空",
    "data": null
  }
  ```
- 不抛出异常

---

## 测试用例4：清空购物车和聊天历史 - 聊天历史不存在
**测试目标**：验证当聊天历史不存在时，接口仍能正常工作

**前置条件**：
- 用户已登录，有有效的 JWT token
- 用户从未有过聊天历史

**测试步骤**：
1. 发送 POST 请求到 `/api/ordering/clear-cart`
2. 请求头包含：`Authorization: Bearer <valid_token>`

**预期结果**：
- HTTP 状态码：200
- 响应体：
  ```json
  {
    "code": 0,
    "message": "购物车和聊天历史已清空",
    "data": null
  }
  ```
- 不抛出异常

---

## 测试用例5：端到端测试 - 完整流程
**测试目标**：验证清空购物车后，用户能够重新开始点餐

**前置条件**：
- 用户已登录

**测试步骤**：
1. 调用 POST `/api/ordering/ai-order` 进行AI点餐，购物车中添加了菜品
2. 调用 POST `/api/ordering/clear-cart` 清空购物车和聊天历史
3. 调用 GET `/api/ordering/cart` 查询购物车
4. 调用 GET `/api/ordering/chat-history` 查询聊天历史
5. 再次调用 POST `/api/ordering/ai-order` 进行新的点餐

**预期结果**：
- 步骤2返回成功（200）
- 步骤3返回空购物车
- 步骤4返回空聊天历史
- 步骤5能够正常进行AI点餐，不受之前会话影响

---

## 性能要求
- 接口响应时间 < 500ms
- 支持并发调用

## 安全要求
- 必须通过JWT认证
- 只能清空当前用户自己的购物车和聊天历史
