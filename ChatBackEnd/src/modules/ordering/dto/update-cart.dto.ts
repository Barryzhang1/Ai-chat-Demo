import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CartDishDto {
  @ApiProperty({
    description: '菜品ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: '菜品ID不能为空' })
  dishId: string;

  @ApiProperty({
    description: '菜品数量',
    example: 2,
  })
  @IsNotEmpty({ message: '菜品数量不能为空' })
  quantity: number;
}

export class UpdateCartDto {
  @ApiProperty({
    description: '购物车菜品列表',
    type: [CartDishDto],
    example: [
      { dishId: '507f1f77bcf86cd799439011', quantity: 2 },
      { dishId: '507f1f77bcf86cd799439012', quantity: 1 },
    ],
  })
  @IsArray({ message: 'dishes必须是数组' })
  @ValidateNested({ each: true })
  @Type(() => CartDishDto)
  dishes: CartDishDto[];
}
