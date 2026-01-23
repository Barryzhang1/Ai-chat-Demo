# 认证模块 (Auth Module)

## 模块概述

认证模块负责用户的身份验证和授权管理，提供用户注册、token生成和用户信息获取等核心功能。

## 功能列表

### 1. 用户注册
- **功能描述**：用户通过提供昵称即可完成注册，系统返回JWT token
- **详细需求**：[注册功能需求](./auth/register.md)

### 2. 获取用户信息
- **功能描述**：已认证用户通过token获取个人信息
- **详细需求**：[获取用户信息需求](./auth/get-user-info.md)

### 3. 未授权处理
- **功能描述**：对未授权或token无效的请求返回401状态码
- **详细需求**：[授权验证需求](./auth/authorization.md)

## 技术方案

### 技术栈
- **框架**：NestJS
- **认证方式**：JWT (JSON Web Token)
- **数据库**：MongoDB + Mongoose
- **密码加密**：bcrypt (如后续需要密码功能)

### 数据模型

#### User Document (MongoDB)
```typescript
{
  _id: ObjectId;        // MongoDB自动生成的ID
  id: string;           // 用户唯一标识 (UUID v4)
  nickname: string;     // 用户昵称
  createdAt: Date;      // 创建时间（自动生成）
  updatedAt: Date;      // 更新时间（自动更新）
}
```

### API 端点

| 方法 | 路径 | 描述 | 需要认证 |
|------|------|------|---------|
| POST | /auth/register | 用户注册 | ❌ |
| GET | /auth/me | 获取当前用户信息 | ✅ |

## 安全考虑

1. **Token 安全**
   - JWT token 使用环境变量配置的密钥签名
   - Token 设置合理的过期时间（建议24小时）
   - Token 应通过 HTTP Header `Authorization: Bearer <token>` 传递

2. **输入验证**
   - 昵称长度限制：2-20个字符
   - 昵称不能包含特殊字符（仅允许中文、英文、数字、下划线）
   - 防止NoSQL注入和XSS攻击
   - 使用Mongoose Schema验证

3. **错误处理**
   - 统一的错误响应格式
   - 不暴露敏感的系统信息
   - 401: 未授权
   - 400: 请求参数错误
   - 409: 昵称已存在（唯一索引冲突）
   - 500: 服务器内部错误

## 依赖模块

- `@nestjs/jwt` - JWT token 生成和验证
- `@nestjs/passport` - 认证中间件
- `passport-jwt` - JWT 认证策略
- `@nestjs/mongoose` - MongoDB集成
- `mongoose` - MongoDB ODM

## 数据库配置

### MongoDB连接
```env
MONGODB_URI=mongodb://localhost:27017/chat-demo
# 或使用MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-demo
```

### 索引
- `id`: 唯一索引
- `nickname`: 唯一索引
- `createdAt`: 普通索引（用于排序查询）

## 后续扩展

- [ ] 支持密码登录
- [ ] 支持第三方登录（微信、GitHub等）
- [ ] Token 刷新机制
- [ ] 用户登出（Token黑名单）
- [ ] 多设备登录管理
