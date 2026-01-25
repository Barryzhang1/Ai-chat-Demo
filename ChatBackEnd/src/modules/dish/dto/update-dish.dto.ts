import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateDishDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isSpicy?: boolean;

  @IsBoolean()
  @IsOptional()
  hasScallions?: boolean;

  @IsBoolean()
  @IsOptional()
  hasCilantro?: boolean;

  @IsBoolean()
  @IsOptional()
  hasGarlic?: boolean;

  @IsNumber()
  @IsOptional()
  cookingTime?: number;
}
