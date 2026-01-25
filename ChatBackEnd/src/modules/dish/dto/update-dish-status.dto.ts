import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateDishStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isDelisted: boolean;
}
