import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    description: '聊天消息内容',
    example: '你好,请问有什么可以帮助你的?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiProperty({
    description: '用户ID',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
