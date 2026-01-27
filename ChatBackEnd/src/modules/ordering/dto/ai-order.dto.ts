import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AiOrderDto {
  @ApiProperty({
    description: '用户消息内容',
    example: '我们3个人，想吃点辣的，不吃海鲜',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: '消息内容不能为空' })
  @Length(1, 500, { message: '消息内容长度必须在1-500个字符之间' })
  message: string;
}
