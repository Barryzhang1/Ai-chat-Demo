# 认证模块 (Auth Module)

用户认证和授权管理模块，提供基于昵称的快速注册功能。

## 📁 目录结构

```
src/modules/auth/
├── auth.module.ts                  # 模块定义
├── auth.controller.ts              # HTTP控制器
├── auth.controller.spec.ts         # 控制器测试
├── auth.service.ts                 # 业务逻辑服务
├── auth.service.spec.ts            # 服务测试
├── dto/
│   ├── register.dto.ts             # 注册请求DTO
│   └── register-response.dto.ts    # 注册响应DTO
├── entities/
│   └── user.entity.ts              # 用户实体
└── doc/
    ├── README.md                   # 本文档
    ├── IMPLEMENTATION.md           # 详细实现文档
    ├── TESTING.md                  # 测试说明
    └── MANUAL_TESTING.md           # 手动测试清单
```

## ✨ 功能特性

- ✅ 基于昵称的快速注册
- ✅ UUID用户ID自动生成
- ✅ **真实的JWT Token认证**
- ✅ 完整的输入验证（DTO）
- ✅ 昵称唯一性校验
- ✅ **JWT认证守卫保护**
- ✅ **获取用户信息接口**
- ✅ 统一错误处理
- ✅ 完整的单元测试和E2E测试

## 🚀 快速开始

### 1. 启动服务

```bash
cd ChatBackEnd
npm run start:dev
```

### 2. 测试注册接口

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"小明"}'
```

### 3. 查看API文档

访问：http://localhost:3000/api

## 📝 API 端点

### POST /auth/register

用户注册，返回JWT token

**请求体：**
```json
{
  "nickname": "小明"
}
```

**成功响应 (201)：**
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nickname": "小明",
      "createdAt": "2026-01-23T10:30:00.000Z"
    }
  }
}
```

### GET /auth/me

获取当前用户信息（需要认证）

**请求头：**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应 (200)：**
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

**错误响应：**
- `400 Bad Request` - 参数验证失败
- `409 Conflict` - 昵称已存在
- `500 Internal Server Error` - 服务器错误

## 🔍 验证规则

昵称必须满足以下条件：
- ✅ 非空
- ✅ 长度：2-20个字符
- ✅ 字符：仅支持中文、英文、数字、下划线
- ✅ 正则：`/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/`

**示例：**
- ✅ `小明`
- ✅ `Tom`
- ✅ `小明Tom123`
- ✅ `user_123`
- ❌ `小 明` (包含空格)
- ❌ `小明@123` (包含特殊字符)
- ❌ `a` (太短)
- ❌ `这是一个超过二十个字符的非常长的昵称` (太长)

## 🧪 测试

### 运行单元测试

```bash
npm test -- --testPathPattern=auth
```

### 运行E2E测试

```bash
npm run test:e2e -- --testPathPattern=auth
```

### 查看测试覆盖率

```bash
npm run test:cov -- --testPathPattern=auth
```

### 测试统计

- 单元测试：20个用例
## ⚠️ 当前限制

### 数据存储

**内存存储** - 数据保存在内存中
- ⚠️ 服务重启后数据丢失
- ⚠️ 不支持分布式部署
- 🔧 需要迁移到数据库（PostgreSQL/MySQL）

### JWT依赖

⚠️ **需要先安装依赖才能运行**

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

详见：[JWT_UPGRADE.md](./JWT_UPGRADE.md)

- [**TESTING.md**](./TESTING.md) - 测试文档
  - 测试用例列表
  - 测试运行方法
  - 覆盖率报告

- [**MANUAL_TESTING.md**](./MANUAL_TESTING.md) - 手动测试清单
  - cURL命令示例
  - Postman测试指南
  - 测试结果记录表

## ⚠️ 当前限制

### 临时实现方案

1. **内存存储** - 数据保存在内存中
   - ⚠️ 服务重启后数据丢失
   - ⚠️ 不支持分布式部署
   - 🔧 需要迁移到数据库（PostgreSQL/MySQL）

2. **简化Token** - 使用Base64编码
   - ⚠️ 不安全，仅用于演示
   - 🔧 需要升级为JWT

### 后续改进

- [ ] 集成JWT token生成
- [ ] 连接数据库（TypeORM）
- [ ] 实现Token验证Guard
- [ ] 实现获取用户信息接口
- [ ] 添加请求限流

## 🔧 在其他模块中使用

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
```

```typescript
import { Injectable } from '@nestjs/common';
import { AuthService } from './modules/auth/auth.service';

@Injectable()
export class YourService {
  constructor(private authService: AuthService) {}
  
  async getUser(userId: string) {
    return this.authService.findById(userId);
  }
}
```
## 📊 开发进度

| 功能 | 状态 | 备注 |
|-----|------|-----|
| 用户注册 | ✅ 完成 | 返回JWT token |
| JWT集成 | ✅ 完成 | 真实的JWT认证 |
| 授权验证 | ✅ 完成 | JwtAuthGuard |
| 获取用户信息 | ✅ 完成 | GET /auth/me |
| DTO验证 | ✅ 完成 | 使用class-validator |
| 单元测试 | ✅ 完成 | 覆盖所有功能 |
| E2E测试 | ✅ 完成 | 完整流程测试 |
| 数据库集成 | 🚧 待实现 | 当前使用内存存储 |
| Token刷新 | 📋 计划中 | - |
| 用户登出 | 📋 计划中 | - |
| DTO验证 | ✅ 完成 | 使用class-validator |
| 单元测试 | ✅ 完成 | 20个测试用例 |
| E2E测试 | ✅ 完成 | 12个测试用例 |
| JWT集成 | 🚧 待实现 | 当前使用简化token |
| 数据库集成 | 🚧 待实现 | 当前使用内存存储 |
| 获取用户信息 | 📋 计划中 | - |
| Token验证Guard | 📋 计划中 | - |

## 👥 贡献

本模块由ChatBackend AI开发流程助手按照开发流程规范实现。

---

**最后更新：** 2026-01-23  
**版本：** 1.0.0  
**状态：** ✅ 基础功能已完成
