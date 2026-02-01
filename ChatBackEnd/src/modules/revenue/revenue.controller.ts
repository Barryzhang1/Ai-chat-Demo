import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RevenueService } from './revenue.service';
import {
  BatchCreateTransactionsDto,
  QueryTransactionsDto,
} from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { Request as ExpressRequest } from 'express';

/**
 * 收入管理控制器
 * 所有接口仅限 BOSS 角色访问
 */
@ApiTags('revenue')
@Controller('revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BOSS)
@ApiBearerAuth()
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  /**
   * 获取当日收入统计
   */
  @Get('stats/today')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取当日收入统计' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: '查询日期 (YYYY-MM-DD)，默认当天',
    example: '2026-02-01',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    schema: {
      example: {
        code: 0,
        message: '查询成功',
        data: {
          date: '2026-02-01',
          revenue: 3580.0,
          cost: 2706.0,
          grossProfit: 1074.0,
          grossMarginRate: 30.0,
          netProfit: 874.0,
          orderCount: 25,
          extraIncome: 0.0,
          extraExpense: 200.0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getTodayStats(@Query('date') date?: string) {
    const data = await this.revenueService.getTodayStats(date);
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  /**
   * 获取月度收入统计
   */
  @Get('stats/month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取月度收入统计' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: '查询月份 (YYYY-MM)，默认当月',
    example: '2026-02',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    schema: {
      example: {
        code: 0,
        message: '查询成功',
        data: {
          month: '2026-02',
          revenue: 108500.0,
          cost: 82450.0,
          grossProfit: 32550.0,
          grossMarginRate: 30.0,
          netProfit: 26550.0,
          orderCount: 756,
          extraIncome: 500.0,
          extraExpense: 6500.0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getMonthStats(@Query('date') date?: string) {
    const data = await this.revenueService.getMonthStats(date);
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  /**
   * 获取总体收入统计
   */
  @Get('stats/total')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取总体收入统计' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    schema: {
      example: {
        code: 0,
        message: '查询成功',
        data: {
          revenue: 526800.0,
          cost: 397260.0,
          grossProfit: 158040.0,
          grossMarginRate: 30.0,
          netProfit: 132040.0,
          orderCount: 3580,
          extraIncome: 2500.0,
          extraExpense: 28500.0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getTotalStats() {
    const data = await this.revenueService.getTotalStats();
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  /**
   * 批量创建额外收支记录
   */
  @Post('transactions/batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量创建额外收支记录' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    schema: {
      example: {
        code: 0,
        message: '批量创建成功',
        data: {
          successCount: 2,
          transactions: [
            {
              _id: '507f1f77bcf86cd799439011',
              transactionNo: 'TXN20260201001',
              type: 'expense',
              amount: 5000.0,
              category: '房租',
              description: '2月份店铺租金',
              transactionDate: '2026-02-01T00:00:00.000Z',
              creator: 'user-uuid',
              createdAt: '2026-02-01T10:30:00.000Z',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async batchCreateTransactions(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() dto: BatchCreateTransactionsDto,
  ) {
    const userId = req.user.id;
    const data = await this.revenueService.batchCreateTransactions(dto, userId);
    return {
      code: 0,
      message: '批量创建成功',
      data,
    };
  }

  /**
   * 查询额外收支列表
   */
  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询额外收支列表' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    schema: {
      example: {
        code: 0,
        message: '查询成功',
        data: {
          list: [
            {
              _id: '507f1f77bcf86cd799439011',
              transactionNo: 'TXN20260201001',
              type: 'expense',
              amount: 5000.0,
              category: '房租',
              description: '2月份店铺租金',
              transactionDate: '2026-02-01T00:00:00.000Z',
              creator: 'user-uuid',
              createdAt: '2026-02-01T10:30:00.000Z',
              updatedAt: '2026-02-01T10:30:00.000Z',
            },
          ],
          summary: {
            totalIncome: 500.0,
            totalExpense: 12500.0,
            netAmount: -12000.0,
          },
          total: 15,
          page: 1,
          pageSize: 20,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async queryTransactions(@Query() dto: QueryTransactionsDto) {
    const data = await this.revenueService.queryTransactions(dto);
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  /**
   * 删除额外收支记录
   */
  @Delete('transactions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除额外收支记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '无效的记录ID或记录已删除' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async deleteTransaction(@Param('id') id: string) {
    await this.revenueService.deleteTransaction(id);
    return {
      code: 0,
      message: '删除成功',
    };
  }
}
