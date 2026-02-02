import {
  Controller,
  Get,
  Post,
  Put,
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
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  QueryInventoryDto,
} from './dto/inventory.dto';
import { QueryInventoryHistoryDto } from './dto/inventory-history.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建库存项目' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误或产品已存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    const data = await this.inventoryService.create(createInventoryDto);
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
  @ApiOperation({ summary: '查询库存列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Query() query: QueryInventoryDto) {
    const data = await this.inventoryService.findAll(query);
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  @Get('history/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询库存变更历史' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findHistory(@Query() query: QueryInventoryHistoryDto) {
    const data = await this.inventoryService.findHistory(query);
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  @Get(':id/consume-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询食材消耗记录（订单消耗）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 400, description: '无效的库存ID' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findConsumeHistory(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const data = await this.inventoryService.findConsumeHistory(id, page, pageSize);
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
  @ApiOperation({ summary: '查询库存详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 400, description: '无效的库存ID' })
  @ApiResponse({ status: 404, description: '库存不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findOne(@Param('id') id: string) {
    const data = await this.inventoryService.findOne(id);
    return {
      code: 0,
      message: '查询成功',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新库存项目（名称、阈值）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '无效的库存ID或产品名称已存在' })
  @ApiResponse({ status: 404, description: '库存不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    const data = await this.inventoryService.update(id, updateInventoryDto);
    return {
      code: 0,
      message: '更新成功',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除库存项目' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '无效的库存ID' })
  @ApiResponse({ status: 404, description: '库存不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async remove(@Param('id') id: string) {
    await this.inventoryService.remove(id);
    return {
      code: 0,
      message: '删除成功',
    };
  }
}
