import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ExecuteCommandDto {
  @ApiProperty({
    description: 'DeepSeek API 命令/提示词',
    example: '如何优化这段代码',
  })
  @IsString()
  @IsNotEmpty()
  command: string;

  @IsString()
  systemPrompt: string;

  @ApiProperty({
    description: '额外参数',
    example: ['--format', 'json'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  args?: string[];

  @ApiProperty({
    description: '工作目录',
    example: '/path/to/project',
    required: false,
  })
  @IsString()
  @IsOptional()
  cwd?: string;
}
