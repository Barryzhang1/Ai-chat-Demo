import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateDishDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  ingredients?: string[];

  @IsBoolean()
  @IsOptional()
  isDelisted?: boolean;
}
