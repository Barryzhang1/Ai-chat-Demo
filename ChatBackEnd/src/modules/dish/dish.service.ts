import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dish, DishDocument } from './entities/dish.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { UpdateDishStatusDto } from './dto/update-dish-status.dto';

@Injectable()
export class DishService {
  constructor(
    @InjectModel(Dish.name) private readonly dishModel: Model<DishDocument>,
  ) {}

  async create(createDishDto: CreateDishDto): Promise<Dish> {
    const createdDish = new this.dishModel(createDishDto);
    return createdDish.save();
  }

  async findAll(): Promise<Dish[]> {
    return this.dishModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateStatus(
    id: string,
    updateDishStatusDto: UpdateDishStatusDto,
  ): Promise<Dish> {
    const { isDelisted } = updateDishStatusDto;
    const updatedDish = await this.dishModel.findByIdAndUpdate(
      id,
      { isDelisted },
      { new: true },
    );
    if (!updatedDish) {
      throw new Error('Dish not found');
    }
    return updatedDish;
  }

  async update(id: string, updateDishDto: UpdateDishDto): Promise<Dish> {
    const updatedDish = await this.dishModel.findByIdAndUpdate(
      id,
      updateDishDto,
      { new: true },
    );
    if (!updatedDish) {
      throw new Error('Dish not found');
    }
    return updatedDish;
  }
}
