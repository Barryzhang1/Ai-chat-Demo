import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { UserInfoDto } from './dto/user-info.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * 认证控制器
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   * @param registerDto 注册信息
   * @returns 注册响应
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<{
    code: number;
    message: string;
    data: RegisterResponseDto;
  }> {
    const data = await this.authService.register(registerDto);

    return {
      code: 0,
      message: '注册成功',
      data,
    };
  }

  /**
   * 获取当前用户信息
   * @param req 包含用户信息的请求对象
   * @returns 用户信息响应
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req: any): {
    code: number;
    message: string;
    data: UserInfoDto;
  } {
    const user = req.user;

    const userInfo: UserInfoDto = {
      id: user.id,
      nickname: user.nickname,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return {
      code: 0,
      message: '获取成功',
      data: userInfo,
    };
  }
}
