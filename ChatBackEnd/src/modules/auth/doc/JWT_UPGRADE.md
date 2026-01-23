# 认证模块升级说明

## ⚠️ 重要提示

认证模块已升级为完整的JWT认证系统，但需要先安装依赖才能正常运行。

## 📦 第一步：安装依赖

```bash
cd ChatBackEnd
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

## 🔧 第二步：配置环境变量

在 `ChatBackEnd/.env` 文件中添加：

```env
# JWT配置
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_EXPIRES_IN=24h
```

⚠️ **安全提示**: 生产环境请使用强随机密钥（至少32字符）！

可以使用以下命令生成随机密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ✅ 第三步：启动服务

```bash
npm run start:dev
```

## 🎯 功能说明

### 已实现的功能

1. **用户注册** (`POST /auth/register`)
   - ✅ 使用真实的JWT token
   - ✅ Token有效期24小时（可配置）
   - ✅ 完整的输入验证

2. **获取用户信息** (`GET /auth/me`)
   - ✅ 需要JWT认证
   - ✅ 通过Bearer Token访问
   - ✅ 返回完整用户信息

3. **授权验证** (JwtAuthGuard)
   - ✅ JWT签名验证
   - ✅ Token过期验证
   - ✅ 用户存在性验证
   - ✅ 统一401错误处理

## 📝 API使用示例

### 1. 注册用户

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"测试用户"}'
```

响应：
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "nickname": "测试用户",
      "createdAt": "2026-01-23T10:30:00.000Z"
    }
  }
}
```

### 2. 获取用户信息

```bash
# 将上一步获取的token替换到这里
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

响应：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": "uuid",
    "nickname": "测试用户",
    "createdAt": "2026-01-23T10:30:00.000Z",
    "updatedAt": "2026-01-23T10:30:00.000Z"
  }
}
```

## 🔒 授权错误示例

### 未提供Token
```bash
curl -X GET http://localhost:3000/auth/me
```

响应：`401 Unauthorized`
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Token无效或过期
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer invalid-token"
```

响应：`401 Unauthorized`

## 📋 新增文件列表

- `interfaces/jwt-payload.interface.ts` - JWT载荷接口
- `jwt.strategy.ts` - JWT验证策略
- `guards/jwt-auth.guard.ts` - JWT认证守卫
- `dto/user-info.dto.ts` - 用户信息响应DTO

## 🔄 修改文件列表

- `auth.module.ts` - 集成JwtModule和PassportModule
- `auth.service.ts` - 使用JwtService生成真实JWT
- `auth.controller.ts` - 添加GET /auth/me接口

## 🧪 测试

安装依赖后，运行测试：

```bash
npm test -- --testPathPattern=auth
```

## ⚙️ JWT工作原理

1. **注册流程**:
   - 用户提交昵称 → 验证通过 → 创建用户 → 生成JWT token → 返回

2. **JWT Token结构**:
   ```json
   {
     "sub": "user-id",
     "nickname": "用户昵称",
     "iat": 1737617400,
     "exp": 1737703800
   }
   ```

3. **认证流程**:
   - 请求携带token → JwtStrategy验证签名 → 检查过期 → 查询用户 → 注入req.user

## 💡 下一步建议

1. 连接真实数据库（PostgreSQL/MySQL）
2. 添加Token刷新机制
3. 实现用户登出（Token黑名单）
4. 添加请求频率限制

---

**升级完成时间**: 2026-01-23  
**状态**: ✅ 代码已完成，等待安装依赖
