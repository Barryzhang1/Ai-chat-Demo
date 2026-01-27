import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiProperty({ description: '是否启用', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
