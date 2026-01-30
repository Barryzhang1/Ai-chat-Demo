import { UserRole } from '../enums/user-role.enum';

/**
 * JWT Payload 接口
 */
export interface JwtPayload {
  /**
   * 用户ID (作为JWT的subject)
   */
  sub: string;

  /**
   * 用户昵称
   */
  nickname: string;

  /**
   * 用户角色
   */
  role: UserRole;

  /**
   * 签发时间 (由JWT自动添加)
   */
  iat?: number;

  /**
   * 过期时间 (由JWT自动添加)
   */
  exp?: number;
}
