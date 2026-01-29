import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Request,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderingService } from './ordering.service';
import { AiOrderDto } from './dto/ai-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('ordering')
@Controller('ordering')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderingController {
  constructor(private readonly orderingService: OrderingService) {}

  @Post('ai-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI智能点餐' })
  @ApiResponse({
    status: 200,
    description: '推荐成功',
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async aiOrder(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() aiOrderDto: AiOrderDto,
  ) {
    const userId = req.user.id;
    const result = await this.orderingService.aiOrder(userId, aiOrderDto);

    return {
      code: 0,
      message: result.cart.dishes.length > 0 ? '推荐成功' : '响应成功',
      data: result,
    };
  }

  @Post('refresh-menu')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新菜单' })
  @ApiResponse({
    status: 200,
    description: '菜单已刷新',
  })
  @ApiResponse({ status: 400, description: '购物车中没有保存的查询条件' })
  @ApiResponse({ status: 404, description: '购物车不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async refreshMenu(@Request() req: ExpressRequest & { user: { id: string } }) {
    const userId = req.user.id;
    const result = await this.orderingService.refreshMenu(userId);

    return {
      code: 0,
      message: '菜单已刷新',
      data: result,
    };
  }

  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建订单' })
  @ApiResponse({
    status: 201,
    description: '订单创建成功',
  })
  @ApiResponse({ status: 400, description: '购物车为空' })
  @ApiResponse({ status: 404, description: '购物车不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createOrder(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const userId = req.user.id;
    const result = await this.orderingService.createOrder(
      userId,
      createOrderDto,
    );

    return {
      code: 0,
      message: '订单创建成功',
      data: result,
    };
  }

  @Get('cart')
  @ApiOperation({ summary: '获取购物车' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  @ApiResponse({ status: 401, description: '未授权' })
  async getCart(@Request() req: ExpressRequest & { user: { id: string } }) {
    const userId = req.user.id;
    const result = await this.orderingService.getCart(userId);

    return {
      code: 0,
      message: '获取成功',
      data: result,
    };
  }

  @Get('orders')
  @ApiOperation({ summary: '获取订单列表' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码，默认为1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量，默认10条，最大50条',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: '订单状态过滤：pending(待支付)、paid(已支付)、preparing(制作中)、completed(已完成)、cancelled(已取消)',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  @ApiResponse({ status: 401, description: '未授权' })
  async getOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const limitNum = limit ? Math.min(Math.max(1, Number(limit)), 50) : 10;

    const result = await this.orderingService.getOrders(
      pageNum,
      limitNum,
      status,
    );

    return {
      code: 0,
      message: '获取成功',
      data: result,
    };
  }

  @Get('chat-history')
  @ApiOperation({ summary: '获取聊天历史记录' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '返回的消息数量，默认20条，最大100条',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '聊天历史不存在' })
  async getChatHistory(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    const limitNum = limit ? Math.min(Math.max(1, Number(limit)), 100) : 20;

    const result = await this.orderingService.getChatHistoryMessages(
      userId,
      limitNum,
    );

    // 如果没有历史记录，返回空数组或 null，而不是抛出 404 错误
    // 这样前端就不会在控制台看到红色报错

    return {
      code: 0,
      message: '获取成功',
      data: result || [],
    };
  }

  @Patch('orders/:orderId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改订单状态' })
  @ApiParam({
    name: 'orderId',
    description: '订单ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '订单状态修改成功',
  })
  @ApiResponse({ status: 400, description: '无权限修改此订单或请求参数错误' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async updateOrderStatus(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('orderId') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const userId = req.user.id;
    const result = await this.orderingService.updateOrderStatus(
      userId,
      orderId,
      updateOrderStatusDto.status,
    );

    return {
      code: 0,
      message: '订单状态修改成功',
      data: result,
    };
  }
}
