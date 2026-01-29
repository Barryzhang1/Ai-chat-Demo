import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportQueryDto {
  @ApiProperty({
    description: '查询日期（YYYY-MM-DD格式），不传则查询今日',
    example: '2026-01-29',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: '日期格式必须为 YYYY-MM-DD' })
  date?: string;
}
