import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

/**
 * 角色权限装饰器元数据键
 */
export const ROLES_KEY = 'roles';

/**
 * 角色权限装饰器
 * 用于标记需要特定角色才能访问的路由
 * @param roles 允许访问的角色列表
 * @example @Roles(UserRole.BOSS)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
