import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('应该在用户存在时返回用户信息', async () => {
      const payload: JwtPayload = {
        sub: 'user-id',
        nickname: '测试用户',
      };

      const mockUser = {
        id: 'user-id',
        nickname: '测试用户',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(authService, 'findById').mockReturnValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(authService.findById).toHaveBeenCalledWith('user-id');
    });

    it('应该在用户不存在时抛出UnauthorizedException', async () => {
      const payload: JwtPayload = {
        sub: 'non-existent-user',
        nickname: '不存在的用户',
      };

      jest.spyOn(authService, 'findById').mockReturnValue(undefined);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        '未授权，请先登录',
      );
    });
  });
});
