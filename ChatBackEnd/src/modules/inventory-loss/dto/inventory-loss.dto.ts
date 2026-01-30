import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryLossDto {
  @ApiProperty({ description: '库存ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  inventoryId: string;

  @ApiProperty({ description: '数量', example: 5 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: '损耗原因', example: '过期' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: '备注', example: '已妥善处理' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryInventoryLossDto {
  @ApiPropertyOptional({ description: '库存ID', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  inventoryId?: string;

  @ApiPropertyOptional({ description: '产品名称（模糊搜索）', example: '面' })
  @IsOptional()
  @IsString()
  productName?: string;

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
