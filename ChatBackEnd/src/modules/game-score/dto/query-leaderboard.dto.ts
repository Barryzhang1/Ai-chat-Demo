import { IsString, IsOptional, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 查询排行榜DTO
 */
export class QueryLeaderboardDto {
  /**
   * 游戏类型
   */
  @IsString()
  @IsOptional()
  gameType?: string;

  /**
   * 时间范围
   */
  @IsString()
  @IsOptional()
  @IsIn(['today', 'week', 'month', 'all'], {
    message: 'period必须是today、week、month或all中的一个',
  })
  period?: string;

  /**
   * 页码
   */
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: '页码必须大于0' })
  @IsOptional()
  page?: number;

  /**
   * 每页数量
   */
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: '每页数量必须大于0' })
  @IsOptional()
  limit?: number;
}
