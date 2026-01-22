import { ApiProperty } from '@nestjs/swagger';

export class Chat {
  @ApiProperty({ description: '消息ID' })
  id: string;

  @ApiProperty({ description: '消息内容' })
  message: string;

  @ApiProperty({ description: '用户ID' })
  userId: string;

  @ApiProperty({ description: '消息类型', enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
