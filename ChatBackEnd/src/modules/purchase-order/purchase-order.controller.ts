import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { PurchaseOrderService } from './purchase-order.service';
import {
  CreatePurchaseOrderDto,
  ApprovePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  QueryPurchaseOrderDto,
} from './dto/purchase-order.dto';

@ApiTags('purchase-order')
@Controller('purchase-order')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建进货单' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
  ) {
    const userId = req.user.id;
    const data = await this.purchaseOrderService.create(
      createPurchaseOrderDto,
      userId,
    );
    return {
      code: 0,
      message: '创建成功',
      data,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询进货单列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Query() query: QueryPurchaseOrderDto) {
    const data = await this.purchaseOrderService.findAll(query);
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询进货单详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 400, description: '无效的订单ID' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findOne(@Param('id') id: string) {
    const data = await this.purchaseOrderService.findOne(id);
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BOSS)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '审批进货单（仅BOSS）' })
  @ApiResponse({ status: 200, description: '审批成功' })
  @ApiResponse({ status: 400, description: '无效的订单ID或订单状态不允许审批' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足，只有老板可以审批' })
  async approve(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
    @Body() approvePurchaseOrderDto: ApprovePurchaseOrderDto,
  ) {
    const userId = req.user.id;
    const data = await this.purchaseOrderService.approve(
      id,
      approvePurchaseOrderDto,
      userId,
    );
    return {
      code: 0,
      message: '审批成功',
      data,
    };
  }

  @Post(':id/receive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '入库确认' })
  @ApiResponse({ status: 200, description: '入库成功' })
  @ApiResponse({ status: 400, description: '无效的订单ID或订单状态不允许入库' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async receive(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
    @Body() receivePurchaseOrderDto: ReceivePurchaseOrderDto,
  ) {
    const userId = req.user.id;
    const data = await this.purchaseOrderService.receive(
      id,
      receivePurchaseOrderDto,
      userId,
    );
    return {
      code: 0,
      message: '入库成功',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除进货单' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '无效的订单ID' })
  @ApiResponse({ status: 403, description: '已完成的订单不能删除' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async remove(@Param('id') id: string) {
    await this.purchaseOrderService.remove(id);
    return {
      code: 0,
      message: '删除成功',
    };
  }
}
