import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Ordering Module (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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

    // 注册并获取token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nickname: `test_user_${Date.now()}` })
      .expect(201);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /ordering/ai-order', () => {
    it('应该成功处理点餐请求', async () => {
      const response = await request(app.getHttpServer())
        .post('/ordering/ai-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: '我们3个人，想吃点辣的' })
        .expect(200);

      expect(response.body.code).toBe(0);
      expect(response.body.data).toHaveProperty('reply');
      expect(response.body.data).toHaveProperty('dishes');
      expect(response.body.data).toHaveProperty('cart');
    });

    it('应该拒绝空消息', async () => {
      await request(app.getHttpServer())
        .post('/ordering/ai-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: '' })
        .expect(400);
    });

    it('应该拒绝过长的消息', async () => {
      const longMessage = 'a'.repeat(501);
      await request(app.getHttpServer())
        .post('/ordering/ai-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: longMessage })
        .expect(400);
    });

    it('应该拒绝未认证的请求', async () => {
      await request(app.getHttpServer())
        .post('/ordering/ai-order')
        .send({ message: '我想吃辣的' })
        .expect(401);
    });
  });

  describe('GET /ordering/cart', () => {
    it('应该成功获取购物车', async () => {
      const response = await request(app.getHttpServer())
        .get('/ordering/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(0);
      expect(response.body.data).toHaveProperty('dishes');
      expect(response.body.data).toHaveProperty('totalPrice');
      expect(response.body.data).toHaveProperty('totalItems');
    });

    it('应该拒绝未认证的请求', async () => {
      await request(app.getHttpServer()).get('/ordering/cart').expect(401);
    });
  });

  describe('POST /ordering/refresh-menu', () => {
    it('应该在有查询条件时成功刷新菜单', async () => {
      // 先通过AI点餐创建购物车和查询条件
      await request(app.getHttpServer())
        .post('/ordering/ai-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: '我想吃辣的' })
        .expect(200);

      // 然后刷新菜单
      const response = await request(app.getHttpServer())
        .post('/ordering/refresh-menu')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(0);
      expect(response.body.data).toHaveProperty('dishes');
      expect(response.body.data).toHaveProperty('cart');
    });

    it('应该拒绝未认证的请求', async () => {
      await request(app.getHttpServer())
        .post('/ordering/refresh-menu')
        .expect(401);
    });
  });

  describe('POST /ordering/create-order', () => {
    beforeEach(async () => {
      // 每次测试前确保购物车有商品
      await request(app.getHttpServer())
        .post('/ordering/ai-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: '我想吃辣的' });
    });

    it('应该成功创建订单', async () => {
      const response = await request(app.getHttpServer())
        .post('/ordering/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ note: '少放辣' })
        .expect(201);

      expect(response.body.code).toBe(0);
      expect(response.body.data).toHaveProperty('orderId');
      expect(response.body.data).toHaveProperty('dishes');
      expect(response.body.data).toHaveProperty('totalPrice');
      expect(response.body.data.status).toBe('pending');
    });

    it('应该接受不带备注的订单', async () => {
      const response = await request(app.getHttpServer())
        .post('/ordering/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      expect(response.body.code).toBe(0);
      expect(response.body.data).toHaveProperty('orderId');
    });

    it('应该拒绝过长的备注', async () => {
      const longNote = 'a'.repeat(201);
      await request(app.getHttpServer())
        .post('/ordering/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ note: longNote })
        .expect(400);
    });

    it('应该拒绝未认证的请求', async () => {
      await request(app.getHttpServer())
        .post('/ordering/create-order')
        .send({ note: '测试备注' })
        .expect(401);
    });
  });
});
