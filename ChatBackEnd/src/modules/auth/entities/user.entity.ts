/**
 * 用户实体
 */
export class User {
  /**
   * 用户唯一标识 (UUID)
   */
  id: string;

  /**
   * 用户昵称
   */
  nickname: string;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 更新时间
   */
  updatedAt: Date;
}
