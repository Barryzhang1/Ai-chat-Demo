import { ApiProperty } from '@nestjs/swagger';

export class CommandResult {
  @ApiProperty({
    description: '命令执行是否成功',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '命令输出内容',
    example: 'Command executed successfully',
  })
  output: string;

  @ApiProperty({
    description: '错误信息(如果有)',
    example: null,
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: '退出码',
    example: 0,
  })
  exitCode: number;

  @ApiProperty({
    description: '执行时间(毫秒)',
    example: 1234,
  })
  executionTime: number;

  @ApiProperty({
    description: '执行的完整命令',
    example: '如何优化代码',
  })
  fullCommand: string;

  @ApiProperty({
    description: '执行时间戳',
    example: '2026-01-23T10:30:00.000Z',
  })
  timestamp: Date;
}
