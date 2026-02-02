import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dish, DishDocument } from './entities/dish.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { UpdateDishStatusDto } from './dto/update-dish-status.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class DishService {
  constructor(
    @InjectModel(Dish.name) private readonly dishModel: Model<DishDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(createDishDto: CreateDishDto): Promise<Dish> {
    const createdDish = new this.dishModel(createDishDto);
    return createdDish.save();
  }

  async findAll(keyword?: string, categoryId?: string, tag?: string): Promise<any[]> {
    const query: any = {};

    // 按关键词搜索（菜品名称或描述）
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    // 按分类ID筛选
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // 按标签筛选
    if (tag) {
      query.tags = tag;
    }

    const dishes = await this.dishModel.find(query).sort({ createdAt: -1 }).exec();
    
    // 计算每个菜品的成本价
    const dishesWithCost = await Promise.all(
      dishes.map(async (dish) => {
        let costPrice = 0;
        
        // 如果菜品绑定了食材，计算成本价
        if (dish.ingredients && dish.ingredients.length > 0) {
          try {
            // 获取所有绑定的食材信息
            const ingredientCosts = await Promise.all(
              dish.ingredients.map(async (ingredientId) => {
                try {
                  const inventory = await this.inventoryService.findOne(ingredientId);
                  const price = inventory.lastPrice || 0;
                  return price;
                } catch (error) {
                  // 如果食材不存在或已删除，返回0
                  return 0;
                }
              })
            );
            
            // 成本价 = 所有食材价格之和
            costPrice = ingredientCosts.reduce((sum, price) => sum + price, 0);
          } catch (error) {
            costPrice = 0;
          }
        }
        
        // 返回包含成本价的菜品数据
        return {
          ...dish.toObject(),
          costPrice: Number(costPrice.toFixed(2)),
        };
      })
    );
    
    return dishesWithCost;
  }

  async updateStatus(
    id: string,
    updateDishStatusDto: UpdateDishStatusDto,
  ): Promise<Dish> {
    const { isDelisted } = updateDishStatusDto;
    
    // 查找菜品
    const dish = await this.dishModel.findById(id);
    if (!dish) {
      throw new NotFoundException('菜品不存在');
    }
    
    // 如果是上架操作（isDelisted: false），需要检查食材库存
    if (!isDelisted && dish.ingredients && dish.ingredients.length > 0) {
      const outOfStockIngredients: string[] = [];
      
      // 检查每个绑定的食材库存
      for (const ingredientId of dish.ingredients) {
        try {
          const inventory = await this.inventoryService.findOne(ingredientId);
          
          // 如果库存为0，记录该食材名称
          if (inventory.quantity === 0) {
            outOfStockIngredients.push(inventory.productName);
          }
        } catch (error) {
          // 如果食材不存在，也应该阻止上架
          throw new BadRequestException(`食材ID ${ingredientId} 不存在`);
        }
      }
      
      // 如果有食材库存不足，拒绝上架
      if (outOfStockIngredients.length > 0) {
        const ingredientsText = outOfStockIngredients.join('、');
        throw new BadRequestException(`${ingredientsText}食材不足，无法上架`);
      }
    }
    
    // 更新菜品状态
    const updatedDish = await this.dishModel.findByIdAndUpdate(
      id,
      { isDelisted },
      { new: true },
    );
    
    // 这里 updatedDish 不会为 null，因为上面已经检查过菜品存在性
    return updatedDish!;
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
