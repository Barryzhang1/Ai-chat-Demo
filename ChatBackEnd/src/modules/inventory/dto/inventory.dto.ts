import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({ description: '产品名称', example: '面粉' })
  @IsString()
  productName: string;

  @ApiProperty({ description: '数量', example: 100 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: '最新单价', example: 5.5 })
  @IsNumber()
  @Min(0)
  lastPrice: number;

  @ApiPropertyOptional({ description: '低库存阈值', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}

export class UpdateInventoryDto {
  @ApiPropertyOptional({ description: '产品名称', example: '面粉' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ description: '低库存阈值', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}

export class QueryInventoryDto {
  @ApiPropertyOptional({ description: '产品名称（模糊搜索）', example: '面' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ description: '库存状态', enum: ['all', 'low'] })
  @IsOptional()
  @IsString()
  status?: 'all' | 'low';

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
