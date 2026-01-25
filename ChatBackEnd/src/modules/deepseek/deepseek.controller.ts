import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeepseekService } from './deepseek.service';
import { ExecuteCommandDto } from './dto/execute-command.dto';
import { CommandResult } from './entities/command-result.entity';

@ApiTags('deepseek')
@Controller('deepseek')
export class DeepseekController {
  constructor(private readonly deepseekService: DeepseekService) {}

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '执行 DeepSeek API 命令' })
  @ApiResponse({
    status: 200,
    description: '命令执行完成',
    type: () => CommandResult,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async executeCommand(
    @Body() executeCommandDto: ExecuteCommandDto,
  ): Promise<CommandResult> {
    return this.deepseekService.executeCommand(executeCommandDto);
  }

  @Post('suggest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取 DeepSeek 建议' })
  @ApiResponse({
    status: 200,
    description: '获取建议成功',
    type: () => CommandResult,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async suggest(@Body('prompt') prompt: string): Promise<CommandResult> {
    return this.deepseekService.suggest(prompt);
  }

  @Post('explain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '解释代码' })
  @ApiResponse({
    status: 200,
    description: '代码解释成功',
    type: () => CommandResult,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async explain(@Body('code') code: string): Promise<CommandResult> {
    return this.deepseekService.explain(code);
  }

  @Get('status')
  @ApiOperation({ summary: '检查 DeepSeek API 状态' })
  @ApiResponse({ status: 200, description: '状态检查成功' })
  async checkStatus(): Promise<{
    available: boolean;
    version?: string;
    error?: string;
  }> {
    return this.deepseekService.checkStatus();
  }
}
