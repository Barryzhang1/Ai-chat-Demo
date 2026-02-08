import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ExtraTransaction,
  ExtraTransactionDocument,
} from './entities/extra-transaction.entity';
import { Order, OrderDocument } from '../ordering/schemas/order.schema';
import { Dish, DishDocument } from '../dish/entities/dish.entity';
import { Inventory, InventoryDocument } from '../inventory/entities/inventory.entity';
import {
  BatchCreateTransactionsDto,
  QueryTransactionsDto,
  TransactionItemDto,
} from './dto/transaction.dto';
import { TransactionType } from './enums/transaction-type.enum';

/**
 * 收入统计服务
 * 负责收入统计和额外收支管理
 * 使用菜品-食材绑定关系计算实际销售成本
 */
@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(
    @InjectModel(ExtraTransaction.name)
    private readonly extraTransactionModel: Model<ExtraTransactionDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Dish.name)
    private readonly dishModel: Model<DishDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  /**
   * 生成交易流水号
   * 格式: TXN + 年月日时分秒 + 3位随机数
   */
  private generateTransactionNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `TXN${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  }

  /**
   * 验证日期不能为未来日期
   */
  private validateTransactionDate(dateStr: string): void {
    const transactionDate = new Date(dateStr);
    const now = new Date();
    now.setHours(23, 59, 59, 999); // 设置为今天结束时间
    
    if (transactionDate > now) {
      throw new BadRequestException('交易日期不能为未来日期');
    }
  }

  /**
   * 计算单个菜品的实际成本
   * 基于菜品绑定的食材和库存价格计算
   */
  private async calculateDishCost(dishId: Types.ObjectId): Promise<number> {
    try {
      // 查询菜品信息
      const dish = await this.dishModel.findById(dishId).exec();
      
      if (!dish || !dish.ingredients || dish.ingredients.length === 0) {
        // 如果菜品未绑定食材，返回0成本
        return 0;
      }

      // 查询所有绑定的食材信息
      const ingredientIds = dish.ingredients.map(id => {
        return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
      }).filter(id => id !== null);

      if (ingredientIds.length === 0) {
        return 0;
      }

      const ingredients = await this.inventoryModel
        .find({
          _id: { $in: ingredientIds },
          deletedAt: null,
        })
        .exec();

      // 计算总成本 = 各食材价格之和
      const totalCost = ingredients.reduce(
        (sum, ingredient) => sum + ingredient.lastPrice,
        0,
      );

      return parseFloat(totalCost.toFixed(2));
    } catch (error) {
      this.logger.warn(
        `⚠️ 计算菜品成本失败 dishId=${dishId}: ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * 计算订单列表的实际总成本
   * 遍历所有订单中的菜品，累加实际成本
   */
  private async calculateOrdersCost(
    orders: OrderDocument[],
  ): Promise<number> {
    let totalCost = 0;

    for (const order of orders) {
      for (const dishItem of order.dishes) {
        const dishCost = await this.calculateDishCost(dishItem.dishId);
        // 成本 = 单个菜品成本 × 数量
        totalCost += dishCost * dishItem.quantity;
      }
    }

    return parseFloat(totalCost.toFixed(2));
  }

  /**
   * 获取指定日期范围的额外收支
   */
  private async getExtraTransactions(
    startDate: Date,
    endDate: Date,
  ): Promise<{ income: number; expense: number }> {
    const transactions = await this.extraTransactionModel
      .find({
        deletedAt: null,
        transactionDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();

    let income = 0;
    let expense = 0;

    transactions.forEach((trans) => {
      if (trans.type === TransactionType.INCOME) {
        income += trans.amount;
      } else {
        expense += trans.amount;
      }
    });

    return {
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
    };
  }

  /**
   * 计算财务指标
   * @param revenue 销售收入
   * @param actualMaterialCost 实际原材料成本（基于菜品-食材绑定关系计算）
   * @param extraIncome 额外收入
   * @param extraExpense 额外支出
   */
  private calculateFinancialMetrics(
    revenue: number,
    actualMaterialCost: number,
    extraIncome: number,
    extraExpense: number,
  ) {
    // 毛利额 = 销售收入 - 销售成本
    const grossProfit = revenue - actualMaterialCost;
    
    // 毛利率 = (毛利额 ÷ 销售收入) × 100%
    const grossMarginRate = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    
    // 总成本 = 原材料成本 + 额外支出
    const totalCost = actualMaterialCost + extraExpense;
    
    // 净利润 = 毛利额 - 额外支出 + 额外收入
    const netProfit = grossProfit - extraExpense + extraIncome;

    return {
      revenue: parseFloat(revenue.toFixed(2)),
      cost: parseFloat(totalCost.toFixed(2)),
      materialCost: parseFloat(actualMaterialCost.toFixed(2)), // 新增：明确显示原材料成本
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      grossMarginRate: parseFloat(grossMarginRate.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      extraIncome: parseFloat(extraIncome.toFixed(2)),
      extraExpense: parseFloat(extraExpense.toFixed(2)),
    };
  }

  /**
   * 获取当日收入统计
   * @param date 查询日期，格式: YYYY-MM-DD，不传则为当天
   */
  async getTodayStats(date?: string) {
    let targetDate: Date;
    
    if (date) {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }

    // 设置查询时间范围：当天 00:00:00 - 23:59:59
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // 获取订单列表和收入
    const orders = await this.orderModel
      .find({
        status: 'completed',
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();

    const revenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const orderCount = orders.length;

    // 计算实际原材料成本
    const actualMaterialCost = await this.calculateOrdersCost(orders);

    // 获取额外收支
    const { income: extraIncome, expense: extraExpense } =
      await this.getExtraTransactions(startDate, endDate);

    // 计算财务指标
    const metrics = this.calculateFinancialMetrics(
      revenue,
      actualMaterialCost,
      extraIncome,
      extraExpense,
    );

    const result = {
      date: startDate.toISOString().split('T')[0],
      ...metrics,
      orderCount,
    };

    this.logger.log(
      `📊 当日收入统计: ${result.date}, 收入=$${result.revenue}, 成本=¥${result.materialCost}, 毛利率=${result.grossMarginRate}%, 净利润=¥${result.netProfit}, 订单=${result.orderCount}`,
    );

    return result;
  }

  /**
   * 获取月度收入统计
   * @param date 查询月份，格式: YYYY-MM，不传则为当月
   */
  async getMonthStats(date?: string) {
    let targetDate: Date;
    
    if (date) {
      // 解析 YYYY-MM 格式
      const [year, month] = date.split('-').map(Number);
      targetDate = new Date(year, month - 1, 1);
    } else {
      targetDate = new Date();
      targetDate.setDate(1); // 设置为当月1号
    }

    // 设置查询时间范围：月初第一天 00:00:00 - 月末最后一天 23:59:59
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0, // 0表示上个月的最后一天
    );
    endDate.setHours(23, 59, 59, 999);

    // 获取订单列表和收入
    const orders = await this.orderModel
      .find({
        status: 'completed',
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();

    const revenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const orderCount = orders.length;

    // 计算实际原材料成本
    const actualMaterialCost = await this.calculateOrdersCost(orders);

    // 获取额外收支
    const { income: extraIncome, expense: extraExpense } =
      await this.getExtraTransactions(startDate, endDate);

    // 计算财务指标
    const metrics = this.calculateFinancialMetrics(
      revenue,
      actualMaterialCost,
      extraIncome,
      extraExpense,
    );

    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');

    const result = {
      month: `${year}-${month}`,
      ...metrics,
      orderCount,
    };

    this.logger.log(
      `📊 月度收入统计: ${result.month}, 收入=¥${result.revenue}, 成本=¥${result.materialCost}, 毛利率=${result.grossMarginRate}%, 净利润=¥${result.netProfit}, 订单=${result.orderCount}`,
    );

    return result;
  }

  /**
   * 获取总体收入统计
   */
  async getTotalStats() {
    // 获取所有已完成订单
    const orders = await this.orderModel
      .find({
        status: 'completed',
      })
      .exec();

    const revenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const orderCount = orders.length;

    // 计算实际原材料成本
    const actualMaterialCost = await this.calculateOrdersCost(orders);

    // 获取所有额外收支
    const { income: extraIncome, expense: extraExpense } =
      await this.getExtraTransactions(new Date(0), new Date());

    // 计算财务指标
    const metrics = this.calculateFinancialMetrics(
      revenue,
      actualMaterialCost,
      extraIncome,
      extraExpense,
    );

    const result = {
      ...metrics,
      orderCount,
    };

    this.logger.log(
      `📊 总体收入统计: 收入=¥${result.revenue}, 成本=¥${result.materialCost}, 毛利率=${result.grossMarginRate}%, 净利润=¥${result.netProfit}, 订单=${result.orderCount}`,
    );

    return result;
  }

  /**
   * 批量创建额外收支记录
   */
  async batchCreateTransactions(
    dto: BatchCreateTransactionsDto,
    userId: string,
  ) {
    const createdTransactions: ExtraTransaction[] = [];

    for (const item of dto.transactions) {
      // 验证日期
      this.validateTransactionDate(item.transactionDate);

      // 生成流水号
      const transactionNo = this.generateTransactionNo();

      // 创建记录
      const transaction = await this.extraTransactionModel.create({
        transactionNo,
        type: item.type,
        amount: item.amount,
        category: item.category,
        description: item.description,
        transactionDate: new Date(item.transactionDate),
        creator: userId,
      });

      createdTransactions.push(transaction);

      this.logger.log(
        `💰 创建收支记录: ${transactionNo}, 类型=${item.type}, 金额=¥${item.amount}`,
      );
    }

    return {
      successCount: createdTransactions.length,
      transactions: createdTransactions,
    };
  }

  /**
   * 查询额外收支列表
   */
  async queryTransactions(dto: QueryTransactionsDto) {
    const {
      type,
      category,
      startDate,
      endDate,
      keyword,
      page = 1,
      pageSize = 20,
    } = dto;

    // 构建查询条件
    const filter: any = { deletedAt: null };

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (startDate && endDate) {
      filter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    } else if (startDate) {
      filter.transactionDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.transactionDate = { $lte: new Date(`${endDate}T23:59:59.999Z`) };
    }

    if (keyword) {
      filter.description = { $regex: keyword, $options: 'i' };
    }

    // 查询总数
    const total = await this.extraTransactionModel.countDocuments(filter);

    // 查询列表
    const list = await this.extraTransactionModel
      .find(filter)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    // 计算统计摘要
    const allTransactions = await this.extraTransactionModel
      .find(filter)
      .exec();

    let totalIncome = 0;
    let totalExpense = 0;

    allTransactions.forEach((trans) => {
      if (trans.type === TransactionType.INCOME) {
        totalIncome += trans.amount;
      } else {
        totalExpense += trans.amount;
      }
    });

    const summary = {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      netAmount: parseFloat((totalIncome - totalExpense).toFixed(2)),
    };

    return {
      list,
      summary,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 删除额外收支记录（软删除）
   */
  async deleteTransaction(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的记录ID');
    }

    const transaction = await this.extraTransactionModel
      .findById(id)
      .exec();

    if (!transaction) {
      throw new NotFoundException('记录不存在');
    }

    if (transaction.deletedAt) {
      throw new BadRequestException('记录已删除');
    }

    // 软删除
    transaction.deletedAt = new Date();
    await transaction.save();

    this.logger.log(
      `🗑️ 删除收支记录: ${transaction.transactionNo}, 类型=${transaction.type}, 金额=¥${transaction.amount}`,
    );
  }
}
