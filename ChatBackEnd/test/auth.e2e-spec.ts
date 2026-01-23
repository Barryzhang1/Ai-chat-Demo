import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../src/modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        MongooseModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            uri:
              configService.get<string>('MONGODB_URI') ||
              'mongodb://localhost:27017/chat-demo-test',
          }),
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 启用验证管道
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    // 清理测试数据
    const connection = app.get('DatabaseConnection');
    if (connection) {
      await connection.dropDatabase();
    }
    await app.close();
  });

  describe('POST /auth/register', () => {
    describe('正常场景', () => {
      it('应该成功注册中文昵称用户并返回201', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: '小明' })
          .expect(201)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.message).toBe('注册成功');
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data.user.nickname).toBe('小明');
            expect(res.body.data.user).toHaveProperty('id');
            expect(res.body.data.user).toHaveProperty('createdAt');
          });
      });

      it('应该成功注册英文昵称用户', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: 'Tom' })
          .expect(201)
          .expect((res) => {
            expect(res.body.data.user.nickname).toBe('Tom');
          });
      });

      it('应该成功注册混合昵称用户', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: '小明Tom123' })
          .expect(201)
          .expect((res) => {
            expect(res.body.data.user.nickname).toBe('小明Tom123');
          });
      });

      it('应该成功注册带下划线的昵称', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: 'user_123' })
          .expect(201)
          .expect((res) => {
            expect(res.body.data.user.nickname).toBe('user_123');
          });
      });
    });

    describe('异常场景 - DTO验证', () => {
      it('昵称为空应该返回400', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: '' })
          .expect(400)
          .expect((res) => {
            const messages = Array.isArray(res.body.message)
              ? res.body.message
              : [res.body.message];
            expect(messages.some((msg) => msg.includes('昵称'))).toBeTruthy();
          });
      });

      it('昵称过短（1个字符）应该返回400', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: 'a' })
          .expect(400)
          .expect((res) => {
            const messages = Array.isArray(res.body.message)
              ? res.body.message
              : [res.body.message];
            expect(
              messages.some((msg) => msg.includes('2-20个字符')),
            ).toBeTruthy();
          });
      });

      it('昵称过长（21个字符）应该返回400', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: 'a'.repeat(21) }) // 21个字符
          .expect(400)
          .expect((res) => {
            const messages = Array.isArray(res.body.message)
              ? res.body.message
              : [res.body.message];
            expect(
              messages.some((msg) => msg.includes('2-20个字符')),
            ).toBeTruthy();
          });
      });

      it('昵称包含特殊字符（@）应该返回400', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: '小明@123' })
          .expect(400)
          .expect((res) => {
            const messages = Array.isArray(res.body.message)
              ? res.body.message
              : [res.body.message];
            expect(
              messages.some((msg) => msg.includes('中文、英文、数字和下划线')),
            ).toBeTruthy();
          });
      });

      it('昵称包含空格应该返回400', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: '小 明' })
          .expect(400)
          .expect((res) => {
            const messages = Array.isArray(res.body.message)
              ? res.body.message
              : [res.body.message];
            expect(
              messages.some((msg) => msg.includes('中文、英文、数字和下划线')),
            ).toBeTruthy();
          });
      });

      it('缺少nickname字段应该返回400', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({})
          .expect(400);
      });

      it('nickname不是字符串类型应该返回400', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: 123 })
          .expect(400);
      });
    });

    describe('异常场景 - 业务逻辑', () => {
      it('昵称已存在应该返回409', async () => {
        const nickname = '重复测试用户';

        // 第一次注册
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname })
          .expect(201);

        // 第二次注册应该失败
        return request(app.getHttpServer());
      });
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // 注册一个用户并获取token
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nickname: '认证测试用户' })
        .expect(201);

      authToken = res.body.data.token;
      userId = res.body.data.user.id;
    });

    describe('正常场景', () => {
      it('应该在提供有效token时返回用户信息', () => {
        return request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.message).toBe('获取成功');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data).toHaveProperty('nickname');
            expect(res.body.data).toHaveProperty('createdAt');
            expect(res.body.data).toHaveProperty('updatedAt');
            expect(res.body.data.id).toBe(userId);
            expect(res.body.data.nickname).toBe('认证测试用户');
          });
      });

      it('应该返回正确的日期格式', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const { createdAt, updatedAt } = res.body.data;
        // 验证ISO 8601格式
        expect(new Date(createdAt).toISOString()).toBe(createdAt);
        expect(new Date(updatedAt).toISOString()).toBe(updatedAt);
      });

      it('同一个token可以多次使用', async () => {
        // 第一次请求
        await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // 第二次请求
        await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // 第三次请求
        const res = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.data.id).toBe(userId);
      });
    });

    describe('异常场景 - 未授权', () => {
      it('应该在未提供token时返回401', () => {
        return request(app.getHttpServer())
          .get('/auth/me')
          .expect(401)
          .expect((res) => {
            expect(res.body.statusCode).toBe(401);
          });
      });

      it('应该在提供无效token时返回401', () => {
        return request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', 'Bearer invalid-token-string')
          .expect(401);
      });

      it('应该在token格式错误时返回401', () => {
        return request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', 'InvalidFormat')
          .expect(401);
      });

      it('应该在不使用Bearer前缀时返回401', () => {
        return request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', authToken)
          .expect(401);
      });

      it('应该在Authorization header为空字符串时返回401', () => {
        return request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', '')
          .expect(401);
      });

      it('应该在token被篡改时返回401', () => {
        // 篡改token的最后一个字符
        const tamperedToken = authToken.slice(0, -1) + 'X';
        return request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${tamperedToken}`)
          .expect(401);
      });
    });

    describe('集成测试', () => {
      it('注册后的token应该能立即用于认证', async () => {
        const registerRes = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: '即时认证测试' })
          .expect(201);

        const token = registerRes.body.data.token;
        const newUserId = registerRes.body.data.user.id;

        // 立即使用token获取用户信息
        const meRes = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(meRes.body.data.id).toBe(newUserId);
        expect(meRes.body.data.nickname).toBe('即时认证测试');
      });

      it('不同用户的token应该返回不同的用户信息', async () => {
        // 注册第二个用户
        const user2Res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ nickname: '第二个用户' })
          .expect(201);

        const token2 = user2Res.body.data.token;
        const userId2 = user2Res.body.data.user.id;

        // 使用第一个用户的token
        const me1Res = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // 使用第二个用户的token
        const me2Res = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${token2}`)
          .expect(200);

        // 验证返回的是不同的用户
        expect(me1Res.body.data.id).toBe(userId);
        expect(me1Res.body.data.nickname).toBe('认证测试用户');
        expect(me2Res.body.data.id).toBe(userId2);
        expect(me2Res.body.data.nickname).toBe('第二个用户');
        expect(me1Res.body.data.id).not.toBe(me2Res.body.data.id);
      });
    });
  });
});
