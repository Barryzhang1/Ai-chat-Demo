import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { UpdateUserRoleDto } from '../auth/dto/update-user-role.dto';
import { UserListItemDto } from '../auth/dto/user-list.dto';

/**
 * 用户管理控制器
 * 用于管理用户权限和角色
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 获取所有用户列表
   * @returns 用户列表
   * @description 只有老板角色可以访问
   */
  @Get('list')
  @Roles(UserRole.BOSS)
  @HttpCode(HttpStatus.OK)
  async getAllUsers(): Promise<{
    success: boolean;
    data: UserListItemDto[];
  }> {
    const users = await this.authService.findAllUsers();
    return {
      success: true,
      data: users,
    };
  }

  /**
   * 更新用户角色
   * @param userId 用户ID
   * @param updateUserRoleDto 角色更新DTO
   * @returns 更新后的用户信息
   * @description 只有老板角色可以访问
   */
  @Patch(':userId/role')
  @Roles(UserRole.BOSS)
  @HttpCode(HttpStatus.OK)
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: UserListItemDto;
  }> {
    const user = await this.authService.updateUserRole(userId, updateUserRoleDto);
    return {
      success: true,
      message: '用户角色更新成功',
      data: user,
    };
  }
}
