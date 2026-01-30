import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import {
  RegisterResponseDto,
  RegisterUserDto,
} from './dto/register-response.dto';
import { User, UserDocument } from './schemas/user.schema';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { randomUUID } from 'crypto';
import { UserRole } from './enums/user-role.enum';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserListItemDto } from './dto/user-list.dto';

/**
 * 认证服务
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户注册/登录
   * @param registerDto 注册信息
   * @returns 注册响应，包含token和用户信息
   * @description 如果用户已存在，则直接登录；否则创建新用户
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { nickname } = registerDto;

    try {
      // 检查昵称是否已存在
      const existingUser = await this.userModel.findOne({ nickname }).exec();
      if (existingUser) {
        // 用户已存在，直接登录
        const token = this.generateJwtToken(existingUser.id, existingUser.nickname, existingUser.role);
        
        const userDto: RegisterUserDto = {
          id: existingUser.id,
          nickname: existingUser.nickname,
          createdAt: existingUser.createdAt!.toISOString(),
        };

        return {
          token,
          user: userDto,
        };
      }

      // 用户不存在，创建新用户
      // 生成用户ID
      const userId = randomUUID();

      // 创建用户文档
      const newUser = new this.userModel({
        id: userId,
        nickname,
        role: UserRole.USER, // 默认角色为普通用户
      });

      // 保存到MongoDB
      const savedUser = await newUser.save();

      // 生成JWT token
      const token = this.generateJwtToken(userId, nickname, savedUser.role);

      // 构建响应
      const userDto: RegisterUserDto = {
        id: savedUser.id,
        nickname: savedUser.nickname,
        createdAt: savedUser.createdAt!.toISOString(),
      };

      return {
        token,
        user: userDto,
      };
    } catch (error) {
      console.error('注册/登录失败:', error);
      throw new InternalServerErrorException('服务器内部错误');
    }
  }

  /**
   * 生成JWT token
   * @param userId 用户ID
   * @param nickname 用户昵称
   * @param role 用户角色
   * @returns JWT token字符串
   */
  private generateJwtToken(userId: string, nickname: string, role: UserRole): string {
    const payload: JwtPayload = {
      sub: userId,
      nickname,
      role,
    };
    return this.jwtService.sign(payload);
  }

  /**
   * 根据ID获取用户
   * @param userId 用户ID
   * @returns 用户实体或null
   */
  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ id: userId }).exec();
  }

  /**
   * 根据昵称获取用户
   * @param nickname 用户昵称
   * @returns 用户实体或null
   */
  async findByNickname(nickname: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ nickname }).exec();
  }

  /**
   * 获取所有用户列表
   * @returns 用户列表
   */
  async findAllUsers(): Promise<UserListItemDto[]> {
    try {
      const users = await this.userModel.find().sort({ createdAt: -1 }).exec();
      
      return users.map(user => ({
        id: user.id,
        nickname: user.nickname,
        role: user.role,
        createdAt: user.createdAt!.toISOString(),
        updatedAt: user.updatedAt!.toISOString(),
      }));
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw new InternalServerErrorException('获取用户列表失败');
    }
  }

  /**
   * 更新用户角色
   * @param userId 用户ID
   * @param updateUserRoleDto 角色更新DTO
   * @returns 更新后的用户信息
   */
  async updateUserRole(
    userId: string,
    updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserListItemDto> {
    try {
      // 查找用户
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 更新角色
      user.role = updateUserRoleDto.role;
      const updatedUser = await user.save();

      return {
        id: updatedUser.id,
        nickname: updatedUser.nickname,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt!.toISOString(),
        updatedAt: updatedUser.updatedAt!.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('更新用户角色失败:', error);
      throw new InternalServerErrorException('更新用户角色失败');
    }
  }
}
