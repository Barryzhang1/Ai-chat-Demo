import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateDishDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

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
