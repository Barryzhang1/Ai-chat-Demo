import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload) => `mock-jwt-${payload.sub}`),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    // 清理服务状态（由于使用内存存储）
    const newModule = Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload) => `mock-jwt-${payload.sub}`),
          },
        },
      ],
    });
    newModule.compile().then((module) => {
      service = module.get<AuthService>(AuthService);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    // 正常场景测试
    describe('正常场景', () => {
      it('应该成功注册中文昵称用户', () => {
        const registerDto: RegisterDto = { nickname: '小明' };
        const result = service.register(registerDto);

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('user');
        expect(result.user.nickname).toBe('小明');
        expect(result.user.id).toBeDefined();
        expect(result.user.createdAt).toBeDefined();
      });

      it('应该成功注册英文昵称用户', () => {
        const registerDto: RegisterDto = { nickname: 'Tom' };
        const result = service.register(registerDto);

        expect(result.user.nickname).toBe('Tom');
      });

      it('应该成功注册混合昵称用户', () => {
        const registerDto: RegisterDto = { nickname: '小明Tom123' };
        const result = service.register(registerDto);

        expect(result.user.nickname).toBe('小明Tom123');
      });

      it('应该成功注册带下划线的昵称', () => {
      it('应该为每个用户生成不同的token', () => {
        const user1 = service.register({ nickname: '用户A' });
        const user2 = service.register({ nickname: '用户B' });

        expect(user1.token).not.toBe(user2.token);
        expect(jwtService.sign).toHaveBeenCalledTimes(2);
      });
      it('应该为每个用户生成唯一的UUID', () => {
        const user1 = service.register({ nickname: '用户1' });
        const user2 = service.register({ nickname: '用户2' });

        expect(user1.user.id).not.toBe(user2.user.id);
      });

      it('应该为每个用户生成不同的token', () => {
        const user1 = service.register({ nickname: '用户A' });
        const user2 = service.register({ nickname: '用户B' });

        expect(user1.token).not.toBe(user2.token);
      });

      it('生成的用户ID应该是有效的UUID v4格式', () => {
        const result = service.register({ nickname: '测试UUID' });
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        expect(result.user.id).toMatch(uuidRegex);
      });

      it('创建时间应该是有效的ISO 8601格式', () => {
        const result = service.register({ nickname: '测试时间' });
        const date = new Date(result.user.createdAt);

        expect(date.toISOString()).toBe(result.user.createdAt);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });

    // 异常场景测试
    describe('异常场景', () => {
      it('应该在昵称已存在时抛出ConflictException', () => {
        const registerDto: RegisterDto = { nickname: '重复昵称' };

        // 第一次注册应该成功
        service.register(registerDto);

        // 第二次注册应该失败
        expect(() => {
          service.register(registerDto);
        }).toThrow(ConflictException);
      });

      it('ConflictException应该包含正确的错误消息', () => {
        const registerDto: RegisterDto = { nickname: '测试昵称' };
        service.register(registerDto);

        try {
          service.register(registerDto);
          fail('应该抛出ConflictException');
        } catch (error) {
          expect(error).toBeInstanceOf(ConflictException);
          if (error instanceof ConflictException) {
            expect(error.message).toBe('昵称已被使用');
          }
        }
      });
    });
  });

  describe('findById', () => {
    it('应该能够通过ID找到已注册的用户', () => {
      const registerDto: RegisterDto = { nickname: '查找测试' };
      const registered = service.register(registerDto);

      const found = service.findById(registered.user.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(registered.user.id);
      expect(found?.nickname).toBe('查找测试');
    });

    it('查找不存在的ID应该返回undefined', () => {
      const found = service.findById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('findByNickname', () => {
    it('应该能够通过昵称找到已注册的用户', () => {
      const registerDto: RegisterDto = { nickname: '昵称查找' };
      service.register(registerDto);

      const found = service.findByNickname('昵称查找');

      expect(found).toBeDefined();
      expect(found?.nickname).toBe('昵称查找');
    });

    it('查找不存在的昵称应该返回undefined', () => {
      const found = service.findByNickname('不存在的昵称');
      expect(found).toBeUndefined();
    });
  });
});
