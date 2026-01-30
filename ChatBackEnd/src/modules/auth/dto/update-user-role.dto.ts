import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

/**
 * 更新用户角色DTO
 */
export class UpdateUserRoleDto {
  /**
   * 用户角色
   */
  @IsEnum(UserRole, { message: '无效的角色类型' })
  @IsNotEmpty({ message: '缺少必填参数：role' })
  role: UserRole;
}
