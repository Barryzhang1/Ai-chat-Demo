import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: '订单状态',
    example: 'completed',
    enum: ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'],
  })
  @IsString()
  @IsEnum(['pending', 'confirmed', 'preparing', 'completed', 'cancelled'], {
    message: '订单状态必须是以下之一：pending, confirmed, preparing, completed, cancelled',
  })
  status: string;
}
