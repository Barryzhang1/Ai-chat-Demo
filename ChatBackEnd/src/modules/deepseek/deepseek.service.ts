import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ExecuteCommandDto } from './dto/execute-command.dto.js';
import { CommandResult } from './entities/command-result.entity.js';

@Injectable()
export class DeepseekService {
  private readonly logger = new Logger(DeepseekService.name);
  private apiKey: string | null = null;
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';

  constructor() {
    // 从环境变量获取 DeepSeek API Key
    this.apiKey = process.env.DEEPSEEK_API_KEY || null;
    if (!this.apiKey) {
      this.logger.warn(
        'DEEPSEEK_API_KEY not found in environment variables. Please set it to use DeepSeek API.',
      );
    } else {
      this.logger.log('DeepSeek API Key initialized successfully');
    }
  }

  private async callDeepseekAPI(
    messages: Array<{ role: string; content: string }>,
    model = 'deepseek-chat',
  ): Promise<string> {
    if (!this.apiKey) {
      throw new BadRequestException(
        'DeepSeek API Key is not configured. Please set DEEPSEEK_API_KEY environment variable.',
      );
    }

    const startTime = Date.now();

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `DeepSeek API error: ${response.status} ${errorText}`,
        );
        throw new Error(
          `DeepSeek API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const executionTime = Date.now() - startTime;
      this.logger.log(`DeepSeek API call completed in ${executionTime}ms`);

      return (
        data.choices[0]?.message?.content || 'No response from DeepSeek API'
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`DeepSeek API call failed: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to call DeepSeek API: ${errorMessage}`,
      );
    }
  }

  async executeCommand(
    executeCommandDto: ExecuteCommandDto,
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const { command, args } = executeCommandDto;
    const commandArgs = args || [];

    // 构建提示词
    const prompt = `${command} ${commandArgs.join(' ')}`.trim();
    this.logger.log(`Executing command with DeepSeek: ${prompt}`);

    try {
      const messages = [
        {
          role: 'system',
          content:
            'You are a helpful AI assistant powered by DeepSeek. Provide clear, concise, and accurate responses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const output = await this.callDeepseekAPI(messages);
      const executionTime = Date.now() - startTime;

      const result: CommandResult = {
        success: true,
        output,
        exitCode: 0,
        executionTime,
        fullCommand: prompt,
        timestamp: new Date(),
      };

      this.logger.log(`Command executed successfully in ${executionTime}ms`);
      return result;
    } catch (error: unknown) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Command execution failed: ${errorMessage}`);

      const result: CommandResult = {
        success: false,
        output: '',
        error: errorMessage,
        exitCode: 1,
        executionTime,
        fullCommand: prompt,
        timestamp: new Date(),
      };

      return result;
    }
  }

  async suggest(prompt: string): Promise<CommandResult> {
    this.logger.log(`Getting suggestion for: ${prompt}`);

    if (!prompt || prompt.trim().length === 0) {
      throw new BadRequestException('Prompt cannot be empty');
    }

    return this.executeCommand({
      command: prompt,
      args: [],
    });
  }

  async explain(code: string): Promise<CommandResult> {
    this.logger.log('Explaining code');

    if (!code || code.trim().length === 0) {
      throw new BadRequestException('Code cannot be empty');
    }

    return this.executeCommand({
      command: `请解释以下代码:\n\n${code}`,
      args: [],
    });
  }

  async checkStatus(): Promise<{
    available: boolean;
    version?: string;
    error?: string;
    authenticated?: boolean;
  }> {
    try {
      // 检查 API Key 是否配置
      if (!this.apiKey) {
        return {
          available: false,
          error: 'DEEPSEEK_API_KEY not configured',
          authenticated: false,
        };
      }

      // 尝试一个简单的 API 调用来验证
      await this.callDeepseekAPI([
        {
          role: 'user',
          content: 'Hello',
        },
      ]);

      return {
        available: true,
        version: 'DeepSeek API v1',
        authenticated: true,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn('DeepSeek API not available', errorMessage);
      return {
        available: false,
        error: errorMessage,
        authenticated: false,
      };
    }
  }
}
