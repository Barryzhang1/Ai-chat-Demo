import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Order, OrderDocument } from './schemas/order.schema';
import {
  ChatHistory,
  ChatHistoryDocument,
} from './schemas/chat-history.schema';
import { Dish, DishDocument } from '../dish/entities/dish.entity';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Inventory, InventoryDocument } from '../inventory/entities/inventory.entity';
import { InventoryHistory, InventoryHistoryDocument, InventoryChangeType } from '../inventory/entities/inventory-history.entity';
import { AiOrderDto } from './dto/ai-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { MongoLogger } from '../../common/utils/mongo-logger.util';
import { DishService } from '../dish/dish.service';
import { InventoryService } from '../inventory/inventory.service';

interface CacheEntry {
  response: string;
  timestamp: number;
}

interface ParsedAIResponse {
  message: string;
  dishes: Array<{
    dishId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  queries?: Array<{
    tags?: string[];
    excludeTags?: string[];
    limit?: number;
    description?: string;
  }>;
}

interface QueryCondition {
  tags?: string[];
  excludeTags?: string[];
  limit?: number;
  description?: string;
  minPrice?: number;
  maxPrice?: number;
  totalBudget?: number; // 总预算，会自动分配到每道菜
}

@Injectable()
export class OrderingService {
  private readonly logger = new Logger(OrderingService.name);
  private readonly deepseekApiKey: string;
  private readonly deepseekApiLog: boolean;
  private readonly deepseekCacheTTL: number;
  private readonly deepseekApiUrl =
    'https://api.deepseek.com/chat/completions';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheFilePath = path.join(
    process.cwd(),
    'cache',
    'deepseek-cache.json',
  );

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(ChatHistory.name)
    private chatHistoryModel: Model<ChatHistoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Dish.name) private dishModel: Model<DishDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryHistory.name) private inventoryHistoryModel: Model<InventoryHistoryDocument>,
    private readonly dishService: DishService,
    private readonly inventoryService: InventoryService,
  ) {
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY || '';
    this.deepseekApiLog = process.env.DEEPSEEK_API_LOG === 'true';
    this.deepseekCacheTTL = parseInt(
      process.env.DEEPSEEK_CACHE_TTL || '3600',
      10,
    );
    if (!this.deepseekApiKey) {
      this.logger.warn('DEEPSEEK_API_KEY not configured');
    }
    if (this.deepseekCacheTTL > 0) {
      this.logger.log(
        'DeepSeek API cache enabled, TTL: ' + this.deepseekCacheTTL + 's',
      );
      // 加载缓存文件
      this.loadCacheFromFile();
    }
  }

  /**
   * 获取数据库中所有可用的 tags（去重）
   */
  private async getAllAvailableTags(): Promise<string[]> {
    try {
      const dishes = await this.dishModel
        .find({ isDelisted: false })
        .select('tags')
        .exec();

      const allTags = new Set<string>();
      dishes.forEach((dish) => {
        if (dish.tags && Array.isArray(dish.tags)) {
          dish.tags.forEach((tag) => allTags.add(tag));
        }
      });

      return Array.from(allTags).sort();
    } catch (error) {
      this.logger.error('Failed to get available tags: ' + String(error));
      return [];
    }
  }

  /**
   * AI智能点餐
   */
  async aiOrder(
    userId: string,
    aiOrderDto: AiOrderDto,
  ): Promise<{
    message: string;
    cart: {
      dishes: Array<{
        dishId: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      totalPrice: number;
    };
  }> {
    const { message } = aiOrderDto;
    this.logger.log('AI ordering request from user: ' + userId);

    // 获取聊天历史
    const history = await this.getChatHistory(userId);

    // 构建系统提示词（异步获取数据库tags）
    const systemPrompt = await this.buildSystemPrompt();

    // 调用DeepSeek API
    const aiResponse = await this.callDeepSeekAPI(
      systemPrompt,
      message,
      history,
      userId,
    );

    // 解析AI响应
    const {
      message: responseMessage,
      dishes,
      queries,
    } = this.parseAIResponse(aiResponse);

    // 如果有 queries，执行批量查询
    if (queries && queries.length > 0) {
      // 使用多查询条件（例如：8个荤菜 + 8个素菜 + 3个主食 + 2个饮料）
      const recommendedDishes = await this.queryDishesBatch(queries);

      // 将查询到的菜品直接添加到购物车
      await this.clearCartDishes(userId);

      // 将推荐的菜品添加到购物车，每个菜品数量为1
      const dishesToAdd = recommendedDishes.map((dish) => ({
        name: dish.name,
        quantity: 1,
      }));

      const cart = await this.updateCart(userId, dishesToAdd, queries);

      // 保存聊天历史（包含购物车数据）
      await this.saveChatHistory(userId, message, aiResponse, {
        dishes: cart.dishes.map((item) => ({
          dishId: item.dishId.toString(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice: cart.totalPrice,
      });

      return {
        message: responseMessage,
        cart: {
          dishes: cart.dishes.map((item) => ({
            dishId: item.dishId.toString(),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          totalPrice: cart.totalPrice,
        },
      };
    }

    // 如果用户明确添加/移除菜品
    const cart = await this.updateCart(userId, dishes, queries);

    // 保存聊天历史（包含购物车数据）
    await this.saveChatHistory(userId, message, aiResponse, {
      dishes: cart.dishes.map((item) => ({
        dishId: item.dishId.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: cart.totalPrice,
    });

    return {
      message: responseMessage,
      cart: {
        dishes: cart.dishes.map((item) => ({
          dishId: item.dishId.toString(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice: cart.totalPrice,
      },
    };
  }

  /**
   * 刷新菜单
   */
  async refreshMenu(userId: string): Promise<{
    message: string;
    cart: {
      dishes: Array<{
        dishId: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      totalPrice: number;
    };
  }> {
    this.logger.log('Refreshing menu for user: ' + userId);

    // 获取购物车中的偏好设置和查询条件
    const cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      throw new NotFoundException('购物车不存在，请先进行AI点餐');
    }

    // 检查是否有保存的查询条件
    if (!cart.queries || cart.queries.length === 0) {
      throw new BadRequestException('没有保存的查询条件，请先进行AI点餐');
    }

    // 使用保存的queries（批量查询条件）
    this.logger.log('Using saved queries for refresh with random sorting');
    const dishes = await this.queryDishesBatchRandom(cart.queries);

    // 更新购物车
    const dishesToAdd = dishes.map((dish) => ({
      name: dish.name,
      quantity: 1,
    }));

    await this.clearCartDishes(userId);
    const updatedCart = await this.updateCart(
      userId,
      dishesToAdd,
      cart.queries,
    );

    return {
      message: '菜单已刷新',
      cart: {
        dishes: updatedCart.dishes.map((item) => ({
          dishId: item.dishId.toString(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice: updatedCart.totalPrice,
      },
    };
  }

  /**
   * 创建订单
   */
  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<{
    orderId: string;
    dishes: Array<{
      dishId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalPrice: number;
    status: string;
    note?: string;
  }> {
    this.logger.log('Creating order for user: ' + userId);

    // 获取购物车
    const cart = await this.cartModel.findOne({ userId }).exec();
    if (!cart || cart.dishes.length === 0) {
      throw new BadRequestException('购物车为空，无法创建订单');
    }

    // 创建订单
    const orderId = uuidv4();
    const order = await this.orderModel.create({
      orderId: orderId,
      userId: userId,
      dishes: cart.dishes,
      totalPrice: cart.totalPrice,
      status: 'pending',
      note: createOrderDto.note,
    });

    // 清空购物车（包括查询条件）
    cart.dishes = [];
    cart.totalPrice = 0;
    cart.queries = [];
    await cart.save();

    return {
      orderId: order.orderId,
      dishes: order.dishes.map((item) => ({
        dishId: item.dishId.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: order.totalPrice,
      status: order.status,
      note: order.note,
    };
  }

  /**
   * 获取购物车
   */
  async getCart(userId: string): Promise<{
    dishes: Array<{
      dishId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalPrice: number;
  }> {
    this.logger.log('Getting cart for user: ' + userId);

    let cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      // 如果购物车不存在，创建一个空购物车
      cart = await this.cartModel.create({
        userId: userId,
        dishes: [],
        totalPrice: 0,
      });
    }

    return {
      dishes: cart.dishes.map((item) => ({
        dishId: item.dishId.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: cart.totalPrice,
    };
  }

  /**
   * 编辑购物车（更新菜品数量）
   */
  async updateCartDishes(
    userId: string,
    dishes: Array<{ dishId: string; quantity: number }>,
  ): Promise<{
    dishes: Array<{
      dishId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalPrice: number;
  }> {
    this.logger.log('Updating cart for user: ' + userId);

    // 获取或创建购物车
    let cart = await this.cartModel.findOne({ userId }).exec();
    if (!cart) {
      cart = await this.cartModel.create({
        userId: userId,
        dishes: [],
        totalPrice: 0,
      });
    }

    // 更新购物车中的菜品
    for (const dishUpdate of dishes) {
      const dishDoc = await this.dishModel
        .findById(dishUpdate.dishId)
        .exec();

      if (!dishDoc) {
        this.logger.warn('Dish not found: ' + dishUpdate.dishId);
        continue;
      }

      const existingItemIndex = cart.dishes.findIndex(
        (item) => item.dishId.toString() === dishUpdate.dishId,
      );

      if (dishUpdate.quantity > 0) {
        // 添加或更新数量
        if (existingItemIndex >= 0) {
          cart.dishes[existingItemIndex].quantity = dishUpdate.quantity;
        } else {
          cart.dishes.push({
            dishId: dishDoc._id,
            name: dishDoc.name,
            price: dishDoc.price,
            quantity: dishUpdate.quantity,
          });
        }
      } else {
        // 数量为0，移除该菜品
        if (existingItemIndex >= 0) {
          cart.dishes.splice(existingItemIndex, 1);
        }
      }
    }

    // 重新计算总价
    cart.totalPrice = cart.dishes.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    await cart.save();

    return {
      dishes: cart.dishes.map((item) => ({
        dishId: item.dishId.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: cart.totalPrice,
    };
  }

  /**
   * 清空购物车和聊天历史
   */
  async clearCartAndChatHistory(userId: string): Promise<void> {
    this.logger.log('Clearing cart and chat history for user: ' + userId);

    // 使用 updateOne 清空购物车，避免版本冲突
    await this.cartModel
      .updateOne(
        { userId },
        {
          $set: {
            dishes: [],
            totalPrice: 0,
            queries: [],
          },
        },
      )
      .exec();
    this.logger.log('Cart cleared for user: ' + userId);

    // 使用 updateOne 清空聊天历史，避免版本冲突
    await this.chatHistoryModel
      .updateOne(
        { userId },
        {
          $set: {
            messages: [],
          },
        },
      )
      .exec();
    this.logger.log('Chat history cleared for user: ' + userId);
  }

  /**
   * 获取当前用户的订单列表
   */
  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<{
    orders: Array<any>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Getting orders for user ${userId}, page: ${page}, limit: ${limit}, status: ${status || 'all'}`,
    );

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    // 查询订单总数
    const total = await this.orderModel.countDocuments(query).exec();

    // 查询订单列表，按创建时间倒序
    const orders = await this.orderModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPages = Math.ceil(total / limit);

    return {
      orders: orders.map((order) => ({
        _id: order._id,
        userId: order.userId,
        dishes: order.dishes,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * 获取订单列表（全局，用于商家后台）
   */
  async getOrders(
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<{
    orders: Array<any>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Getting all orders, page: ${page}, limit: ${limit}, status: ${status || 'all'}`,
    );

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    // 查询订单总数
    const total = await this.orderModel.countDocuments(query).exec();

    // 查询订单列表，按创建时间倒序
    const orders = await this.orderModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // 获取所有唯一的 userId
    const userIds = [...new Set(orders.map((order) => order.userId))];

    // 批量查询用户信息
    const users = await this.userModel
      .find({ id: { $in: userIds } })
      .select('id nickname')
      .exec();

    // 创建 userId 到 nickname 的映射
    const userMap = new Map(users.map((user) => [user.id, user.nickname]));

    const totalPages = Math.ceil(total / limit);

    return {
      orders: orders.map((order) => ({
        _id: order._id,
        userId: order.userId,
        userName: userMap.get(order.userId) || '未知用户',
        dishes: order.dishes,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * 获取聊天历史记录（公开方法）
   */
  async getChatHistoryMessages(
    userId: string,
    limit: number = 20,
  ): Promise<{
    messages: Array<{
      role: string;
      content: string;
      timestamp: Date;
    }>;
    total: number;
  } | null> {
    this.logger.log(
      'Getting chat history for user: ' + userId + ', limit: ' + limit,
    );

    const chatHistory = await this.chatHistoryModel.findOne({ userId }).exec();

    if (!chatHistory || !chatHistory.messages) {
      return null;
    }

    const total = chatHistory.messages.length;
    // 按时间正序返回（最旧的在前）
    const messages = chatHistory.messages.slice(-limit).map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    return {
      messages,
      total,
    };
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<{
    orderId: string;
    userId: string;
    status: string;
    dishes: Array<{
      dishId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalPrice: number;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    this.logger.log(`🔵 Updating order status: ${orderId}, new status: "${status}" (type: ${typeof status})`);

    // 查找订单 (使用MongoDB的_id)
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    this.logger.log(`🔵 Order found: ${order.orderId}, current status: "${order.status}"`);

    // 记录旧状态，用于判断是否首次接单
    const oldStatus = order.status;

    // 更新订单状态
    order.status = status;
    await order.save();

    this.logger.log(`🔵 Order status updated from "${oldStatus}" to "${status}"`);

    // 如果订单状态从pending变为confirmed或preparing，说明是首次接单，需要扣减库存
    const shouldDeductInventory = 
      oldStatus === 'pending' && 
      (status === 'confirmed' || status === 'preparing');

    if (shouldDeductInventory) {
      this.logger.log(`✅ Order accepted (${oldStatus} → ${status}), deducting inventory for order: ${orderId}`);
      await this.deductInventoryForOrder(order);
    } else {
      this.logger.log(`⚠️  Not deducting inventory. Old status: "${oldStatus}", New status: "${status}"`);
    }

    return {
      orderId: order.orderId,
      userId: order.userId,
      status: order.status,
      dishes: order.dishes.map((item) => ({
        dishId: item.dishId.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: order.totalPrice,
      note: order.note,
      createdAt: order.createdAt || new Date(),
      updatedAt: order.updatedAt || new Date(),
    };
  }

  /**
   * 扣减订单中菜品所需的食材库存
   */
  private async deductInventoryForOrder(order: OrderDocument): Promise<void> {
    this.logger.log(`Starting inventory deduction for order: ${order.orderId}`);
    this.logger.log(`Order status: ${order.status}, Order dishes count: ${order.dishes.length}`);
    
    // 用于跟踪所有涉及的菜品ID（用于后续检查是否需要下架）
    const affectedDishIds = new Set<string>();

    // 遍历订单中的所有菜品
    for (const orderDish of order.dishes) {
      const dishId = orderDish.dishId.toString();
      const quantity = orderDish.quantity;
      
      this.logger.log(`Processing dish: ${orderDish.name} (ID: ${dishId}), quantity: ${quantity}`);
      
      try {
        // 获取菜品信息（包括绑定的食材）
        const dish = await this.dishModel.findById(dishId).exec();
        
        if (!dish) {
          this.logger.warn(`Dish not found: ${dishId}, skipping inventory deduction`);
          continue;
        }

        // 如果菜品没有绑定食材，跳过
        if (!dish.ingredients || dish.ingredients.length === 0) {
          this.logger.log(`Dish ${dish.name} has no ingredients bound, skipping`);
          continue;
        }

        this.logger.log(`Dish ${dish.name} has ${dish.ingredients.length} ingredients bound: ${JSON.stringify(dish.ingredients)}`);
        
        // 扣减该菜品绑定的每个食材库存
        for (const ingredientId of dish.ingredients) {
          try {
            this.logger.log(`Looking for ingredient: ${ingredientId}`);
            const inventory = await this.inventoryModel.findById(ingredientId).exec();
            
            if (!inventory) {
              this.logger.warn(`Ingredient not found: ${ingredientId}, skipping`);
              continue;
            }

            const quantityBefore = inventory.quantity;
            
            // 计算扣减后的数量（扣减数量 = 菜品数量 × 每份需要的食材数量，这里默认每份用1个）
            const deductAmount = quantity * 1; // 每份菜品消耗1个食材
            const quantityAfter = Math.max(0, quantityBefore - deductAmount);
            
            // 更新库存
            inventory.quantity = quantityAfter;
            await inventory.save();
            
            this.logger.log(
              `✅ Deducted ingredient: ${inventory.productName}, ` +
              `before: ${quantityBefore}, deducted: ${deductAmount}, after: ${quantityAfter}`
            );

            // 记录库存消耗历史
            try {
              await this.inventoryHistoryModel.create({
                inventoryId: inventory._id,
                productName: inventory.productName,
                changeType: InventoryChangeType.ORDER_CONSUME,
                changeQuantity: -deductAmount, // 负数表示扣减
                price: inventory.lastPrice,
                quantityBefore: quantityBefore,
                quantityAfter: quantityAfter,
                relatedOrderId: order._id,
                relatedOrderNo: order.orderId,
                reason: `订单消耗 - 菜品: ${dish.name}`,
                operator: order.userId,
              });
              this.logger.log(`✅ Created inventory history record for ${inventory.productName}`);
            } catch (historyError) {
              this.logger.error(
                `Failed to create inventory history for ${inventory.productName}: ${historyError.message}`,
                historyError.stack
              );
            }

            // 记录该菜品受影响（需要检查是否下架）
            affectedDishIds.add(dishId);
            
          } catch (error) {
            this.logger.error(
              `Failed to deduct ingredient ${ingredientId}: ${error.message}`,
              error.stack
            );
            // 继续处理下一个食材，不中断流程
          }
        }
        
      } catch (error) {
        this.logger.error(
          `Failed to process dish ${dishId}: ${error.message}`,
          error.stack
        );
        // 继续处理下一个菜品
      }
    }

    // 检查所有受影响的菜品，如果有食材库存为0，则自动下架
    if (affectedDishIds.size > 0) {
      this.logger.log(`Checking ${affectedDishIds.size} affected dishes for auto-delisting`);
      await this.checkAndDelistDishes(Array.from(affectedDishIds));
    }
    
    this.logger.log(`Inventory deduction completed for order: ${order.orderId}`);
  }

  /**
   * 检查菜品的食材库存，如果有任意食材为0则自动下架
   */
  private async checkAndDelistDishes(dishIds: string[]): Promise<void> {
    for (const dishId of dishIds) {
      try {
        const dish = await this.dishModel.findById(dishId).exec();
        
        if (!dish) {
          this.logger.warn(`Dish not found when checking: ${dishId}`);
          continue;
        }

        // 如果菜品已经下架，跳过
        if (dish.isDelisted) {
          this.logger.log(`Dish ${dish.name} is already delisted, skipping`);
          continue;
        }

        // 如果没有绑定食材，不需要检查
        if (!dish.ingredients || dish.ingredients.length === 0) {
          continue;
        }

        // 检查所有绑定的食材
        let shouldDelist = false;
        const outOfStockIngredients: string[] = [];

        for (const ingredientId of dish.ingredients) {
          try {
            const inventory = await this.inventoryModel.findById(ingredientId).exec();
            
            if (!inventory) {
              this.logger.warn(`Ingredient ${ingredientId} not found when checking dish ${dish.name}`);
              continue;
            }

            // 如果任意食材库存为0，标记需要下架
            if (inventory.quantity === 0) {
              shouldDelist = true;
              outOfStockIngredients.push(inventory.productName);
            }
          } catch (error) {
            this.logger.error(
              `Failed to check ingredient ${ingredientId} for dish ${dish.name}: ${error.message}`
            );
          }
        }

        // 如果需要下架，更新菜品状态
        if (shouldDelist) {
          dish.isDelisted = true;
          await dish.save();
          
          this.logger.log(
            `Auto-delisted dish: ${dish.name} (ID: ${dishId}), ` +
            `reason: ingredients out of stock [${outOfStockIngredients.join(', ')}]`
          );
        } else {
          this.logger.log(`Dish ${dish.name} still has sufficient ingredients, keeping available`);
        }
        
      } catch (error) {
        this.logger.error(
          `Failed to check and delist dish ${dishId}: ${error.message}`,
          error.stack
        );
      }
    }
  }

  /**
   * 构建系统提示词（异步，基于数据库实际数据）
   */
  private async buildSystemPrompt(): Promise<string> {
    // 从数据库获取所有可用的 tags
    const availableTags = await this.getAllAvailableTags();

    return `你是智能点餐助手，将用户需求精准转化为数据库查询。

【可用标签】${availableTags.map((tag) => `"${tag}"`).join('、')}

【用户意图识别】
- 数量："八荤八素" → limit
- 预算："预算800"/"人均100" → totalBudget 或 maxPrice
- 食材："不吃辣"/"想吃鱼" → tags/excludeTags
- 添加："再来宫保鸡丁" → dishes (quantity>0)
- 删除："米饭不要了" → dishes (quantity<0)

【查询规则】
荤菜：{"tags":["猪肉"],"excludeTags":["素食"],"limit":8}
素菜：{"tags":["素食"],"limit":8}
主食：{"tags":["主食"],"limit":3}
饮料：{"tags":["饮料"],"limit":2}

【价格】
- 总预算 → totalBudget（设置在第一个query，系统按总菜品数分配）
- 单价 → maxPrice
- 人均×人数 → totalBudget

【重要】
- 只用上述可用标签，无此标签需告诉用户暂时没有此菜品
- 所有查询用queries数组，明确菜品用dishes
- totalBudget只在第一个query设置，后续不设置

【响应格式】纯JSON：
{
  "message":"友好回复",
  "dishes":[{"name":"宫保鸡丁","quantity":2}],
  "queries":[
    {"tags":["猪肉"],"excludeTags":["素食"],"limit":8,"totalBudget":500,"description":"荤菜"},
    {"tags":["素食"],"limit":8,"description":"素菜"},
    {"tags":["主食"],"limit":3,"description":"主食"}
  ]
}`;
  }

  /**
   * 调用DeepSeek API
   */
  private async callDeepSeekAPI(
    systemPrompt: string,
    userMessage: string,
    history: Array<{ role: string; content: string }>,
    userId: string,
  ): Promise<string> {
    if (!this.deepseekApiKey) {
      throw new BadRequestException('DeepSeek API未配置');
    }

    // 检查缓存（包含history以确保对话上下文准确）
    const cacheKey = this.generateCacheKey(systemPrompt, userMessage, history);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log('Using cached response for user: ' + userId);
      return cached;
    }

    // 构建消息列表
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];

    if (this.deepseekApiLog) {
      this.logger.debug('DeepSeek API Request:');
      this.logger.debug(JSON.stringify(messages, null, 2));
    }

    try {
      const response = await fetch(this.deepseekApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.deepseekApiKey,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          'DeepSeek API error: ' + response.status + ' ' + response.statusText,
        );
        this.logger.error('Error details: ' + errorText);
        throw new BadRequestException('AI服务调用失败: ' + response.statusText);
      }

      const data = await response.json();

      if (this.deepseekApiLog) {
        this.logger.debug('DeepSeek API Response:');
        this.logger.debug(JSON.stringify(data, null, 2));
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('AI服务返回数据格式错误');
      }

      // 保存到缓存
      this.saveToCache(cacheKey, content);

      return content;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to call DeepSeek API: ' + String(error));
      throw new BadRequestException('AI服务调用失败，请稍后重试');
    }
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(content: string): ParsedAIResponse {
    try {
      // 尝试提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        message: parsed.message || '好的，已为您处理',
        dishes: Array.isArray(parsed.dishes) ? parsed.dishes : [],
        queries: Array.isArray(parsed.queries) ? parsed.queries : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to parse AI response: ' + String(error));
      this.logger.error('Response content: ' + content);
      // 返回默认响应
      return {
        message: '抱歉，我没有理解您的需求，请重新描述',
        dishes: [],
      };
    }
  }

  /**
   * 批量查询菜品（支持多条件合并）
   */
  private async queryDishesBatch(
    queries: QueryCondition[],
  ): Promise<DishDocument[]> {
    // 提取总预算（只从第一个query提取）
    const totalBudget = queries[0]?.totalBudget;
    const totalDishCount = queries.reduce((sum, q) => sum + (q.limit || 0), 0);

    const allDishes: DishDocument[] = [];
    const dishIds = new Set<string>(); // 用于去重

    // 依次执行每个查询条件
    for (const queryCondition of queries) {
      const query: Record<string, unknown> = { isDelisted: false };

      // 处理标签（同时处理包含和排除）
      if (queryCondition.tags && queryCondition.tags.length > 0) {
        if (
          queryCondition.excludeTags &&
          queryCondition.excludeTags.length > 0
        ) {
          // 同时有包含和排除标签
          query.tags = {
            $in: queryCondition.tags,
            $nin: queryCondition.excludeTags,
          };
        } else {
          // 只有包含标签
          query.tags = { $in: queryCondition.tags };
        }
      } else if (
        queryCondition.excludeTags &&
        queryCondition.excludeTags.length > 0
      ) {
        // 只有排除标签
        query.tags = { $nin: queryCondition.excludeTags };
      }

      // 处理价格范围
      let calculatedMaxPrice: number | undefined;

      // 如果有总预算，按总菜品数计算每道菜的平均价格上限
      if (totalBudget && totalDishCount > 0) {
        calculatedMaxPrice = Math.floor(totalBudget / totalDishCount);
      }

      // 使用计算出的价格或手动设置的价格
      const effectiveMaxPrice = calculatedMaxPrice ?? queryCondition.maxPrice;

      if (
        (queryCondition.minPrice !== undefined &&
          queryCondition.minPrice !== null) ||
        (effectiveMaxPrice !== undefined && effectiveMaxPrice !== null)
      ) {
        query.price = {} as { $gte?: number; $lte?: number };
        if (
          queryCondition.minPrice !== undefined &&
          queryCondition.minPrice !== null
        ) {
          (query.price as { $gte?: number; $lte?: number }).$gte =
            queryCondition.minPrice;
        }
        if (effectiveMaxPrice !== undefined && effectiveMaxPrice !== null) {
          (query.price as { $gte?: number; $lte?: number }).$lte =
            effectiveMaxPrice;
        }
      }

      const limit = queryCondition.limit || 5;

      // 有预算时按价格降序（接近预算），无预算时按创建时间降序（最新菜品）
      const sortOrder: { price: -1 } | { createdAt: -1 } = totalBudget
        ? { price: -1 }
        : { createdAt: -1 };

      MongoLogger.logQuery(
        'dishes',
        query,
        { limit, sort: sortOrder },
        queryCondition.description || 'unknown',
      );

      const startTime = Date.now();
      const dishes = await this.dishModel
        .find(query)
        .limit(limit)
        .sort(sortOrder as any)
        .exec();
      const queryTime = Date.now() - startTime;

      MongoLogger.logResult(
        dishes.length,
        queryTime,
        dishes.map((d) => d.name),
      );

      // 去重并添加到结果集
      for (const dish of dishes) {
        const dishId = dish._id.toString();
        if (!dishIds.has(dishId)) {
          dishIds.add(dishId);
          allDishes.push(dish);
        }
      }
    }

    return allDishes;
  }

  /**
   * 批量查询菜品（随机排序）- 用于刷新菜单
   */
  private async queryDishesBatchRandom(
    queries: QueryCondition[],
  ): Promise<DishDocument[]> {
    // 提取总预算（只从第一个query提取）
    const totalBudget = queries[0]?.totalBudget;
    const totalDishCount = queries.reduce((sum, q) => sum + (q.limit || 0), 0);

    const allDishes: DishDocument[] = [];
    const dishIds = new Set<string>();

    for (const queryCondition of queries) {
      const query: Record<string, unknown> = { isDelisted: false };

      if (queryCondition.tags && queryCondition.tags.length > 0) {
        if (
          queryCondition.excludeTags &&
          queryCondition.excludeTags.length > 0
        ) {
          query.tags = {
            $in: queryCondition.tags,
            $nin: queryCondition.excludeTags,
          };
        } else {
          query.tags = { $in: queryCondition.tags };
        }
      } else if (
        queryCondition.excludeTags &&
        queryCondition.excludeTags.length > 0
      ) {
        query.tags = { $nin: queryCondition.excludeTags };
      }

      // 处理价格范围
      let calculatedMaxPrice: number | undefined;

      // 如果有总预算，按总菜品数计算每道菜的平均价格上限
      if (totalBudget && totalDishCount > 0) {
        calculatedMaxPrice = Math.floor(totalBudget / totalDishCount);
      }

      // 使用计算出的价格或手动设置的价格
      const effectiveMaxPrice = calculatedMaxPrice ?? queryCondition.maxPrice;

      if (
        (queryCondition.minPrice !== undefined &&
          queryCondition.minPrice !== null) ||
        (effectiveMaxPrice !== undefined && effectiveMaxPrice !== null)
      ) {
        query.price = {} as { $gte?: number; $lte?: number };
        if (
          queryCondition.minPrice !== undefined &&
          queryCondition.minPrice !== null
        ) {
          (query.price as { $gte?: number; $lte?: number }).$gte =
            queryCondition.minPrice;
        }
        if (effectiveMaxPrice !== undefined && effectiveMaxPrice !== null) {
          (query.price as { $gte?: number; $lte?: number }).$lte =
            effectiveMaxPrice;
        }
      }

      const limit = queryCondition.limit || 5;

      // 使用 MongoDB 的 $sample 聚合操作实现真正的随机查询
      // $match 先过滤符合条件的菜品（包括价格预算），$sample 再随机抽取
      const startTime = Date.now();
      const dishes = await this.dishModel
        .aggregate([
          { $match: query },
          { $sample: { size: limit } }
        ])
        .exec();
      const queryTime = Date.now() - startTime;

      MongoLogger.logResult(
        dishes.length,
        queryTime,
        dishes.map((d) => d.name),
      );

      for (const dish of dishes) {
        const dishId = dish._id.toString();
        if (!dishIds.has(dishId)) {
          dishIds.add(dishId);
          allDishes.push(dish);
        }
      }
    }

    return allDishes;
  }

  /**
   * 更新购物车
   * 如果 dishes 为空数组，则只更新查询条件，不修改购物车内容
   * 如果 dishes 有内容，则根据数量添加或移除菜品
   */
  private async updateCart(
    userId: string,
    dishes: Array<{ name: string; quantity: number }>,
    queries?: QueryCondition[],
  ): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      // 创建新购物车时必须设置 userId
      cart = await this.cartModel.create({
        userId: userId,
        dishes: [],
        queries: queries || [],
        totalPrice: 0,
      });
    } else {
      // 更新查询条件
      if (queries) {
        cart.queries = queries;
      }
    }

    // 只在有菜品变更时才处理
    if (dishes && dishes.length > 0) {
      // 处理菜品变更
      for (const dishChange of dishes) {
        const dishDoc = await this.dishModel
          .findOne({ name: dishChange.name, isDelisted: false })
          .exec();

        if (!dishDoc) {
          this.logger.warn('Dish not found: ' + dishChange.name);
          continue;
        }

        const existingItemIndex = cart.dishes.findIndex(
          (item) => item.dishId.toString() === dishDoc._id.toString(),
        );

        if (dishChange.quantity > 0) {
          // 添加或增加数量
          if (existingItemIndex >= 0) {
            cart.dishes[existingItemIndex].quantity += dishChange.quantity;
          } else {
            cart.dishes.push({
              dishId: dishDoc._id,
              name: dishDoc.name,
              price: dishDoc.price,
              quantity: dishChange.quantity,
            });
          }
        } else if (dishChange.quantity < 0) {
          // 减少或移除
          if (existingItemIndex >= 0) {
            const newQuantity =
              cart.dishes[existingItemIndex].quantity + dishChange.quantity;
            if (newQuantity <= 0) {
              cart.dishes.splice(existingItemIndex, 1);
            } else {
              cart.dishes[existingItemIndex].quantity = newQuantity;
            }
          }
        }
      }

      // 重新计算总价
      cart.totalPrice = cart.dishes.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    }

    await cart.save();
    return cart;
  }

  /**
   * 清空购物车中的菜品（但保留查询条件）
   */
  private async clearCartDishes(userId: string): Promise<void> {
    const cart = await this.cartModel.findOne({ userId }).exec();
    if (cart) {
      cart.dishes = [];
      cart.totalPrice = 0;
      await cart.save();
    }
  }

  /**
   * 生成缓存键（基于systemPrompt + userMessage + history）
   * 包含history确保对话上下文的准确性
   */
  private generateCacheKey(
    systemPrompt: string,
    userMessage: string,
    history: Array<{ role: string; content: string }>,
  ): string {
    const historyStr = JSON.stringify(history);
    const content = systemPrompt + userMessage + historyStr;
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): string | null {
    if (this.deepseekCacheTTL <= 0) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.deepseekCacheTTL * 1000) {
      return null;
    }

    return cached.response;
  }

  /**
   * 保存到缓存
   */
  private saveToCache(key: string, response: string): void {
    if (this.deepseekCacheTTL <= 0) {
      return;
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // 简单的缓存清理：如果缓存过大，清理旧条目
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, 20);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }

    // 异步保存到文件
    this.saveCacheToFile();
  }

  /**
   * 加载缓存文件
   */
  private loadCacheFromFile(): void {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const data = fs.readFileSync(this.cacheFilePath, 'utf-8');
        const cacheData: Array<[string, CacheEntry]> = JSON.parse(data);

        const now = Date.now();
        let loadedCount = 0;

        // 只加载未过期的缓存
        for (const [key, entry] of cacheData) {
          if (now - entry.timestamp <= this.deepseekCacheTTL * 1000) {
            this.cache.set(key, entry);
            loadedCount++;
          }
        }

        if (loadedCount > 0) {
          this.logger.log('Loaded ' + loadedCount + ' cache entries from file');
        }
      }
    } catch (error) {
      this.logger.error('Failed to load cache from file: ' + String(error));
    }
  }

  /**
   * 保存缓存到文件
   */
  private saveCacheToFile(): void {
    try {
      // 确保缓存目录存在
      const cacheDir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // 将 Map 转换为数组
      const cacheData = Array.from(this.cache.entries());

      // 写入文件
      fs.writeFileSync(
        this.cacheFilePath,
        JSON.stringify(cacheData, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.error('Failed to save cache to file: ' + String(error));
    }
  }

  /**
   * 获取聊天历史（只获取最后一次下单后的消息）
   */
  private async getChatHistory(
    userId: string,
  ): Promise<Array<{ role: string; content: string }>> {
    const chatHistory = await this.chatHistoryModel.findOne({ userId }).exec();

    if (!chatHistory || !chatHistory.messages) {
      return [];
    }

    // 获取用户最后一次下单时间
    const lastOrder = await this.orderModel
      .findOne({ userId })
      .sort({ createdAt: -1 })
      .exec();

    let recentMessages = chatHistory.messages;

    // 如果有下单记录，只取下单时间之后的消息
    if (lastOrder?.createdAt) {
      recentMessages = chatHistory.messages.filter(
        (msg) => msg.timestamp > lastOrder.createdAt!,
      );
    }

    // 只返回最近10条消息
    const limitedMessages = recentMessages.slice(-10);

    return limitedMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * 保存聊天历史
   */
  private async saveChatHistory(
    userId: string,
    userMessage: string,
    assistantMessage: string,
    cart?: {
      dishes: Array<{
        dishId: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      totalPrice: number;
    },
  ): Promise<void> {
    let chatHistory = await this.chatHistoryModel.findOne({ userId }).exec();

    if (!chatHistory) {
      chatHistory = await this.chatHistoryModel.create({
        userId: userId,
        messages: [],
      });
    }

    chatHistory.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    chatHistory.messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date(),
      cart: cart,
    });

    // 只保留最近20条消息
    if (chatHistory.messages.length > 20) {
      chatHistory.messages = chatHistory.messages.slice(-20);
    }

    await chatHistory.save();
  }

  /**
   * 获取今日总收入
   * @param date 查询日期 (YYYY-MM-DD)，不传则查询今日
   */
  async getTodayRevenue(
    date?: string,
  ): Promise<{ date: string; totalRevenue: number; orderCount: number }> {
    // 确定查询日期
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    this.logger.log(
      `Calculating revenue for date: ${targetDate.toISOString().split('T')[0]}, from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`,
    );

    // 查询当天已完成的订单
    const query = {
      status: 'completed',
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };

    MongoLogger.logQuery('orders', query, {}, 'Today Revenue Query');

    const startTime = Date.now();
    const orders = await this.orderModel.find(query).exec();
    const queryTime = Date.now() - startTime;

    // 计算总收入
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0,
    );

    MongoLogger.logResult(orders.length, queryTime, [
      `Total Revenue: ¥${totalRevenue.toFixed(2)}`,
    ]);

    this.logger.log(
      `📊 Revenue Report: Date=${targetDate.toISOString().split('T')[0]}, Orders=${orders.length}, Total=¥${totalRevenue.toFixed(2)}`,
    );

    return {
      date: targetDate.toISOString().split('T')[0],
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      orderCount: orders.length,
    };
  }

  /**
   * 获取菜品排行榜
   * @param limit 返回的菜品数量，默认10
   */
  async getDishRanking(limit: number = 10): Promise<
    Array<{
      dishId: string;
      dishName: string;
      totalQuantity: number;
      totalRevenue: number;
      orderCount: number;
    }>
  > {
    this.logger.log(`Getting dish ranking, limit: ${limit}`);

    // 使用聚合管道统计菜品销量
    const startTime = Date.now();

    const aggregationPipeline: any[] = [
      // 只统计已完成的订单
      { $match: { status: 'completed' } },
      // 展开订单中的菜品数组
      { $unwind: '$dishes' },
      // 按菜品ID分组并统计
      {
        $group: {
          _id: '$dishes.dishId',
          dishName: { $first: '$dishes.name' },
          totalQuantity: { $sum: '$dishes.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$dishes.price', '$dishes.quantity'] },
          },
          orderCount: { $sum: 1 },
        },
      },
      // 按销量降序排序
      { $sort: { totalQuantity: -1 } },
      // 限制返回数量
      { $limit: limit },
    ];

    const result = await this.orderModel.aggregate(aggregationPipeline).exec();
    const queryTime = Date.now() - startTime;

    MongoLogger.logResult(
      result.length,
      queryTime,
      result.map((item) => `${item.dishName} (${item.totalQuantity}份)`),
    );

    return result.map((item) => ({
      dishId: item._id.toString(),
      dishName: item.dishName,
      totalQuantity: item.totalQuantity,
      totalRevenue: parseFloat(item.totalRevenue.toFixed(2)),
      orderCount: item.orderCount,
    }));
  }
}
