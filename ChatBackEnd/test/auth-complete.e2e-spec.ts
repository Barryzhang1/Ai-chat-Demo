import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

describe('Auth API - Complete Flow (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('应该成功注册用户并返回JWT token', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ nickname: 'E2E测试用户' })
        .expect(201)
        .expect((res) => {
          expect(res.body.code).toBe(0);
          expect(res.body.message).toBe('注册成功');
          expect(res.body.data).toHaveProperty('token');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user.nickname).toBe('E2E测试用户');

          // 保存token用于后续测试
          authToken = res.body.data.token;
          expect(authToken).toBeTruthy();
          expect(typeof authToken).toBe('string');
        });
    });

    it('JWT token应该是有效的格式', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nickname: 'Token格式测试' })
        .expect(201);

      const token = res.body.data.token;
      // JWT格式: header.payload.signature
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('GET /auth/me', () => {
    beforeAll(async () => {
      // 确保有一个注册用户和token
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nickname: '认证测试用户' });
      authToken = res.body.data.token;
    });

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
        });
    });

    it('应该在未提供token时返回401', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('应该在提供无效token时返回401', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
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
  });

  describe('JWT Token Integration', () => {
    it('注册后的token应该能立即用于认证', async () => {
      // 注册新用户
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nickname: '即时认证测试' })
        .expect(201);

      const token = registerRes.body.data.token;
      const userId = registerRes.body.data.user.id;

      // 立即使用token获取用户信息
      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meRes.body.data.id).toBe(userId);
      expect(meRes.body.data.nickname).toBe('即时认证测试');
    });

    it('同一个token可以多次使用', async () => {
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nickname: '多次使用测试' })
        .expect(201);

      const token = registerRes.body.data.token;

      // 第一次请求
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 第二次请求
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 第三次请求
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
