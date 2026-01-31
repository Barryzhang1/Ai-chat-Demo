import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExecuteCommandDto } from './dto/execute-command.dto';
import { CommandResult } from './entities/command-result.entity';
import { Dish, DishDocument } from '../dish/entities/dish.entity';

@Injectable()
export class DeepseekService {
  private readonly logger = new Logger(DeepseekService.name);
  private apiKey: string | null = null;
  private readonly apiUrl = 'https://api.deepseek.com/chat/completions';

  constructor(
    @InjectModel(Dish.name) private readonly dishModel: Model<DishDocument>,
  ) {
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
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      // 记录详细错误原因
      const errorCause = error.cause ? JSON.stringify(error.cause) : '';
      
      this.logger.error(`DeepSeek API call failed: ${errorMessage} ${errorCause}`);
      throw new BadRequestException(
        `Failed to call DeepSeek API: ${errorMessage}. ${errorCause ? 'Cause: ' + errorCause : ''}`,
      );
    }
  }

  async executeCommand(
    executeCommandDto: ExecuteCommandDto,
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const { command, args, systemPrompt } = executeCommandDto;
    const commandArgs = args || [];

    // 构建提示词
    const prompt = `${command} ${commandArgs.join(' ')}`.trim();
    this.logger.log(`Executing command with DeepSeek: ${prompt}`);

    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompt,
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

  /**
   * 从 DeepSeek 返回的字符串中提取并解析 MongoDB 聚合查询
   */
  private extractAndParseAggregation(output: string): any {
    try {
      // 移除代码块标记
      let cleaned = output
        .replace(/```javascript\n/g, '')
        .replace(/```js\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```/g, '')
        .trim();

      // 提取 aggregate 方法中的数组参数
      const aggregateMatch = cleaned.match(/\.aggregate\(\s*(\[[\s\S]*\])\s*\)/);
      
      if (aggregateMatch && aggregateMatch[1]) {
        // 使用 Function 构造器安全地解析 JavaScript 对象
        const aggregationPipeline = new Function(`return ${aggregateMatch[1]}`)();
        return aggregationPipeline;
      }

      // 如果没有找到 aggregate，尝试直接解析整个内容
      const directArrayMatch = cleaned.match(/^\s*\[[\s\S]*\]\s*$/);
      if (directArrayMatch) {
        return new Function(`return ${cleaned}`)();
      }

      // 如果都失败，返回原始输出
      this.logger.warn('Could not extract aggregation pipeline from output');
      return null;
    } catch (error) {
      this.logger.error(`Failed to parse aggregation: ${error.message}`);
      return null;
    }
  }

  async suggest(prompt: string): Promise<CommandResult> {
    this.logger.log(`Getting suggestion for: ${prompt}`);

    if (!prompt || prompt.trim().length === 0) {
      throw new BadRequestException('Prompt cannot be empty');
    }

    const dbPrompt = '你是一个专业的MongoDB数据库专家和餐厅点菜助手。数据库结构：' +
    'Dish（菜品表）包含字段：name（名称）、price（价格）、categoryId（分类ID）、description（描述）、' +
    'isDelisted（下架状态，false或不存在表示可用）、isSpicy（是否辣，true/false）、hasScallions（是否含葱，true/false）、' +
    'hasCilantro（是否含香菜，true/false）、hasGarlic（是否含蒜，true/false）、cookingTime（烹饪时间）、createdAt和updatedAt（时间戳）。';
    
    const queryPrompt = `
参考查询示例1 - 简单查询（推荐）：
// 示例：4个人，预算300元，不要葱，不要香菜，要辣
db.dishes.aggregate([
  {
    $match: {
      $and: [
        {
          $or: [
            { isDelisted: false },
            { isDelisted: { $exists: false } }
          ]
        },
        {
          $or: [
            { hasScallions: false },
            { hasScallions: { $exists: false } }
          ]
        },
        {
          $or: [
            { hasCilantro: false },
            { hasCilantro: { $exists: false } }
          ]
        },
        { isSpicy: true },
        { price: { $lte: 80 } }  // 控制单价，确保总价不超预算
      ]
    }
  },
  {
    $sample: { size: 6 }  // 根据人数随机抽取
  },
  {
    $project: {
      _id: 1,
      name: 1,
      price: 1,
      description: 1,
      isSpicy: 1,
      hasScallions: 1,
      hasCilantro: 1,
      hasGarlic: 1,
      cookingTime: 1
    }
  }
])

参考查询示例2 - 复杂查询（如需精确控制总价）：
db.dishes.aggregate([
  {
    $match: {
      $and: [
        {
          $or: [
            { isDelisted: false },
            { isDelisted: { $exists: false } }
          ]
        },
        { price: { $lte: 100 } }  // 先过滤价格合理的菜
      ]
    }
  },
  {
    $sort: { price: 1 }  // 按价格升序
  },
  {
    $limit: 15  // 取前15道便宜的菜
  },
  {
    $sample: { size: 8 }  // 随机抽取8道
  }
])
    `;  
    
    const businessPrompt = `
业务规则：
1. 用户会提供以下信息（可能不全）：
   - 人数：根据人数估算菜品数量（1-2人约3-4道菜，3-4人约5-6道菜，5-6人约7-8道菜）
   - 预算：控制单价范围确保总价合理（例如预算300元抽8道菜，单价应≤50元）
   - 是否要葱：不要葱则过滤 hasScallions 为 false 或不存在
   - 是否要蒜：不要蒜则过滤 hasGarlic 为 false 或不存在  
   - 是否要辣：不要辣则过滤 isSpicy 为 false 或不存在；要辣则过滤 isSpicy = true
   - 是否要香菜：不要香菜则过滤 hasCilantro 为 false 或不存在

2. 必须排除下架菜品：isDelisted为false或不存在
3. 使用$match过滤条件（多个条件用$and包裹），$sample随机抽取，$project选择字段
4. ⚠️ 重要：不要使用$group计算总价后再用$match过滤，这样会导致查询结果为空
5. ⚠️ 正确做法：在$match中通过控制price单价范围来控制总预算
6. 只返回MongoDB聚合查询数组，不要任何解释文字
7. 确保语法正确，可直接执行`;

    const userPrompt = `根据用户需求生成MongoDB聚合查询。用户需求：${prompt}`;
    
    
    let resultFromDeepseek = await this.executeCommand({
      command: userPrompt,
      systemPrompt: dbPrompt + queryPrompt + businessPrompt,
      args: [],
    });

    // 最大重试次数
    const maxRetries = 3;
    let retryCount = 0;
    let parsedAggregation = null;

    // 解析输出为 JSON，如果失败则重试
    while (!parsedAggregation && retryCount < maxRetries && resultFromDeepseek.success) {
      parsedAggregation = this.extractAndParseAggregation(resultFromDeepseek.output);
      
      if (!parsedAggregation) {
        retryCount++;
        this.logger.warn(`Failed to parse aggregation, retry ${retryCount}/${maxRetries}`);
        
        // 让 AI 自我检查并修正
        const fixPrompt = `之前生成的查询语句无法解析，请检查语法错误并修正。原始输出：\n${resultFromDeepseek.output}\n\n请直接返回修正后的MongoDB聚合查询语句，格式为一个数组，例如：[{$match: {...}}, {$project: {...}}]`;
        
        resultFromDeepseek = await this.executeCommand({
          command: fixPrompt,
          systemPrompt: dbPrompt + queryPrompt + '要求：返回正确的MongoDB聚合查询语句数组，不要包含任何解释文字。',
          args: [],
        });
      }
    }

    // 如果成功解析，执行查询
    if (parsedAggregation) {
      const maxExecutionRetries = 3;
      let executionRetryCount = 0;
      let querySuccess = false;
      let queryResult = null;
      let lastError = null;

      // 尝试执行查询，如果失败则重试
      while (!querySuccess && executionRetryCount < maxExecutionRetries) {
        try {
          // 执行聚合查询
          this.logger.log(`Executing MongoDB aggregation query (attempt ${executionRetryCount + 1}/${maxExecutionRetries}): ${JSON.stringify(parsedAggregation)}`);
          queryResult = await this.dishModel.aggregate(parsedAggregation).exec();
          querySuccess = true;
          
          this.logger.log(`Query executed successfully, found ${queryResult.length} results`);
        } catch (error) {
          console.log(error)
          executionRetryCount++;
          lastError = error;
          this.logger.error(`Failed to execute aggregation query (attempt ${executionRetryCount}/${maxExecutionRetries}): ${error.message}`);
          
          // 如果还有重试机会，让 AI 修正查询
          if (executionRetryCount < maxExecutionRetries) {
            const errorFixPrompt = `之前生成的MongoDB查询语句执行失败，请根据错误信息修正查询。
            
查询语句：
${JSON.stringify(parsedAggregation, null, 2)}

错误信息：
${error.message}

请分析错误原因并生成修正后的查询语句，只返回修正后的MongoDB聚合查询数组，不要解释。`;

            const fixResult = await this.executeCommand({
              command: errorFixPrompt,
              systemPrompt: dbPrompt + queryPrompt + '要求：根据错误信息修正查询，返回正确的MongoDB聚合查询语句数组。',
              args: [],
            });

            // 尝试解析修正后的查询
            const newParsedAggregation = this.extractAndParseAggregation(fixResult.output);
            if (newParsedAggregation) {
              parsedAggregation = newParsedAggregation;
              this.logger.log('Query corrected by AI, retrying execution...');
            } else {
              this.logger.warn('Failed to parse corrected query from AI');
              break;
            }
          }
        }
      }

      // 设置最终结果
      if (querySuccess && queryResult) {
        resultFromDeepseek.json = {
          query: parsedAggregation,
          result: queryResult,
          resultCount: queryResult.length,
          parseRetryCount: retryCount,
          executionRetryCount,
        };
      } else {
        resultFromDeepseek.json = {
          query: parsedAggregation,
          error: `查询执行失败（已重试${executionRetryCount}次）: ${lastError?.message || 'Unknown error'}`,
          parseRetryCount: retryCount,
          executionRetryCount,
        };
      }
    } else {
      // 达到最大重试次数仍然失败
      this.logger.error('Failed to parse aggregation after maximum retries');
      resultFromDeepseek.json = {
        error: `无法解析查询语句，已重试 ${retryCount} 次`,
        originalOutput: resultFromDeepseek.output,
      };
    }

    return resultFromDeepseek;
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
      console.log(error)
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
