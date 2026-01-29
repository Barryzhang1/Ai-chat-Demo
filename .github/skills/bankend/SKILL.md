---
name: backend-code-specifications
description: This document must be referenced when generating or modifying code in the chatBackEnd project to ensure uniform rules during code generation.
---

# NestJS Backend Code Standards

## 1. Reference Resources

- NestJS Official Documentation: Provides a comprehensive guide on architecture, modules, dependency injection, middleware, Guards, Interceptors, etc. It is the authoritative reference. Link: https://docs.nestjs.com
- NestJS Official Repository: Contains numerous sample projects (sample/) and integration tests, demonstrating best practices. Link: https://github.com/nestjs/nest
- TypeScript ESLint: The recommended TypeScript code linting tool for NestJS, ensuring type safety and code quality. Link: https://typescript-eslint.io
- Angular Style Guide: The NestJS architecture is heavily inspired by Angular, and many design patterns and organizational methods are consistent with Angular. Link: https://angular.dev/style-guide

## 2. Project Architecture and Module Organization

### 2.1 Modular Design Principles

- Divide modules by functional areas (Feature Modules), with each module responsible for a single business domain, such as `UsersModule`, `AuthModule`, `PostsModule`.
- Use the `@Module()` decorator to explicitly declare the module's `imports`, `providers`, `controllers`, and `exports`.
- Avoid circular dependencies; use `forwardRef()` to resolve circular references between modules when necessary.
- Follow the dependency direction: Core Modules ← Shared Modules ← Feature Modules.

```typescript
// Example: Feature module structure
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export for use by other modules
})
export class UsersModule {}
```

### 2.2 Directory Structure Best Practices

```Markdown

ChatBackEnd/
  Documents/           # 需求文档目录
    {module}.md        # 模块需求
    {module}/          # 模块详细需求
  src/
    modules/
      {module}/
        {module}.controller.ts  # 控制器
        {module}.service.ts     # 服务
        {module}.module.ts      # 模块定义
        dto/                    # 数据传输对象
        entities/               # 数据实体
        doc/                    # 实现文档
  test/                # 测试目录

```

## 3. Dependency Injection and Providers

### 3.1 Dependency Injection Best Practices

- Prefer constructor injection; avoid property injection (unless for special reasons like circular dependencies).
- Use TypeScript type declarations for dependencies, no need for manual `@Inject()` (except when using tokens).
- Providers are singletons by default; explicitly declare `scope: Scope.REQUEST` for request-scoped providers.

```typescript
// Recommended: Constructor injection
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
}

// Example of request scope
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(@Inject("REQUEST") private readonly request: Request) {}
}
```

### 3.2 Custom Provider Patterns

```typescript
// Value provider
{
  provide: 'APP_CONFIG',
  useValue: { apiUrl: 'https://api.example.com' },
}

// Factory provider
{
  provide: 'DATABASE_CONNECTION',
  useFactory: async (config: ConfigService) => {
    return await createConnection(config.get('database'));
  },
  inject: [ConfigService],
}

// Class provider (with alias)
{
  provide: 'LOGGER',
  useClass: CustomLogger,
}
```

## 4. Controller Conventions

### 4.1 Routing and HTTP Methods

- Use RESTful style routing, with resource names in plural form (`/users`, `/posts`).
- The controller decorator specifies the base path, and method decorators specify the specific route.
- HTTP method decorators: `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`.
- Use `:id` as a parameter placeholder, received via `@Param('id')`.

```typescript
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<User> {
    return this.usersService.findOne(+id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string): Promise<void> {
    return this.usersService.remove(+id);
  }
}
```

### 4.2 Parameter Decorator Usage

- `@Body()` - Request body
- `@Query()` - Query parameters
- `@Param()` - Route parameters
- `@Headers()` - Request headers
- `@Req()` / `@Request()` - Full request object (avoid overuse)

## 5. Service Layer and Business Logic

### 5.1 Service Design Principles

- Service classes are marked with the `@Injectable()` decorator.
- Business logic is implemented entirely in the service layer; controllers are only responsible for request/response handling.
- Service methods should have a single responsibility; avoid overly complex long methods.
- Use meaningful method names: `findAll()`, `findOne()`, `create()`, `update()`, `remove()`.

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
    await this.findOne(id); // Verify existence
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

## 6. Data Transfer Objects (DTOs) and Validation

### 6.1 DTO Definition Standards

- Use `class-validator` for request data validation.
- Define separate DTOs for create and update operations: `CreateXxxDto`, `UpdateXxxDto`.
- Use the `PartialType()` helper function to generate an update DTO from a create DTO.
- DTO class names follow PascalCase and end with the `Dto` suffix.

```typescript
import {
  IsString,
  IsInt,
  IsEmail,
  IsNotEmpty,
  Min,
  Max,
} from "class-validator";

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

// Use PartialType to create an update DTO
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### 6.2 Global Validation Pipe

```typescript
// main.ts
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically remove non-whitelisted properties
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are found
      transform: true, // Automatically transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

## 7. Error Handling and Exception Filters

### 7.1 Using Built-in Exception Classes

- Prefer using NestJS built-in exception classes: `BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`, `InternalServerErrorException`.
- Exception messages should be clear and specific for frontend display and debugging.
- Avoid leaking sensitive information (like database error details) to the client.

```typescript
// Correct exception throwing
if (!user) {
  throw new NotFoundException(`User with ID ${id} not found`);
}

if (user.email !== requestEmail) {
  throw new ForbiddenException("You are not allowed to access this resource");
}
```

### 7.2 Custom Exception Filters

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from "@nestjs/common";

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
      message: exceptionResponse["message"] || exception.message,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
    );

    response.status(status).json(errorResponse);
  }
}

// Register globally
app.useGlobalFilters(new HttpExceptionFilter());
```

## 8. Guards and Authorization

### 8.1 Authentication Guard

- Guards are used to implement authorization logic, returning a `boolean` or `Promise<boolean>`.
- Use the `@UseGuards()` decorator to apply guards at the controller or method level.
- Guard execution order: Global Guards → Controller Guards → Route Guards.

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  private validateRequest(request: any): boolean {
    // Validate JWT token or session
    const token = request.headers.authorization;
    return !!token;
  }
}

// Using the guard
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {}
```

### 8.2 Role Guard (RBAC)

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

// Usage example
@Get('admin')
@Roles('admin')
findAllAdmin() {
  return this.usersService.findAll();
}
```

## 9. Interceptors and Transformation

### 9.1 Response Transformation Interceptor

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        statusCode: context.switchToHttp().getResponse().statusCode,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 9.2 Logging Interceptor

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

## 10. Configuration Management

### 10.1 Using ConfigModule

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Globally available
      envFilePath: [".env.local", ".env"], // Environment file priority
      ignoreEnvFile: process.env.NODE_ENV === "production", // Ignore .env in production
    }),
  ],
})
export class AppModule {}
```

### 10.2 Type-Safe Configuration

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
}));

// Using the configuration
constructor(
  @Inject(databaseConfig.KEY)
  private readonly dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

## 11. Database Integration (TypeORM/Prisma)

### 11.1 TypeORM Entity Definition

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
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

### 11.2 Database Module Configuration

```typescript
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DATABASE_HOST"),
        port: config.get("DATABASE_PORT"),
        username: config.get("DATABASE_USER"),
        password: config.get("DATABASE_PASSWORD"),
        database: config.get("DATABASE_NAME"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: config.get("NODE_ENV") !== "production", // Disable in production
        logging: config.get("NODE_ENV") === "development",
      }),
    }),
  ],
})
export class DatabaseModule {}
```

## 12. Testing Strategy

### 12.1 Unit Testing

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";

describe("UsersService", () => {
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

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return all users", async () => {
    const users = [{ id: 1, name: "Test" }];
    mockRepository.find.mockResolvedValue(users);

    const result = await service.findAll();
    expect(result).toEqual(users);
    expect(mockRepository.find).toHaveBeenCalledTimes(1);
  });
});
```

### 12.2 E2E Testing

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";

describe("UsersController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/users (GET)", () => {
    return request(app.getHttpServer())
      .get("/users")
      .expect(200)
      .expect("Content-Type", /json/);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 13. TypeScript and ESLint Configuration

### 13.1 Recommended ESLint Configuration

```javascript
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js"],
  rules: {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};
```

### 13.2 tsconfig.json Configuration

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

## 14. Documentation and Swagger Integration

### 14.1 Swagger Configuration

```typescript
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("API Documentation")
    .setDescription("The API description")
    .setVersion("1.0")
    .addTag("users")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(3000);
}
```

### 14.2 DTO Documentation Annotations

```typescript
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ description: "User name", example: "John Doe" })
  @IsString()
  name: string;

  @ApiProperty({ description: "User email", example: "john@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "User age", minimum: 18, maximum: 120 })
  @IsInt()
  age: number;
}
```

## 15. Performance Optimization and Best Practices

### 15.1 Avoiding the N+1 Query Problem

```typescript
// Not recommended: N+1 query
const users = await this.userRepository.find();
for (const user of users) {
  user.posts = await this.postRepository.find({ where: { userId: user.id } });
}

// Recommended: Use relation loading
const users = await this.userRepository.find({ relations: ["posts"] });
```

### 15.2 Using Caching (Cache Module)

```typescript
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register({
      ttl: 5, // seconds
      max: 100, // maximum number of items in cache
    }),
  ],
})
export class AppModule {}

// Using the cache
@Injectable()
export class UsersService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async findAll(): Promise<User[]> {
    const cacheKey = "all_users";
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

### 15.3 Asynchronous Task Queues (BullMQ)

```typescript
import { BullModule } from "@nestjs/bull";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "email",
    }),
  ],
  providers: [EmailProcessor],
})
export class EmailModule {}

// Producer
@Injectable()
export class NotificationService {
  constructor(@InjectQueue("email") private emailQueue: Queue) {}

  async sendWelcomeEmail(email: string) {
    await this.emailQueue.add("welcome", { email });
  }
}

// Consumer
@Processor("email")
export class EmailProcessor {
  @Process("welcome")
  async handleWelcome(job: Job) {
    const { email } = job.data;
    // Logic to send email
  }
}
```

## 16. Security Best Practices

### 16.1 CORS Configuration

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
```

### 16.2 Helmet for Security Headers

```typescript
import helmet from "helmet";

app.use(helmet());
```

### 16.3 Rate Limiting (Throttler)

```typescript
import { ThrottlerModule } from "@nestjs/throttler";

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

## 17. Log Management

### 17.1 Custom Logger

```typescript
import { Logger } from "@nestjs/common";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async findAll(): Promise<User[]> {
    this.logger.log("Fetching all users");
    try {
      const users = await this.userRepository.find();
      this.logger.debug(`Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error("Failed to fetch users", error.stack);
      throw error;
    }
  }
}
```

### 17.2 Log Levels

- `log` - General information
- `error` - Error information
- `warn` - Warning information
- `debug` - Debugging information (development environment)
- `verbose` - Detailed information

## 18. Microservices Architecture

### 18.1 Microservice Configuration

```typescript
import { Transport, MicroserviceOptions } from "@nestjs/microservices";

const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.TCP,
    options: {
      host: "localhost",
      port: 3001,
    },
  },
);
```

### 18.2 Message Patterns

```typescript
// Request-response pattern
@MessagePattern({ cmd: 'get_user' })
async getUser(data: { id: number }) {
  return this.usersService.findOne(data.id);
}

// Event-based pattern
@EventPattern('user_created')
async handleUserCreated(data: { email: string }) {
  // Handle user created event
}
```

## 19. Adoption Recommendations

- Use the NestJS CLI (`nest new project-name`) to start a project to ensure a standard directory structure.
- Use the `nest generate` command to generate modules, controllers, services, etc., to maintain naming consistency.
- Enforce Code Reviews to check for compliance with these standards.
- Integrate ESLint, Prettier, and unit tests into the CI/CD pipeline to ensure code quality.
- Regularly update NestJS and its dependencies, and monitor for security vulnerabilities.
- Provide this standards document to new team members during onboarding and assign a mentor for practical guidance.


This guide is based on the NestJS official documentation, GitHub repository examples, and community best practices. It aims to provide a unified code style and architectural guide for the team to ensure project maintainability, scalability, and code quality.
