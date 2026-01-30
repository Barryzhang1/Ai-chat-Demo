import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInventoryHistoryDto {
  @ApiPropertyOptional({ description: '库存ID', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  inventoryId?: string;

  @ApiPropertyOptional({ description: '产品名称（模糊搜索）', example: '面' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({
    description: '变更类型',
    enum: ['all', 'purchase', 'loss', 'manual_adjust'],
  })
  @IsOptional()
  @IsString()
  changeType?: 'all' | 'purchase' | 'loss' | 'manual_adjust';

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number;
}
