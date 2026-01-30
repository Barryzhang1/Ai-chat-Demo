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
import { InventoryLossService } from './inventory-loss.service';
import {
  CreateInventoryLossDto,
  QueryInventoryLossDto,
} from './dto/inventory-loss.dto';

@ApiTags('inventory-loss')
@Controller('inventory-loss')
export class InventoryLossController {
  constructor(private readonly inventoryLossService: InventoryLossService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建损耗记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误或库存不足' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() createInventoryLossDto: CreateInventoryLossDto,
  ) {
    const userId = req.user.id;
    const data = await this.inventoryLossService.create(
      createInventoryLossDto,
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
  @ApiOperation({ summary: '查询损耗记录列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Query() query: QueryInventoryLossDto) {
    const data = await this.inventoryLossService.findAll(query);
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
  @ApiOperation({ summary: '查询损耗记录详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 400, description: '无效的损耗记录ID' })
  @ApiResponse({ status: 404, description: '损耗记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findOne(@Param('id') id: string) {
    const data = await this.inventoryLossService.findOne(id);
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除损耗记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '无效的损耗记录ID' })
  @ApiResponse({ status: 404, description: '损耗记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async remove(@Param('id') id: string) {
    await this.inventoryLossService.remove(id);
    return {
      code: 0,
      message: '删除成功',
    };
  }
}
