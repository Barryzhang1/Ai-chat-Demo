import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt-token'),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('应该成功注册中文昵称用户', () => {
      const registerDto: RegisterDto = { nickname: '小明' };
      const result = controller.register(registerDto);

      expect(result.code).toBe(0);
      expect(result.message).toBe('注册成功');
      expect(result.data).toHaveProperty('token');
      expect(result.data).toHaveProperty('user');
      expect(result.data.user.nickname).toBe('小明');
      expect(result.data.user).toHaveProperty('id');
      expect(result.data.user).toHaveProperty('createdAt');
    });

    it('应该成功注册英文昵称用户', () => {
      const registerDto: RegisterDto = { nickname: 'Tom' };
      const result = controller.register(registerDto);

      expect(result.code).toBe(0);
      expect(result.message).toBe('注册成功');
      expect(result.data.user.nickname).toBe('Tom');
    });

    it('应该成功注册混合昵称用户', () => {
      const registerDto: RegisterDto = { nickname: '小明Tom123' };
      const result = controller.register(registerDto);

      expect(result.code).toBe(0);
      expect(result.data.user.nickname).toBe('小明Tom123');
    });

    it('应该成功注册带下划线的昵称', () => {
      const registerDto: RegisterDto = { nickname: 'user_123' };
      const result = controller.register(registerDto);

      expect(result.code).toBe(0);
      expect(result.data.user.nickname).toBe('user_123');
    });

    it('应该返回有效的UUID格式的用户ID', () => {
      const registerDto: RegisterDto = { nickname: '测试用户' };
      const result = controller.register(registerDto);

      // UUID v4 格式验证
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.data.user.id).toMatch(uuidRegex);
    });

    it('应该返回ISO 8601格式的创建时间', () => {
      const registerDto: RegisterDto = { nickname: '测试时间' };
      const result = controller.register(registerDto);

      const date = new Date(result.data.user.createdAt);
      expect(date.toISOString()).toBe(result.data.user.createdAt);
    });
  });

  describe('getProfile', () => {
    it('应该返回用户信息', () => {
      const mockUser = {
        id: 'test-user-id',
        nickname: '测试用户',
        createdAt: new Date('2026-01-23T10:00:00.000Z'),
        updatedAt: new Date('2026-01-23T10:00:00.000Z'),
      };

      const mockRequest = {
        user: mockUser,
      };

      const result = controller.getProfile(mockRequest);

      expect(result.code).toBe(0);
      expect(result.message).toBe('获取成功');
      expect(result.data.id).toBe('test-user-id');
      expect(result.data.nickname).toBe('测试用户');
      expect(result.data.createdAt).toBe('2026-01-23T10:00:00.000Z');
      expect(result.data.updatedAt).toBe('2026-01-23T10:00:00.000Z');
    });

    it('应该返回ISO 8601格式的时间', () => {
      const now = new Date();
      const mockRequest = {
        user: {
          id: 'test-id',
          nickname: '时间测试',
          createdAt: now,
          updatedAt: now,
        },
      };

      const result = controller.getProfile(mockRequest);

      expect(result.data.createdAt).toBe(now.toISOString());
      expect(result.data.updatedAt).toBe(now.toISOString());
    });
  });
});
