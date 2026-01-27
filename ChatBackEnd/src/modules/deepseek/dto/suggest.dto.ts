import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SuggestDto {
  @ApiProperty({
    description: '提示词/问题',
    example: '推荐一些适合儿童的菜品',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
