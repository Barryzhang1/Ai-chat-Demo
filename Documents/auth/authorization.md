# 授权验证功能需求

## 功能描述

对所有需要认证的接口进行统一的授权验证，未授权或token无效的请求统一返回401 Unauthorized状态码，确保系统安全性。

## 功能范围

### 需要授权验证的接口

所有标记为需要认证的API端点都必须通过授权验证：

- `GET /auth/me` - 获取当前用户信息
- 其他需要用户身份的业务接口（未来扩展）

### 无需授权的接口（白名单）

以下接口无需token即可访问：

- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录（如果实现）
- 健康检查接口
- 公开的API文档

## 授权验证规则

### 验证流程

1. **检查Authorization头**
   - 验证请求头是否包含 `Authorization` 字段
   - 如果缺失 → 返回401

2. **验证Token格式**
   - 检查格式是否为 `Bearer <token>`
   - 如果格式错误 → 返回401

3. **验证Token有效性**
   - 验证JWT签名是否正确
   - 检查Token是否过期
   - 如果无效或过期 → 返回401

4. **验证用户存在性**
   - 从Token解析出userId
   - 查询数据库验证用户是否存在
   - 如果用户不存在 → 返回401

5. **注入用户信息**
   - 将用户信息注入到请求对象中
   - 后续处理器可以通过 `req.user` 访问用户信息

### 验证失败场景

| 场景 | HTTP状态码 | 错误消息 |
|------|-----------|---------|
| 缺少Authorization头 | 401 | 未授权，请先登录 |
| Token格式错误 | 401 | Token格式不正确 |
| Token签名无效 | 401 | Token无效或已过期 |
| Token已过期 | 401 | Token无效或已过期 |
| 用户不存在 | 401 | 未授权，请先登录 |
| JWT密钥不匹配 | 401 | Token无效或已过期 |

## 响应规范

### 401 Unauthorized 响应格式

所有授权失败的请求统一返回以下格式：

```json
{
  "statusCode": 401,
  "message": "未授权，请先登录",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "path": "/auth/me"
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| statusCode | number | HTTP状态码，固定为401 |
| message | string | 错误描述信息 |
| timestamp | string | 错误发生时间 (ISO 8601) |
| path | string | 请求的路径 |

### 响应头

```
WWW-Authenticate: Bearer realm="Access to protected resources"
```

## 技术实现

### 实现方式

使用 NestJS 的 **Guard（守卫）** 机制实现全局或局部的授权验证。

#### 1. JWT认证守卫

```typescript
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('未授权，请先登录');
    }
    return user;
  }
}
```

#### 2. 应用守卫

**局部应用（推荐）**：
```typescript
@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}
```

**全局应用**：
```typescript
// main.ts
app.useGlobalGuards(new JwtAuthGuard());
```

#### 3. 公开路由装饰器（可选）

如果使用全局守卫，可以创建自定义装饰器标记公开路由：

```typescript
// public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// 使用示例
@Public()
@Post('register')
register() { ... }
```

### JWT Strategy 配置

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return user;
  }
}
```

## 异常处理

### 统一异常过滤器

创建全局异常过滤器统一处理401错误：

```typescript
// http-exception.filter.ts
@Catch(UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    response.status(401).json({
      statusCode: 401,
      message: exception.message || '未授权，请先登录',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

## 安全考虑

### 1. Token安全
- ✅ 使用强加密算法（HS256或RS256）
- ✅ Token密钥通过环境变量配置，不硬编码
- ✅ 设置合理的过期时间（推荐24小时）
- ✅ Token仅通过HTTPS传输

### 2. 防御措施
- 🛡️ 频率限制：防止暴力破解（每IP每分钟最多10次失败尝试）
- 🛡️ 日志记录：记录所有401错误用于安全审计
- 🛡️ 不暴露敏感信息：错误消息不应透露系统内部细节
- 🛡️ CORS配置：正确配置跨域策略

### 3. Token存储建议（客户端）
- 推荐：存储在内存或HttpOnly Cookie中
- 不推荐：localStorage（容易遭受XSS攻击）

## 测试用例

### 正常场景

| 场景 | 条件 | 期望结果 |
|------|------|---------|
| 有效token访问受保护接口 | 提供有效的Bearer token | 200, 正常返回数据 |

### 异常场景

| 测试用例 | 请求头 | 期望状态码 | 期望消息 |
|---------|-------|-----------|---------|
| 完全缺少Authorization头 | 无 | 401 | 未授权，请先登录 |
| Authorization为空字符串 | `Authorization: ""` | 401 | Token格式不正确 |
| 缺少Bearer前缀 | `Authorization: <token>` | 401 | Token格式不正确 |
| Bearer后无token | `Authorization: Bearer ` | 401 | Token格式不正确 |
| Token签名错误 | 篡改过的token | 401 | Token无效或已过期 |
| Token已过期 | 过期的token | 401 | Token无效或已过期 |
| Token格式错误（非JWT） | 随机字符串 | 401 | Token无效或已过期 |
| Token有效但用户已删除 | userId对应用户不存在 | 401 | 未授权，请先登录 |
| Token中缺少必要字段 | payload缺少userId | 401 | Token无效 |

### 压力测试

| 场景 | 说明 |
|------|------|
| 高并发请求 | 1000个并发请求，95%在200ms内响应 |
| Token验证性能 | 单次验证耗时 < 10ms |
| 频率限制测试 | 超过限制后返回429 Too Many Requests |

## 监控和日志

### 日志记录内容

**成功认证**：
```
[INFO] 2026-01-23 10:30:00 - User authenticated: userId=xxx, path=/auth/me
```

**认证失败**：
```
[WARN] 2026-01-23 10:30:00 - Authentication failed: reason=TokenExpired, ip=192.168.1.1, path=/auth/me
```

### 监控指标

- 401错误率
- Token验证耗时
- 每分钟认证失败次数
- IP级别的异常访问检测

## 非功能需求

### 性能要求
- Token验证响应时间：< 50ms
- 支持并发：1000+ QPS
- 数据库查询优化：用户查询使用主键索引

### 可用性要求
- 服务可用性：99.9%
- JWT验证失败不影响系统其他功能

### 可维护性
- 统一的错误处理逻辑
- 清晰的日志记录
- 配置化的JWT参数（密钥、过期时间）

## 实现优先级

1. ✅ **P0 - 必须实现**
   - JWT认证守卫
   - 统一401错误响应
   - Token验证逻辑

2. 🔄 **P1 - 建议实现**
   - 全局异常过滤器
   - 认证失败日志记录
   - 频率限制

3. 💡 **P2 - 可选实现**
   - Token刷新机制
   - Token黑名单（登出）
   - 监控和告警

## 参考资料

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
