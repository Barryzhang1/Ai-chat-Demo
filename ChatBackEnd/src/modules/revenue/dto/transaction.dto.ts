import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum';

/**
 * 单条交易记录 DTO
 */
export class TransactionItemDto {
  @ApiProperty({
    description: '交易类型',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType, { message: '类型必须是 income 或 expense' })
  type: TransactionType;

  @ApiProperty({ description: '金额', example: 5000.0, minimum: 0.01 })
  @IsNumber({}, { message: '金额必须是数字' })
  @Min(0.01, { message: '金额必须大于0' })
  amount: number;

  @ApiProperty({ description: '分类', example: '房租' })
  @IsString({ message: '分类必须是字符串' })
  category: string;

  @ApiPropertyOptional({
    description: '描述',
    example: '2月份店铺租金',
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  @MaxLength(200, { message: '描述不能超过200字符' })
  description?: string;

  @ApiProperty({
    description: '交易日期',
    example: '2026-02-01',
    type: String,
  })
  @IsDateString({}, { message: '日期格式不正确，应为 YYYY-MM-DD' })
  transactionDate: string;
}

/**
 * 批量创建额外收支 DTO
 */
export class BatchCreateTransactionsDto {
  @ApiProperty({
    description: '交易记录列表',
    type: [TransactionItemDto],
    minItems: 1,
  })
  @IsArray({ message: 'transactions 必须是数组' })
  @ArrayMinSize(1, { message: '至少需要一条交易记录' })
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  transactions: TransactionItemDto[];
}

/**
 * 查询额外收支列表 DTO
 */
export class QueryTransactionsDto {
  @ApiPropertyOptional({
    description: '交易类型',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ description: '分类', example: '房租' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: '开始日期',
    example: '2026-02-01',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期',
    example: '2026-02-28',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '关键词搜索', example: '租金' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}
