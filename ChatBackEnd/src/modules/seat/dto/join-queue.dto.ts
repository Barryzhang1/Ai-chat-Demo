import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinQueueDto {
  @ApiProperty({ description: 'Socket ID', example: 'abc123' })
  @IsString()
  socketId: string;

  @ApiProperty({ description: '用户昵称', example: '张三', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '用餐人数', example: 4, default: 1 })
  @IsNumber()
  @Min(1)
  partySize: number = 1;
}
