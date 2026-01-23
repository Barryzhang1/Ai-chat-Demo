# 🚀 认证模块快速启动指南

## ⚠️ 安装依赖（必需）

```bash
cd ChatBackEnd
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

## 🔧 配置环境变量

创建 `.env` 文件：

```bash
# JWT配置
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# 服务配置
PORT=3000
```

## 1️⃣ 启动服务

```bash
cd ChatBackEnd
npm run start:dev
```

服务启动后会显示：
```
Application is running on: http://localhost:3000
Swagger documentation available at: http://localhost:3000/api
```

## 2️⃣ 测试API

### 测试1：注册用户

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"测试用户"}'
```

### 预期响应

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nickname": "测试用户",
      "createdAt": "2026-01-23T10:30:00.000Z"
    }
  }
}
```

### 测试2：获取用户信息

```bash
# 将上一步获取的token替换到这里
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 预期响应

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nickname": "测试用户",
## 📖 完整文档

- **JWT升级说明：** `src/modules/auth/doc/JWT_UPGRADE.md` ⭐ 必读
- **模块总览：** `src/modules/auth/doc/README.md`
- **实现详情：** `src/modules/auth/doc/IMPLEMENTATION.md`
- **测试说明：** `src/modules/auth/doc/TESTING.md`
- **手动测试：** `src/modules/auth/doc/MANUAL_TESTING.md`
- **开发报告：** `src/modules/auth/doc/DEVELOPMENT_REPORT.md`

## ✅ 功能状态

- ✅ 用户注册功能（JWT Token）
- ✅ 获取用户信息接口
- ✅ JWT认证守卫
- ✅ 授权验证功能
- ✅ 输入验证已配置
- ✅ 测试用例已完成
- ✅ 文档已完善

## ⚠️ 注意事项

1. **JWT依赖：** 必须先安装JWT相关依赖
2. **环境变量：** 必须配置JWT_SECRET
3. **数据存储：** 当前使用内存存储，服务重启后数据会丢失
4. **生产部署：** 需要连接真实数据库后才可用于生产环境
# 或使用测试脚本
chmod +x test-auth.sh
./test-auth.sh
```

## 📖 完整文档

- **模块总览：** `src/modules/auth/doc/README.md`
- **实现详情：** `src/modules/auth/doc/IMPLEMENTATION.md`
- **测试说明：** `src/modules/auth/doc/TESTING.md`
- **手动测试：** `src/modules/auth/doc/MANUAL_TESTING.md`
- **开发报告：** `src/modules/auth/doc/DEVELOPMENT_REPORT.md`

## ✅ 功能状态

- ✅ 用户注册功能已实现
- ✅ 输入验证已配置
- ✅ 测试用例已完成 (32个)
- ✅ 文档已完善 (5份)

## ⚠️ 注意事项
---

**开发完成日期：** 2026-01-23  
**模块状态：** ✅ 完整实现（需安装JWT依赖）才可用于生产环境

---

**开发完成日期：** 2026-01-23  
**模块状态：** ✅ 可用（开发/测试环境）
