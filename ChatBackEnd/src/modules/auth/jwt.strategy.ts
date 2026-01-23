import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserDocument } from './schemas/user.schema';

/**
 * JWT认证策略
 * 用于验证JWT token并提取用户信息
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      // 从请求头的Authorization字段提取Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 不忽略过期时间
      ignoreExpiration: false,
      // JWT密钥
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  /**
   * 验证JWT payload并返回用户信息
   * Passport会自动验证token签名和过期时间
   * 此方法只需要验证用户是否存在
   *
   * @param payload JWT解析后的payload
   * @returns 用户实体
   * @throws UnauthorizedException 用户不存在时抛出
   */
  async validate(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.authService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('未授权，请先登录');
    }

    return user;
  }
}
