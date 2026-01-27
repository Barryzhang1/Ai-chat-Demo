import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: '类别名称', example: '热菜' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '排序权重', example: 10, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
