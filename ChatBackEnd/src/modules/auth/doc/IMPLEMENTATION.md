# 认证模块实现文档

## 概述

本文档描述认证模块的用户注册功能实现，包括代码结构、技术方案和使用说明。

## 功能实现

### ✅ 已实现功能

- **用户注册** (`POST /auth/register`)
  - 基于昵称的快速注册
  - UUID用户ID生成
  - 简化版Token生成
  - 昵称唯一性验证
  - 完整的DTO验证

### 🚧 待实现功能

- JWT Token生成（目前使用简化版base64 token）
- 数据库持久化（目前使用内存存储）
- 获取用户信息接口
- Token验证中间件

## 代码结构

```
src/modules/auth/
├── auth.module.ts              # 模块定义
├── auth.controller.ts          # 控制器（处理HTTP请求）
├── auth.service.ts             # 服务（业务逻辑）
├── dto/
│   ├── register.dto.ts         # 注册请求DTO
│   └── register-response.dto.ts # 注册响应DTO
├── entities/
│   └── user.entity.ts          # 用户实体
└── doc/
    ├── IMPLEMENTATION.md       # 本文档
    ├── TESTING.md              # 测试说明
    └── MANUAL_TESTING.md       # 手动测试清单
```

## 核心实现

### 1. 用户实体 (User Entity)

**文件：** `entities/user.entity.ts`

```typescript
export class User {
  id: string;           // UUID
  nickname: string;     // 用户昵称
  createdAt: Date;      // 创建时间
  updatedAt: Date;      // 更新时间
}
```

### 2. 注册DTO (Register DTO)

**文件：** `dto/register.dto.ts`

使用 `class-validator` 进行验证：

```typescript
export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  @Length(2, 20, { message: '昵称长度必须在2-20个字符之间' })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, {
    message: '昵称只能包含中文、英文、数字和下划线',
  })
  nickname: string;
}
```

**验证规则：**
- ✅ 非空
- ✅ 长度 2-20 个字符
- ✅ 仅允许中文、英文、数字、下划线
- ✅ 自动错误消息提示

### 3. 认证服务 (Auth Service)

**文件：** `auth.service.ts`

#### 核心方法

**register(registerDto: RegisterDto): RegisterResponseDto**

注册流程：
1. 检查昵称是否已存在
2. 生成UUID作为用户ID
3. 创建用户实体
4. 保存到内存存储（临时方案）
5. 生成token
6. 返回响应数据

**异常处理：**
- `ConflictException(409)` - 昵称已存在
- `InternalServerErrorException(500)` - 服务器错误

**辅助方法：**
- `findById(userId: string)` - 根据ID查找用户
- `findByNickname(nickname: string)` - 根据昵称查找用户

### 4. 认证控制器 (Auth Controller)

**文件：** `auth.controller.ts`

```typescript
@Controller('auth')
export class AuthController {
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: RegisterDto) {
    // 返回统一响应格式
  }
}
```

**统一响应格式：**
```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "...",
    "user": { ... }
  }
}
```

## API 接口

### POST /auth/register

#### 请求示例

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "小明"
  }'
```

#### 成功响应 (201)

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "ZTM4YjQ2...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nickname": "小明",
      "createdAt": "2026-01-23T10:30:00.000Z"
    }
  }
}
```

#### 错误响应

**昵称格式错误 (400)**
```json
{
  "statusCode": 400,
  "message": [
    "昵称长度必须在2-20个字符之间",
    "昵称只能包含中文、英文、数字和下划线"
  ],
  "error": "Bad Request"
}
```

**昵称已存在 (409)**
```json
{
  "statusCode": 409,
  "message": "昵称已被使用",
  "error": "Conflict"
}
```

## 技术选型

### 核心技术
- **NestJS** - 后端框架
- **class-validator** - DTO验证
- **class-transformer** - 数据转换
- **Node.js crypto** - UUID生成

### 已配置功能
- ✅ 全局ValidationPipe（自动DTO验证）
- ✅ 全局异常过滤器
- ✅ CORS跨域支持
- ✅ Swagger API文档

## 数据存储

### 当前方案：内存存储

```typescript
private users: Map<string, User> = new Map();
private nicknameIndex: Map<string, string> = new Map();
```

**优点：**
- 快速开发和测试
- 无需数据库配置

**缺点：**
- 服务重启数据丢失
- 不支持分布式部署
- 无法扩展

### 推荐方案：数据库持久化

**技术选型：**
- PostgreSQL + TypeORM
- MySQL + TypeORM
- MongoDB + Mongoose

**迁移步骤：**
1. 安装依赖：`npm install @nestjs/typeorm typeorm pg`
2. 配置数据库连接
3. 将实体转换为TypeORM实体
4. 更新Service使用Repository
5. 运行数据库迁移

## Token实现

### 当前方案：简化版Base64 Token

```typescript
private generateToken(userId: string, nickname: string): string {
  const payload = `${userId}:${nickname}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}
```

**仅用于演示目的，不安全！**

### 推荐方案：JWT Token

**依赖安装：**
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

**JWT配置：**
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '24h' },
})
```

**Payload结构：**
```typescript
{
  sub: userId,      // 主题（用户ID）
  nickname: string, // 用户昵称
  iat: number,      // 签发时间
  exp: number       // 过期时间
}
```

## 测试

### 测试覆盖

| 类型 | 文件 | 测试用例数 |
|------|------|-----------|
| 单元测试 | auth.controller.spec.ts | 6 |
| 单元测试 | auth.service.spec.ts | 14 |
| E2E测试 | auth.e2e-spec.ts | 12 |
| **总计** | | **32** |

### 运行测试

```bash
# 运行所有认证测试
npm test -- --testPathPattern=auth

# 运行E2E测试
npm run test:e2e -- --testPathPattern=auth

# 查看覆盖率
npm run test:cov -- --testPathPattern=auth
```

详细测试说明请参考：[TESTING.md](./TESTING.md)

## 使用示例

### 在其他模块中使用

```typescript
import { AuthModule } from './modules/auth/auth.module';
import { AuthService } from './modules/auth/auth.service';

@Module({
  imports: [AuthModule],
})
export class AppModule {}

// 在其他服务中注入
@Injectable()
export class ChatService {
  constructor(private authService: AuthService) {}
  
  async getUserInfo(userId: string) {
    return this.authService.findById(userId);
  }
}
```

### 环境变量

创建 `.env` 文件：

```env
# 服务端口
PORT=3000

# JWT密钥（后续需要）
JWT_SECRET=your-secret-key-here

# CORS配置
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 后续优化计划

### 短期（优先级：高）

- [ ] 集成真实JWT token生成
- [ ] 连接数据库（PostgreSQL + TypeORM）
- [ ] 实现获取用户信息接口
- [ ] 实现JWT验证Guard

### 中期（优先级：中）

- [ ] Token刷新机制
- [ ] 添加API限流（防止恶意注册）
- [ ] 添加日志记录
- [ ] 性能优化（缓存、索引）

### 长期（优先级：低）

- [ ] 支持密码登录
- [ ] 支持第三方登录
- [ ] 多设备登录管理
- [ ] Token黑名单机制
- [ ] 用户登出功能

## 常见问题

### Q1: 为什么使用内存存储？
A: 这是快速原型开发的临时方案，便于演示和测试。生产环境必须使用数据库。

### Q2: 为什么Token不是JWT？
A: 简化版实现便于理解流程，后续会升级为标准JWT。

### Q3: 如何防止昵称重复注册攻击？
A: 建议添加：
- 请求频率限制（Rate Limiting）
- IP黑名单
- 验证码验证

### Q4: 如何扩展支持邮箱注册？
A: 
1. 在RegisterDto中添加email字段
2. 添加邮箱格式验证
3. 发送验证邮件
4. 添加邮箱验证状态

## 参考资料

- [NestJS官方文档](https://docs.nestjs.com/)
- [class-validator文档](https://github.com/typestack/class-validator)
- [JWT最佳实践](https://datatracker.ietf.org/doc/html/rfc8725)
- [项目需求文档](../../Documents/auth/register.md)

## 贡献者

- 初始实现：ChatBackend AI开发流程助手
- 日期：2026-01-23

---

**最后更新：** 2026-01-23  
**状态：** 已实现基础功能，待升级JWT和数据库
