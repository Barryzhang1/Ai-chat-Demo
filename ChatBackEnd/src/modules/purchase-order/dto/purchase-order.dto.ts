import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseOrderItemDto {
  @ApiProperty({ description: '产品名称', example: '面粉' })
  @IsString()
  productName: string;

  @ApiProperty({ description: '数量', example: 50 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: '单价', example: 5.5 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: '供应商名称', example: '张三批发商' })
  @IsString()
  supplierName: string;

  @ApiProperty({ description: '进货项目列表', type: [PurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];

  @ApiPropertyOptional({ description: '备注', example: '紧急采购' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class ApprovePurchaseOrderDto {
  @ApiProperty({ description: '是否通过', example: true })
  @IsBoolean()
  approve: boolean;

  @ApiPropertyOptional({ description: '备注', example: '同意采购' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class ReceivePurchaseOrderDto {
  @ApiPropertyOptional({ description: '备注', example: '货物已清点入库' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryPurchaseOrderDto {
  @ApiPropertyOptional({ description: '订单号（模糊搜索）', example: 'PO' })
  @IsOptional()
  @IsString()
  orderNo?: string;

  @ApiPropertyOptional({
    description: '订单状态',
    enum: ['all', 'pending', 'approved', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  status?: 'all' | 'pending' | 'approved' | 'completed' | 'cancelled';

  @ApiPropertyOptional({ description: '供应商名称（模糊搜索）', example: '张三' })
  @IsOptional()
  @IsString()
  supplierName?: string;

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
