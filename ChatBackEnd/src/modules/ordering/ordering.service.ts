import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { AiOrderDto } from './dto/ai-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { MongoLogger } from '../../common/utils/mongo-logger.util';

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
  preferences?: {
    numberOfPeople?: number;
    tags?: string[];
    excludeTags?: string[];
    limit?: number;
  };
  queries?: Array<{
    tags?: string[];
    excludeTags?: string[];
    limit?: number;
    description?: string;
  }>;
}

interface QueryPreferences {
  numberOfPeople?: number;
  tags?: string[];
  excludeTags?: string[];
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  totalBudget?: number;
}

interface QueryCondition {
  tags?: string[];
  excludeTags?: string[];
  limit?: number;
  description?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Injectable()
export class OrderingService {
  private readonly logger = new Logger(OrderingService.name);
  private readonly deepseekApiKey: string;
  private readonly deepseekApiLog: boolean;
  private readonly deepseekCacheTTL: number;
  private readonly deepseekApiUrl =
    'https://api.deepseek.com/v1/chat/completions';
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

    // 构建系统提示词
    const systemPrompt = this.buildSystemPrompt();

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
      preferences,
      queries,
    } = this.parseAIResponse(aiResponse);

    // 优先使用queries（多条件查询），否则使用preferences（单条件查询）
    let recommendedDishes: DishDocument[] = [];
    if (queries && queries.length > 0) {
      // 使用多查询条件（例如：8个荤菜 + 8个素菜 + 3个主食 + 2个饮料）
      recommendedDishes = await this.queryDishesBatch(queries);

      // 将查询到的菜品直接添加到购物车
      await this.clearCartDishes(userId);

      // 将推荐的菜品添加到购物车，每个菜品数量为1
      const dishesToAdd = recommendedDishes.map((dish) => ({
        name: dish.name,
        quantity: 1,
      }));

      const cart = await this.updateCart(
        userId,
        dishesToAdd,
        preferences,
        queries,
      );

      // 保存聊天历史
      await this.saveChatHistory(userId, message, aiResponse);

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
    } else if (preferences) {
      // 使用单一查询条件（兼容旧逻辑）
      recommendedDishes = await this.queryDishes(preferences);

      // 将查询到的菜品直接添加到购物车
      await this.clearCartDishes(userId);

      // 将推荐的菜品添加到购物车，每个菜品数量为1
      const dishesToAdd = recommendedDishes.map((dish) => ({
        name: dish.name,
        quantity: 1,
      }));

      const cart = await this.updateCart(userId, dishesToAdd, preferences);

      // 保存聊天历史
      await this.saveChatHistory(userId, message, aiResponse);

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

    // 如果用户明确添加/移除菜品（没有偏好设置）
    const cart = await this.updateCart(userId, dishes, preferences);

    // 保存聊天历史
    await this.saveChatHistory(userId, message, aiResponse);

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
    if ((!cart.queries || cart.queries.length === 0) && !cart.preferences) {
      throw new BadRequestException('没有保存的查询条件，请先进行AI点餐');
    }

    let dishes: DishDocument[];

    // 优先使用保存的queries（批量查询条件）
    if (cart.queries && cart.queries.length > 0) {
      this.logger.log('Using saved queries for refresh with random sorting');
      dishes = await this.queryDishesBatchRandom(cart.queries);
    } else {
      // 使用单一偏好设置查询
      const preferences = cart.preferences || { limit: 5 };
      dishes = await this.queryDishesRandom(preferences);
    }

    // 更新购物车
    const dishesToAdd = dishes.map((dish) => ({
      name: dish.name,
      quantity: 1,
    }));

    await this.clearCartDishes(userId);
    const updatedCart = await this.updateCart(
      userId,
      dishesToAdd,
      cart.preferences,
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

    // 清空购物车（包括查询条件和偏好设置）
    cart.dishes = [];
    cart.totalPrice = 0;
    cart.queries = [];
    cart.preferences = undefined;
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
   * 获取订单列表
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
    const userMap = new Map(
      users.map((user) => [user.id, user.nickname])
    );

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
    const messages = chatHistory.messages
      .slice(-limit)
      .map((msg) => ({
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
    userId: string,
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
    this.logger.log(
      `Updating order status: ${orderId}, user: ${userId}, status: ${status}`,
    );

    // 查找订单 (使用MongoDB的_id)
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 验证订单所属用户
    if (order.userId !== userId) {
      throw new BadRequestException('无权限修改此订单');
    }

    // 更新订单状态
    order.status = status;
    await order.save();

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
   * 构建系统提示词
   */
  private buildSystemPrompt(): string {
    return `你是一个智能点餐助手。你的任务是帮助用户点餐并管理购物车。

数据库中的菜品标签分类：
- 菜系分类："凉菜"、"热菜"、"汤"、"主食"、"饮料"
- 食材分类："素食"、"猪肉"、"牛肉"、"羊肉"、"鸡肉"、"鸭肉"、"鱼"、"海鲜"
- 口味分类："辣"、"特辣"、"不辣"、"甜口"
- 其他："性价比"、"儿童"、"爸妈"、"带领导"、"相亲"、"清真"、"健康"、"经典"、"热门"等

价格限定：
- 当用户提到预算（如"预算500"、"人均100"、"每个菜不超过50"）时，需要计算价格范围
- totalBudget: 总预算（会自动分配到每道菜）
- minPrice/maxPrice: 单个菜品的价格范围

用户可以：
1. 询问菜品信息
2. 表达就餐偏好（例如："我们3个人，想吃点辣的，不吃海鲜"）
3. 表达多样化需求（例如："我们7个人，给我来八荤八素，三个主食，两个饮料"）
4. 明确添加/调整特定菜品（例如："再加2个宫保鸡丁"、"去掉鱼香肉丝"）

重要：当用户要求多种类菜品时（如"八荤八素三个主食"），需要使用queries数组拆分成多个查询：
- 荤菜 = 带有肉类标签且不含"素食"标签的"热菜"（猪肉、牛肉、羊肉、鸡肉、鸭肉、鱼、海鲜）
- 素菜 = 带有"素食"标签的"热菜"或"凉菜"
- 主食 = 带有"主食"标签
- 饮料 = 带有"饮料"标签

你需要根据用户的输入，返回JSON格式的响应：
{
  "message": "给用户的回复消息",
  "dishes": [],
  "queries": [
    {
      "tags": ["热菜", "猪肉"],
      "excludeTags": ["素食"],
      "limit": 8,
      "description": "荤菜",
      "maxPrice": 60
    },
    {
      "tags": ["素食"],
      "limit": 8,
      "description": "素菜",
      "maxPrice": 40
    },
    {
      "tags": ["主食"],
      "limit": 3,
      "description": "主食",
      "maxPrice": 20
    },
    {
      "tags": ["饮料"],
      "limit": 2,
      "description": "饮料",
      "maxPrice": 15
    }
  ]
}

查询规则：
1. 荤菜查询：tags包含"热菜"和任一肉类标签，excludeTags包含"素食"
2. 素菜查询：tags包含"素食"即可，可以是"热菜"或"凉菜"
3. 主食查询：tags包含"主食"
4. 饮料查询：tags包含"饮料"
5. 如果用户只说"想吃辣的"这种简单需求，可以不用queries，用旧的preferences即可
6. 价格处理：
   - 如果提到总预算（如"预算500"），设置totalBudget字段，系统会自动分配
   - 如果提到单价范围（如"每个菜不超过50"），设置maxPrice字段
   - 如果提到人均（如"人均100"），用人均×人数计算totalBudget

注意：
- 只返回JSON，不要添加任何其他文字
- message字段用中文回复，要友好热情
- 优先使用queries数组进行多条件查询（适合"八荤八素"这种需求）
- 简单需求可以用preferences（适合"想吃辣的"这种需求）
- 如果用户只是询问或闲聊：dishes、queries、preferences都为空`;
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
        preferences: parsed.preferences,
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
    this.logger.log('');
    this.logger.log('🔍 Batch Query - ' + queries.length + ' conditions');
    this.logger.log('');

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
      if (
        (queryCondition.minPrice !== undefined &&
          queryCondition.minPrice !== null) ||
        (queryCondition.maxPrice !== undefined &&
          queryCondition.maxPrice !== null)
      ) {
        query.price = {} as { $gte?: number; $lte?: number };
        if (
          queryCondition.minPrice !== undefined &&
          queryCondition.minPrice !== null
        ) {
          (query.price as { $gte?: number; $lte?: number }).$gte =
            queryCondition.minPrice;
        }
        if (
          queryCondition.maxPrice !== undefined &&
          queryCondition.maxPrice !== null
        ) {
          (query.price as { $gte?: number; $lte?: number }).$lte =
            queryCondition.maxPrice;
        }
      }

      const limit = queryCondition.limit || 5;

      MongoLogger.logQuery(
        'dishes',
        query,
        { limit, sort: { createdAt: -1 } },
        queryCondition.description || 'unknown',
      );

      const startTime = Date.now();
      const dishes = await this.dishModel
        .find(query)
        .limit(limit)
        .sort({ createdAt: -1 })
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

    this.logger.log('');
    this.logger.log('╔════════════════════════════════════════════════════╗');
    this.logger.log('║      ✅ BATCH QUERY COMPLETE                      ║');
    this.logger.log('╚════════════════════════════════════════════════════╝');
    this.logger.log(
      '📊 Total unique dishes: ' +
        allDishes.length +
        ' | Dish IDs: ' +
        Array.from(dishIds).slice(0, 5).join(', ') +
        (dishIds.size > 5 ? ' ...' : ''),
    );
    if (allDishes.length > 0) {
      this.logger.log(
        '📋 All dishes: ' + allDishes.map((d) => d.name).join(', '),
      );
    }
    this.logger.log('');

    return allDishes;
  }

  /**
   * 查询菜品（单条件）
   */
  private async queryDishes(
    preferences: QueryPreferences,
  ): Promise<DishDocument[]> {
    const query: Record<string, unknown> = { isDelisted: false };

    // 处理标签（同时处理包含和排除）
    if (preferences.tags && preferences.tags.length > 0) {
      if (preferences.excludeTags && preferences.excludeTags.length > 0) {
        // 同时有包含和排除标签
        query.tags = {
          $in: preferences.tags,
          $nin: preferences.excludeTags,
        };
      } else {
        // 只有包含标签
        query.tags = { $in: preferences.tags };
      }
    } else if (preferences.excludeTags && preferences.excludeTags.length > 0) {
      // 只有排除标签
      query.tags = { $nin: preferences.excludeTags };
    }

    // 处理价格范围
    if (
      (preferences.minPrice !== undefined && preferences.minPrice !== null) ||
      (preferences.maxPrice !== undefined && preferences.maxPrice !== null)
    ) {
      query.price = {} as { $gte?: number; $lte?: number };
      if (preferences.minPrice !== undefined && preferences.minPrice !== null) {
        (query.price as { $gte?: number; $lte?: number }).$gte =
          preferences.minPrice;
      }
      if (preferences.maxPrice !== undefined && preferences.maxPrice !== null) {
        (query.price as { $gte?: number; $lte?: number }).$lte =
          preferences.maxPrice;
      }
    }

    const limit = preferences.limit || 5;

    MongoLogger.logQuery(
      'dishes',
      query,
      { limit, sort: { createdAt: -1 } },
      'Single Query',
    );

    const startTime = Date.now();
    const dishes = await this.dishModel
      .find(query)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    const queryTime = Date.now() - startTime;

    MongoLogger.logResult(
      dishes.length,
      queryTime,
      dishes.map((d) => d.name),
    );

    return dishes;
  }

  /**
   * 查询菜品（单条件，随机排序）- 用于刷新菜单
   */
  private async queryDishesRandom(
    preferences: QueryPreferences,
  ): Promise<DishDocument[]> {
    const query: Record<string, unknown> = { isDelisted: false };

    // 处理标签（同时处理包含和排除）
    if (preferences.tags && preferences.tags.length > 0) {
      if (preferences.excludeTags && preferences.excludeTags.length > 0) {
        query.tags = {
          $in: preferences.tags,
          $nin: preferences.excludeTags,
        };
      } else {
        query.tags = { $in: preferences.tags };
      }
    } else if (preferences.excludeTags && preferences.excludeTags.length > 0) {
      query.tags = { $nin: preferences.excludeTags };
    }

    // 处理价格范围
    if (
      (preferences.minPrice !== undefined && preferences.minPrice !== null) ||
      (preferences.maxPrice !== undefined && preferences.maxPrice !== null)
    ) {
      query.price = {} as { $gte?: number; $lte?: number };
      if (preferences.minPrice !== undefined && preferences.minPrice !== null) {
        (query.price as { $gte?: number; $lte?: number }).$gte =
          preferences.minPrice;
      }
      if (preferences.maxPrice !== undefined && preferences.maxPrice !== null) {
        (query.price as { $gte?: number; $lte?: number }).$lte =
          preferences.maxPrice;
      }
    }

    const limit = preferences.limit || 5;

    // 使用聚合管道进行随机采样
    const startTime = Date.now();
    const dishes = await this.dishModel
      .aggregate([{ $match: query }, { $sample: { size: limit } }])
      .exec();
    const queryTime = Date.now() - startTime;

    this.logger.log(
      '🎲 Random Query: db.dishes.aggregate([{$match:' +
        JSON.stringify(query) +
        '},{$sample:{size:' +
        limit +
        '}}])',
    );
    MongoLogger.logResult(
      dishes.length,
      queryTime,
      dishes.map((d) => d.name),
    );

    return dishes;
  }

  /**
   * 批量查询菜品（随机排序）- 用于刷新菜单
   */
  private async queryDishesBatchRandom(
    queries: QueryCondition[],
  ): Promise<DishDocument[]> {
    this.logger.log('');
    this.logger.log(
      '🎲 Random Batch Query - ' + queries.length + ' conditions',
    );
    this.logger.log('');

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
      if (
        (queryCondition.minPrice !== undefined &&
          queryCondition.minPrice !== null) ||
        (queryCondition.maxPrice !== undefined &&
          queryCondition.maxPrice !== null)
      ) {
        query.price = {} as { $gte?: number; $lte?: number };
        if (
          queryCondition.minPrice !== undefined &&
          queryCondition.minPrice !== null
        ) {
          (query.price as { $gte?: number; $lte?: number }).$gte =
            queryCondition.minPrice;
        }
        if (
          queryCondition.maxPrice !== undefined &&
          queryCondition.maxPrice !== null
        ) {
          (query.price as { $gte?: number; $lte?: number }).$lte =
            queryCondition.maxPrice;
        }
      }

      const limit = queryCondition.limit || 5;

      const startTime = Date.now();
      const dishes = await this.dishModel
        .aggregate([{ $match: query }, { $sample: { size: limit } }])
        .exec();
      const queryTime = Date.now() - startTime;

      this.logger.log(
        '🎲 [' +
          (queryCondition.description || 'unknown') +
          '] db.dishes.aggregate([{$match:' +
          JSON.stringify(query) +
          '},{$sample:{size:' +
          limit +
          '}}])',
      );
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

    this.logger.log('');
    this.logger.log('╔════════════════════════════════════════════════════╗');
    this.logger.log('║      ✅ RANDOM BATCH QUERY COMPLETE               ║');
    this.logger.log('╚════════════════════════════════════════════════════╝');
    this.logger.log(
      '📊 Total unique dishes: ' + allDishes.length + ' | Random selection',
    );
    if (allDishes.length > 0) {
      this.logger.log(
        '📋 All dishes: ' + allDishes.map((d) => d.name).join(', '),
      );
    }
    this.logger.log('');

    return allDishes;
  }

  /**
   * 更新购物车
   * 如果 dishes 为空数组，则只更新偏好设置，不修改购物车内容
   * 如果 dishes 有内容，则根据数量添加或移除菜品
   */
  private async updateCart(
    userId: string,
    dishes: Array<{ name: string; quantity: number }>,
    preferences?: QueryPreferences,
    queries?: QueryCondition[],
  ): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      // 创建新购物车时必须设置 userId
      cart = await this.cartModel.create({
        userId: userId,
        dishes: [],
        preferences: preferences || {},
        queries: queries || [],
        totalPrice: 0,
      });
    } else {
      // 更新偏好设置和查询条件
      if (preferences) {
        cart.preferences = preferences;
      }
      if (queries) {
        cart.queries = queries;
        this.logger.log(
          'Saved ' + queries.length + ' query conditions to cart',
        );
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
   * 清空购物车中的菜品（但保留偏好设置）
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
    });

    // 只保留最近20条消息
    if (chatHistory.messages.length > 20) {
      chatHistory.messages = chatHistory.messages.slice(-20);
    }

    await chatHistory.save();
  }
}
