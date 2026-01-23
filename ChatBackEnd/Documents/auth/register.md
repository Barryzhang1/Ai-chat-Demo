# 用户注册功能需求

## 功能描述

用户通过提供昵称即可快速完成注册，系统自动生成唯一用户ID并返回JWT token，用于后续的身份验证。

## API 规范

### 请求

**端点**：`POST /auth/register`

**Content-Type**：`application/json`

**请求体**：
```json
{
  "nickname": "小明"
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| nickname | string | ✅ | 用户昵称 | 2-20个字符，仅支持中文、英文、数字、下划线 |

### 响应

#### 成功响应 (201 Created)

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

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 响应码，0表示成功 |
| message | string | 响应消息 |
| data.token | string | JWT token，用于后续请求认证 |
| data.user.id | string | 用户唯一标识 (UUID) |
| data.user.nickname | string | 用户昵称 |
| data.user.createdAt | string | 用户创建时间 (ISO 8601) |

#### 失败响应

**昵称格式错误 (400 Bad Request)**：
```json
{
  "code": 400,
  "message": "昵称格式不正确",
  "errors": [
    "昵称长度必须在2-20个字符之间",
    "昵称只能包含中文、英文、数字和下划线"
  ]
}
```

**昵称已存在 (409 Conflict)**：
```json
{
  "code": 409,
  "message": "昵称已被使用"
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

1. **接收请求**：接收用户提交的昵称
2. **参数验证**：
   - 验证昵称是否为空
   - 验证昵称长度（2-20个字符）
   - 验证昵称格式（正则表达式：`/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/`）
3. **唯一性检查**：检查昵称是否已被使用（可选，根据业务需求）
4. **创建用户**：
   - 生成UUID作为用户ID
   - 保存用户信息到数据库
   - 记录创建时间
5. **生成Token**：
   - 使用JWT生成token
   - Payload包含：`{ userId, nickname }`
   - 设置过期时间：24小时
6. **返回响应**：返回token和用户基本信息

### 验证规则

```typescript
// DTO 验证示例
class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  @Length(2, 20, { message: '昵称长度必须在2-20个字符之间' })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, {
    message: '昵称只能包含中文、英文、数字和下划线'
  })
  nickname: string;
}
```

## 数据存储

### 数据库：MongoDB

**集合名称：** `users`

### 文档结构

```typescript
{
  _id: ObjectId,                    // MongoDB自动生成的ID
  id: string,                       // UUID v4，用户唯一标识
  nickname: string,                 // 用户昵称
  createdAt: Date,                  // 创建时间
  updatedAt: Date,                  // 更新时间
}
```

### 字段说明

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| _id | ObjectId | PRIMARY KEY | MongoDB自动生成的文档ID |
| id | String | REQUIRED, UNIQUE | 用户ID (UUID v4) |
| nickname | String | REQUIRED, UNIQUE | 用户昵称，2-20个字符 |
| createdAt | Date | REQUIRED | 创建时间，自动生成 |
| updatedAt | Date | REQUIRED | 更新时间，自动更新 |

### 索引

```javascript
// 唯一索引
db.users.createIndex({ "id": 1 }, { unique: true })
db.users.createIndex({ "nickname": 1 }, { unique: true })

// 查询索引
db.users.createIndex({ "createdAt": -1 })
```

### Schema定义 (Mongoose)

```typescript
import { Schema } from 'mongoose';

export const UserSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nickname: {
      type: String,
      required: true,
      unique: true,
      minlength: 2,
      maxlength: 20,
      index: true,
    },
  },
  {
    timestamps: true, // 自动添加createdAt和updatedAt
    collection: 'users',
  }
);
```

## 测试用例

### 正常场景

| 场景 | 输入 | 期望输出 |
|------|------|----------|
| 正常注册 - 中文昵称 | `{ "nickname": "小明" }` | 201, 返回token和用户信息 |
| 正常注册 - 英文昵称 | `{ "nickname": "Tom" }` | 201, 返回token和用户信息 |
| 正常注册 - 混合昵称 | `{ "nickname": "小明Tom123" }` | 201, 返回token和用户信息 |
| 正常注册 - 带下划线 | `{ "nickname": "user_123" }` | 201, 返回token和用户信息 |

### 异常场景

| 场景 | 输入 | 期望输出 |
|------|------|----------|
| 昵称为空 | `{ "nickname": "" }` | 400, 昵称不能为空 |
| 昵称过短 | `{ "nickname": "a" }` | 400, 昵称长度错误 |
| 昵称过长 | `{ "nickname": "这是一个超过二十个字符的非常长的昵称" }` | 400, 昵称长度错误 |
| 昵称包含特殊字符 | `{ "nickname": "小明@123" }` | 400, 昵称格式不正确 |
| 昵称包含空格 | `{ "nickname": "小 明" }` | 400, 昵称格式不正确 |
| 昵称包含emoji | `{ "nickname": "小明😊" }` | 400, 昵称格式不正确 |
| 昵称已存在 | `{ "nickname": "已存在用户" }` | 409, 昵称已被使用 |
| 缺少nickname字段 | `{}` | 400, 昵称不能为空 |

## 非功能需求

### 性能要求
- 响应时间：< 500ms (P95)
- 并发支持：100 QPS

### 安全要求
- Token使用强加密算法（HS256或RS256）
- 防止昵称重复注册攻击（如需要，添加频率限制）
- 输入过滤，防止XSS和SQL注入

### 可用性要求
- 服务可用性：99.9%
- 数据库连接失败时返回友好错误信息

## 实现建议

1. 使用 NestJS 的 `class-validator` 进行DTO验证
2. 使用 `@nestjs/jwt` 生成和验证token
3. 使用 `@nestjs/mongoose` 和 `mongoose` 进行MongoDB数据库操作
4. 使用 UUID v4 生成用户ID
5. Token密钥通过环境变量配置（`JWT_SECRET`）
6. MongoDB连接字符串通过环境变量配置（`MONGODB_URI`）
7. 统一使用全局异常过滤器处理错误响应

## 技术栈

### 数据库
- **MongoDB** - NoSQL数据库
- **Mongoose** - MongoDB ODM (对象文档映射)
- **@nestjs/mongoose** - NestJS的MongoDB集成模块

### 依赖安装

```bash
npm install @nestjs/mongoose mongoose
```

### 环境变量配置

```env
# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/chat-demo
# 或使用MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-demo

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### MongoDB连接配置

```typescript
// app.module.ts
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    // 其他模块...
  ],
})
export class AppModule {}
```
