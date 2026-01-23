import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
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
   * 用户注册
   * @param registerDto 注册信息
   * @returns 注册响应，包含token和用户信息
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { nickname } = registerDto;

    try {
      // 检查昵称是否已存在
      const existingUser = await this.userModel.findOne({ nickname }).exec();
      if (existingUser) {
        throw new ConflictException('昵称已被使用');
      }

      // 生成用户ID
      const userId = randomUUID();

      // 创建用户文档
      const newUser = new this.userModel({
        id: userId,
        nickname,
      });

      // 保存到MongoDB
      const savedUser = await newUser.save();

      // 生成JWT token
      const token = this.generateJwtToken(userId, nickname);

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
      // 处理MongoDB唯一索引冲突
      if (error.code === 11000) {
        throw new ConflictException('昵称已被使用');
      }
      
      // 如果是已知的ConflictException，直接抛出
      if (error instanceof ConflictException) {
        throw error;
      }

      console.error('注册失败:', error);
      throw new InternalServerErrorException('服务器内部错误');
    }
  }

  /**
   * 生成JWT token
   * @param userId 用户ID
   * @param nickname 用户昵称
   * @returns JWT token字符串
   */
  private generateJwtToken(userId: string, nickname: string): string {
    const payload: JwtPayload = {
      sub: userId,
      nickname,
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
}
