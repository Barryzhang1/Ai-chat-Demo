# 获取用户信息功能需求

## 功能描述

已认证用户通过在请求头中携带有效的JWT token，可以获取当前登录用户的详细信息。

## API 规范

### 请求

**端点**：`GET /auth/me`

**认证方式**：Bearer Token

**请求头**：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**请求体**：无

### 响应

#### 成功响应 (200 OK)

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nickname": "小明",
    "createdAt": "2026-01-23T10:30:00.000Z",
    "updatedAt": "2026-01-23T10:30:00.000Z"
  }
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 响应码，0表示成功 |
| message | string | 响应消息 |
| data.id | string | 用户唯一标识 (UUID) |
| data.nickname | string | 用户昵称 |
| data.createdAt | string | 用户创建时间 (ISO 8601) |
| data.updatedAt | string | 用户信息最后更新时间 (ISO 8601) |

#### 失败响应

**未提供Token (401 Unauthorized)**：
```json
{
  "code": 401,
  "message": "未授权，请先登录"
}
```

**Token无效 (401 Unauthorized)**：
```json
{
  "code": 401,
  "message": "Token无效或已过期"
}
```

**Token格式错误 (401 Unauthorized)**：
```json
{
  "code": 401,
  "message": "Token格式不正确"
}
```

**用户不存在 (404 Not Found)**：
```json
{
  "code": 404,
  "message": "用户不存在"
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

1. **接收请求**：从请求头获取Authorization字段
2. **提取Token**：
   - 检查Authorization字段是否存在
   - 验证格式是否为 `Bearer <token>`
   - 提取token字符串
3. **验证Token**：
   - 使用JWT密钥验证token签名
   - 检查token是否过期
   - 解析token payload获取userId
4. **查询用户**：
   - 根据userId从数据库查询用户信息
   - 检查用户是否存在
5. **返回响应**：返回用户详细信息

### 认证流程图

```
请求 → 提取Token → 验证Token → 解析userId → 查询数据库 → 返回用户信息
         ↓             ↓            ↓
      401错误       401错误      404错误
```

## 技术实现

### JWT Payload 结构

```typescript
interface JwtPayload {
  userId: string;      // 用户ID
  nickname: string;    // 用户昵称
  iat: number;        // 签发时间 (issued at)
  exp: number;        // 过期时间 (expiration)
}
```

### JWT 验证策略

```typescript
// Passport JWT Strategy 配置示例
{
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: process.env.JWT_SECRET,
}
```

### 认证守卫

使用 NestJS 的 `@UseGuards(JwtAuthGuard)` 装饰器保护需要认证的路由。

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req) {
  return req.user;
}
```

## 安全考虑

1. **Token 传输**
   - 必须使用 HTTPS 传输
   - Token不应出现在URL中
   - 仅通过Authorization Header传递

2. **Token 验证**
   - 验证签名确保token未被篡改
   - 检查过期时间防止token重放
   - 验证签发者（issuer）和受众（audience）

3. **错误处理**
   - 不暴露具体的token解析错误（避免信息泄露）
   - 统一返回401错误码
   - 记录异常访问日志用于安全审计

4. **性能优化**
   - 可以缓存用户信息减少数据库查询
   - Token验证应该高效（JWT自验证特性）

## 测试用例

### 正常场景

| 场景 | 条件 | 期望输出 |
|------|------|----------|
| 获取当前用户信息 | 提供有效token | 200, 返回用户完整信息 |

### 异常场景

| 场景 | 条件 | 期望输出 |
|------|------|----------|
| 未提供Authorization头 | 请求头无Authorization | 401, 未授权 |
| Token格式错误 - 缺少Bearer前缀 | `Authorization: <token>` | 401, Token格式不正确 |
| Token格式错误 - 空token | `Authorization: Bearer ` | 401, Token格式不正确 |
| Token无效 - 签名错误 | 提供被篡改的token | 401, Token无效 |
| Token过期 | 提供过期的token | 401, Token已过期 |
| Token有效但用户已被删除 | 用户在数据库中不存在 | 404, 用户不存在 |
| 错误的token格式 | 提供非JWT格式字符串 | 401, Token无效 |

## 非功能需求

### 性能要求
- 响应时间：< 200ms (P95)
- 并发支持：500 QPS
- 数据库查询优化：使用索引查询用户ID

### 安全要求
- 所有请求必须通过HTTPS
- Token验证失败应记录日志
- 实施频率限制防止暴力破解

### 可用性要求
- 服务可用性：99.9%
- Token验证失败不应影响其他请求

## 实现建议

1. 使用 `@nestjs/passport` 和 `passport-jwt` 实现JWT认证策略
2. 创建自定义的 `JwtAuthGuard` 继承 `AuthGuard('jwt')`
3. 使用装饰器 `@CurrentUser()` 简化用户信息获取
4. 全局异常过滤器统一处理401错误
5. 考虑使用Redis缓存用户信息（可选）
6. Token过期时间配置化（环境变量 `JWT_EXPIRES_IN`）

## 扩展功能

- [ ] 支持Token刷新机制
- [ ] 支持多端登录管理
- [ ] 支持Token黑名单（登出功能）
- [ ] 支持角色和权限验证
- [ ] 添加请求频率限制
