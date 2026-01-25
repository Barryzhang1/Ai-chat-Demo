import { Controller, Post, Body, Get, Patch, Param, Put } from '@nestjs/common';
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { Dish } from './entities/dish.entity';
import { UpdateDishStatusDto } from './dto/update-dish-status.dto';

@Controller('dish')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Post()
  async create(@Body() createDishDto: CreateDishDto): Promise<Dish> {
    return this.dishService.create(createDishDto);
  }

  @Get()
  async findAll(): Promise<Dish[]> {
    return this.dishService.findAll();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDishStatusDto: UpdateDishStatusDto,
  ): Promise<Dish> {
    return this.dishService.updateStatus(id, updateDishStatusDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDishDto: UpdateDishDto,
  ): Promise<Dish> {
    return this.dishService.update(id, updateDishDto);
  }
}
