import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

/**
 * 创建游戏分数DTO
 */
export class CreateGameScoreDto {
  /**
   * 玩家名称
   */
  @IsString()
  @IsNotEmpty({ message: '玩家名称不能为空' })
  @MaxLength(50, { message: '玩家名称不能超过50个字符' })
  playerName: string;

  /**
   * 游戏分数
   */
  @IsNumber({}, { message: '分数必须是数字' })
  @Min(0, { message: '分数不能为负数' })
  score: number;

  /**
   * 游戏类型
   */
  @IsString()
  @IsNotEmpty({ message: '游戏类型不能为空' })
  gameType: string;

  /**
   * 游戏时长（秒）
   */
  @IsNumber({}, { message: '游戏时长必须是数字' })
  @Min(0, { message: '游戏时长不能为负数' })
  @IsOptional()
  playTime?: number;

  /**
   * 玩家ID（如果已登录）
   */
  @IsString()
  @IsOptional()
  playerId?: string;
}
