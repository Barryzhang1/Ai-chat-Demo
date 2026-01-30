import { UserRole } from '../enums/user-role.enum';

/**
 * 用户信息DTO（用于列表展示）
 */
export class UserListItemDto {
  /**
   * 用户ID
   */
  id: string;

  /**
   * 用户昵称
   */
  nickname: string;

  /**
   * 用户角色
   */
  role: UserRole;

  /**
   * 创建时间
   */
  createdAt: string;

  /**
   * 更新时间
   */
  updatedAt: string;
}
