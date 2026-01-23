/**
 * 用户信息响应DTO
 */
export class UserInfoDto {
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

  /**
   * 用户信息最后更新时间
   */
  updatedAt: string;
}
