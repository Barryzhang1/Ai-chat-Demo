---
name: backend-code-specifications
description: 这个skill用于后端项目chatBackEnd生成代码时进行参考，保证在代码生成时有统一规则，在生成或优化chatBackEnd代码时使用，基于NestJS企业级开发最佳实践
---

# NestJS 后端代码规范

## 1. 参考资源

- NestJS 官方文档：提供架构、模块、依赖注入、中间件、Guards、Interceptors 等全面指南，是权威参考。链接：https://docs.nestjs.com
- NestJS 官方仓库：包含大量示例项目（sample/）和集成测试，展示最佳实践。链接：https://github.com/nestjs/nest
- TypeScript ESLint：NestJS 推荐的 TypeScript 代码检查工具，提供类型安全和代码质量保障。链接：https://typescript-eslint.io
- Angular 编码规范：NestJS 架构深受 Angular 启发，许多设计模式和组织方式与 Angular 一致。链接：https://angular.dev/style-guide

## 2. 项目架构与模块组织

### 2.1 模块化设计原则
- 按功能领域划分模块（Feature Modules），每个模块负责单一业务域，如 `UsersModule`、`AuthModule`、`PostsModule`
- 使用 `@Module()` 装饰器明确声明模块的 `imports`、`providers`、`controllers`、`exports`
- 避免循环依赖，必要时使用 `forwardRef()` 解决模块间循环引用
- 遵循依赖方向：核心模块（Core）← 共享模块（Shared）← 功能模块（Features）

```typescript
// 示例：功能模块结构
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // 导出供其他模块使用
})
export class UsersModule {}
```

### 2.2 目录结构最佳实践
```
src/
├── main.ts                 # 应用入口
├── app.module.ts           # 根模块
├── common/                 # 共享资源
│   ├── decorators/        # 自定义装饰器
│   ├── filters/           # 异常过滤器
│   ├── guards/            # 守卫
│   ├── interceptors/      # 拦截器
│   ├── pipes/             # 管道
│   └── interfaces/        # 通用接口
├── config/                 # 配置模块
│   ├── database.config.ts
│   └── app.config.ts
├── modules/                # 功能模块
│   ├── users/
│   │   ├── dto/           # 数据传输对象
│   │   ├── entities/      # 数据库实体
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── auth/
└── core/                   # 核心模块（单例服务）
    ├── database/
    └── logger/
```

## 3. 依赖注入与提供者（Providers）

### 3.1 依赖注入最佳实践
- 优先使用构造函数注入，避免属性注入（除非有特殊原因如循环依赖）
- 使用 TypeScript 类型声明依赖，无需手动 `@Inject()`（使用 Token 时除外）
- 提供者默认为单例（Singleton），需要请求作用域时显式声明 `scope: Scope.REQUEST`

```typescript
// 推荐：构造函数注入
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
}

// 请求作用域示例
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(@Inject('REQUEST') private readonly request: Request) {}
}
```

### 3.2 自定义提供者模式
```typescript
// 值提供者
{
  provide: 'APP_CONFIG',
  useValue: { apiUrl: 'https://api.example.com' },
}

// 工厂提供者
{
  provide: 'DATABASE_CONNECTION',
  useFactory: async (config: ConfigService) => {
    return await createConnection(config.get('database'));
  },
  inject: [ConfigService],
}

// 类提供者（带别名）
{
  provide: 'LOGGER',
  useClass: CustomLogger,
}
```

## 4. 控制器（Controllers）约定

### 4.1 路由与HTTP方法
- 使用 RESTful 风格路由，资源名用复数形式（`/users`、`/posts`）
- 控制器装饰器指定基础路径，方法装饰器指定具体路由
- HTTP方法装饰器：`@Get()`、`@Post()`、`@Put()`、`@Patch()`、`@Delete()`
- 使用 `:id` 参数占位符，通过 `@Param('id')` 接收

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(+id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(+id);
  }
}
```

### 4.2 参数装饰器使用
- `@Body()` - 请求体
- `@Query()` - 查询参数
- `@Param()` - 路由参数
- `@Headers()` - 请求头
- `@Req()` / `@Request()` - 完整请求对象（避免过度使用）

## 5. 服务层（Services）与业务逻辑

### 5.1 服务设计原则
- 服务类使用 `@Injectable()` 装饰器标记
- 业务逻辑完全在服务层实现，控制器仅负责请求/响应处理
- 服务方法应单一职责，避免过度复杂的长方法
- 使用有意义的方法名：`findAll()`、`findOne()`、`create()`、`update()`、`remove()`

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id); // 验证存在性
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User #${id} not found`);
    }
  }
}
```

## 6. 数据传输对象（DTO）与验证

### 6.1 DTO 定义规范
- 使用 `class-validator` 进行请求数据验证
- 为创建、更新操作分别定义 DTO：`CreateXxxDto`、`UpdateXxxDto`
- 使用 `PartialType()` 辅助函数从创建 DTO 生成更新 DTO
- DTO 类命名遵循 PascalCase，以 `Dto` 后缀结尾

```typescript
import { IsString, IsInt, IsEmail, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(18)
  @Max(120)
  age: number;
}

// 使用 PartialType 创建更新 DTO
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### 6.2 全局验证管道
```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // 自动移除非白名单属性
      forbidNonWhitelisted: true, // 发现非白名单属性时抛出错误
      transform: true,          // 自动类型转换
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  await app.listen(3000);
}
bootstrap();
```

## 7. 错误处理与异常过滤器

### 7.1 内置异常类使用
- 优先使用 NestJS 内置异常类：`BadRequestException`、`NotFoundException`、`UnauthorizedException`、`ForbiddenException`、`InternalServerErrorException`
- 异常消息应明确具体，便于前端展示和调试
- 避免泄露敏感信息（如数据库错误详情）给客户端

```typescript
// 正确的异常抛出
if (!user) {
  throw new NotFoundException(`User with ID ${id} not found`);
}

if (user.email !== requestEmail) {
  throw new ForbiddenException('You are not allowed to access this resource');
}
```

### 7.2 自定义异常过滤器
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exceptionResponse['message'] || exception.message,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
    );

    response.status(status).json(errorResponse);
  }
}

// 全局注册
app.useGlobalFilters(new HttpExceptionFilter());
```

## 8. 守卫（Guards）与授权

### 8.1 认证守卫
- 守卫用于执行授权逻辑，返回 `boolean` 或 `Promise<boolean>`
- 使用 `@UseGuards()` 装饰器应用守卫，可在控制器级别或方法级别
- 守卫执行顺序：全局守卫 → 控制器守卫 → 路由守卫

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  private validateRequest(request: any): boolean {
    // 验证 JWT token 或 session
    const token = request.headers.authorization;
    return !!token;
  }
}

// 使用守卫
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {}
```

### 8.2 角色守卫（RBAC）
```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 使用示例
@Get('admin')
@Roles('admin')
findAllAdmin() {
  return this.usersService.findAll();
}
```

## 9. 拦截器（Interceptors）与转换

### 9.1 响应转换拦截器
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        data,
        statusCode: context.switchToHttp().getResponse().statusCode,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 9.2 日志拦截器
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`${method} ${url} - ${responseTime}ms`);
      }),
    );
  }
}
```

## 10. 配置管理

### 10.1 使用 ConfigModule
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,           // 全局可用
      envFilePath: ['.env.local', '.env'], // 环境文件优先级
      ignoreEnvFile: process.env.NODE_ENV === 'production', // 生产环境忽略 .env
    }),
  ],
})
export class AppModule {}
```

### 10.2 类型安全的配置
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
}));

// 使用配置
constructor(
  @Inject(databaseConfig.KEY)
  private readonly dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

## 11. 数据库集成（TypeORM/Prisma）

### 11.1 TypeORM 实体定义
```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 11.2 数据库模块配置
```typescript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: config.get('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production', // 生产环境禁用
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
```

## 12. 测试策略

### 12.1 单元测试
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all users', async () => {
    const users = [{ id: 1, name: 'Test' }];
    mockRepository.find.mockResolvedValue(users);

    const result = await service.findAll();
    expect(result).toEqual(users);
    expect(mockRepository.find).toHaveBeenCalledTimes(1);
  });
});
```

### 12.2 E2E 测试
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect('Content-Type', /json/);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 13. TypeScript 与 ESLint 配置

### 13.1 推荐的 ESLint 配置
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

### 13.2 tsconfig.json 配置
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## 14. 文档与 Swagger 集成

### 14.1 Swagger 配置
```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addTag('users')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
```

### 14.2 DTO 文档注解
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User age', minimum: 18, maximum: 120 })
  @IsInt()
  age: number;
}
```

## 15. 性能优化与最佳实践

### 15.1 避免 N+1 查询问题
```typescript
// 不推荐：N+1 查询
const users = await this.userRepository.find();
for (const user of users) {
  user.posts = await this.postRepository.find({ where: { userId: user.id } });
}

// 推荐：使用关系加载
const users = await this.userRepository.find({ relations: ['posts'] });
```

### 15.2 使用缓存（Cache Module）
```typescript
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 5, // 秒
      max: 100, // 最大缓存项数
    }),
  ],
})
export class AppModule {}

// 使用缓存
@Injectable()
export class UsersService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async findAll(): Promise<User[]> {
    const cacheKey = 'all_users';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const users = await this.userRepository.find();
    await this.cacheManager.set(cacheKey, users);
    return users;
  }
}
```

### 15.3 异步任务队列（BullMQ）
```typescript
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [EmailProcessor],
})
export class EmailModule {}

// 生产者
@Injectable()
export class NotificationService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendWelcomeEmail(email: string) {
    await this.emailQueue.add('welcome', { email });
  }
}

// 消费者
@Processor('email')
export class EmailProcessor {
  @Process('welcome')
  async handleWelcome(job: Job) {
    const { email } = job.data;
    // 发送邮件逻辑
  }
}
```

## 16. 安全最佳实践

### 16.1 CORS 配置
```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 16.2 Helmet 安全头
```typescript
import helmet from 'helmet';

app.use(helmet());
```

### 16.3 速率限制（Throttler）
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
export class AppModule {}
```

## 17. 日志管理

### 17.1 自定义 Logger
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    try {
      const users = await this.userRepository.find();
      this.logger.debug(`Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error('Failed to fetch users', error.stack);
      throw error;
    }
  }
}
```

### 17.2 日志级别
- `log` - 一般信息
- `error` - 错误信息
- `warn` - 警告信息
- `debug` - 调试信息（开发环境）
- `verbose` - 详细信息

## 18. 微服务架构

### 18.1 微服务配置
```typescript
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3001,
    },
  },
);
```

### 18.2 消息模式
```typescript
// 请求-响应模式
@MessagePattern({ cmd: 'get_user' })
async getUser(data: { id: number }) {
  return this.usersService.findOne(data.id);
}

// 事件模式
@EventPattern('user_created')
async handleUserCreated(data: { email: string }) {
  // 处理用户创建事件
}
```

## 19. 推行建议

- 项目启动时使用 NestJS CLI（`nest new project-name`）确保标准目录结构
- 使用 `nest generate` 命令生成模块、控制器、服务等，保持命名一致性
- 强制代码审查（Code Review），检查是否遵循本规范
- CI/CD 流程中集成 ESLint、Prettier 和单元测试，保证代码质量
- 定期更新 NestJS 和依赖包版本，关注安全漏洞
- 团队新成员入职时提供本规范文档，并分配导师进行实践指导

## 20. 常用命令参考

```bash
# 创建新项目
nest new project-name

# 生成资源（模块、控制器、服务）
nest generate resource users

# 生成模块
nest generate module users

# 生成控制器
nest generate controller users

# 生成服务
nest generate service users

# 生成守卫
nest generate guard auth

# 生成拦截器
nest generate interceptor logging

# 生成过滤器
nest generate filter http-exception

# 运行开发服务器
npm run start:dev

# 运行测试
npm run test

# 运行 E2E 测试
npm run test:e2e

# 运行代码检查
npm run lint

# 构建生产版本
npm run build

# 运行生产版本
npm run start:prod
```

---

本规范基于 NestJS 官方文档、GitHub 仓库示例和社区最佳实践整理，旨在为团队提供统一的代码风格和架构指南，确保项目的可维护性、可扩展性和代码质量。
