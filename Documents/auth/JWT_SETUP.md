# JWT依赖安装说明

## 需要安装的依赖

运行以下命令安装JWT相关依赖：

```bash
cd ChatBackEnd
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

## 依赖说明

- `@nestjs/jwt` - NestJS的JWT模块
- `@nestjs/passport` - NestJS的Passport认证模块
- `passport` - Node.js认证中间件
- `passport-jwt` - Passport的JWT策略
- `@types/passport-jwt` - TypeScript类型定义

## 环境变量配置

在 `.env` 文件中添加：

```env
# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

⚠️ **重要**: 生产环境请使用强随机密钥！

## 安装后续操作

安装完成后，系统会自动使用JWT token替代简化版token。
