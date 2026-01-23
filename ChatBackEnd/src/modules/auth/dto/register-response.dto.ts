/**
 * 注册响应中的用户信息
 */
export class RegisterUserDto {
  /**
   * 用户唯一标识 (UUID)
   */
  id: string;

  /**
   * 用户昵称
   */
  nickname: string;

  /**
   * 用户创建时间
   */
  createdAt: string;
}

/**
 * 注册响应 DTO
 */
export class RegisterResponseDto {
  /**
   * JWT token
   */
  token: string;

  /**
   * 用户信息
   */
  user: RegisterUserDto;
}
