# 认证模块手动测试验证清单

## 测试前准备

1. 启动服务器
```bash
npm run start:dev
```

2. 确认服务运行在 http://localhost:3000

## API测试用例

### ✅ 正常场景

#### 测试1：注册中文昵称用户
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"小明"}'
```

**期望结果：**
- HTTP 状态码：201
- 返回包含 `token` 和 `user` 对象
- `user.nickname` 为 "小明"
- `user.id` 为有效的UUID
- `user.createdAt` 为ISO 8601格式

---

#### 测试2：注册英文昵称用户
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"Tom"}'
```

**期望结果：** 201，成功返回用户信息

---

#### 测试3：注册混合昵称用户
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"小明Tom123"}'
```

**期望结果：** 201，成功返回用户信息

---

#### 测试4：注册带下划线的昵称
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"user_123"}'
```

**期望结果：** 201，成功返回用户信息

---

### ❌ 异常场景 - DTO验证

#### 测试5：昵称为空
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":""}'
```

**期望结果：**
- HTTP 状态码：400
- 错误消息包含 "昵称"

---

#### 测试6：昵称过短（1个字符）
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"a"}'
```

**期望结果：**
- HTTP 状态码：400
- 错误消息包含 "2-20个字符"

---

#### 测试7：昵称过长（21个字符）
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"这是一个超过二十个字符的非常长的昵称"}'
```

**期望结果：**
- HTTP 状态码：400
- 错误消息包含 "2-20个字符"

---

#### 测试8：昵称包含特殊字符（@）
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"小明@123"}'
```

**期望结果：**
- HTTP 状态码：400
- 错误消息包含 "中文、英文、数字和下划线"

---

#### 测试9：昵称包含空格
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"小 明"}'
```

**期望结果：**
- HTTP 状态码：400
- 错误消息包含 "中文、英文、数字和下划线"

---

#### 测试10：缺少nickname字段
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{}'
```

**期望结果：**
- HTTP 状态码：400
- 错误消息包含 "昵称"

---

### ❌ 异常场景 - 业务逻辑

#### 测试11：昵称已存在
```bash
# 第一次注册
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"重复测试"}'

# 第二次注册（应该失败）
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"重复测试"}'
```

**期望结果：**
- 第一次：201，成功
- 第二次：409，错误消息 "昵称已被使用"

---

## 测试结果记录

| 测试编号 | 测试场景 | 状态 | 备注 |
|---------|---------|------|------|
| 1 | 注册中文昵称 | ⬜ |  |
| 2 | 注册英文昵称 | ⬜ |  |
| 3 | 注册混合昵称 | ⬜ |  |
| 4 | 注册带下划线昵称 | ⬜ |  |
| 5 | 昵称为空 | ⬜ |  |
| 6 | 昵称过短 | ⬜ |  |
| 7 | 昵称过长 | ⬜ |  |
| 8 | 昵称包含@ | ⬜ |  |
| 9 | 昵称包含空格 | ⬜ |  |
| 10 | 缺少昵称字段 | ⬜ |  |
| 11 | 昵称已存在 | ⬜ |  |

**符号说明：**
- ⬜ 未测试
- ✅ 通过
- ❌ 失败

## 使用Postman或其他API工具测试

如果你使用Postman或类似工具，可以导入以下测试集合：

### 基础设置
- Base URL: `http://localhost:3000`
- Content-Type: `application/json`

### 请求示例
- Method: `POST`
- Endpoint: `/auth/register`
- Body (raw JSON):
```json
{
  "nickname": "测试用户"
}
```

## 自动化测试命令

如果要运行自动化测试：

```bash
# 运行单元测试
npm test -- --testPathPattern=auth

# 运行E2E测试
npm run test:e2e -- --testPathPattern=auth

# 查看测试覆盖率
npm run test:cov -- --testPathPattern=auth
```
