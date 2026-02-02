import { Controller, Post, Body, Get, Patch, Param, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { Dish } from './entities/dish.entity';
import { UpdateDishStatusDto } from './dto/update-dish-status.dto';

@ApiTags('dish')
@Controller('dish')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Post()
  @ApiOperation({ summary: '创建菜品' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createDishDto: CreateDishDto): Promise<Dish> {
    return this.dishService.create(createDishDto);
  }

  @Get()
  @ApiOperation({ summary: '查询所有菜品（支持搜索）' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词（菜品名称）' })
  @ApiQuery({ name: 'categoryId', required: false, description: '分类ID' })
  @ApiQuery({ name: 'tag', required: false, description: '标签' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tag') tag?: string,
  ): Promise<Dish[]> {
    return this.dishService.findAll(keyword, categoryId, tag);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新菜品状态（上架/下架）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '菜品不存在' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDishStatusDto: UpdateDishStatusDto,
  ): Promise<Dish> {
    return this.dishService.updateStatus(id, updateDishStatusDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新菜品信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '菜品不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateDishDto: UpdateDishDto,
  ): Promise<Dish> {
    return this.dishService.update(id, updateDishDto);
  }
}
