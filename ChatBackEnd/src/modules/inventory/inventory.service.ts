import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory, InventoryDocument } from './entities/inventory.entity';
import {
  InventoryHistory,
  InventoryHistoryDocument,
  InventoryChangeType,
} from './entities/inventory-history.entity';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  QueryInventoryDto,
} from './dto/inventory.dto';
import { QueryInventoryHistoryDto } from './dto/inventory-history.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryHistory.name)
    private readonly historyModel: Model<InventoryHistoryDocument>,
  ) {}

  // 创建库存
  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const existingInventory = await this.inventoryModel
      .findOne({ productName: createInventoryDto.productName })
      .exec();

    if (existingInventory) {
      throw new BadRequestException('该产品已存在');
    }

    const createdInventory = new this.inventoryModel(createInventoryDto);
    return createdInventory.save();
  }

  // 查询库存列表
  async findAll(query: QueryInventoryDto) {
    const { productName, status = 'all', page = 1, pageSize = 10 } = query;
    const filter: any = { deletedAt: null };

    // 产品名称模糊搜索
    if (productName) {
      filter.productName = { $regex: productName, $options: 'i' };
    }

    // 查询总数
    const total = await this.inventoryModel.countDocuments(filter);

    // 查询列表
    let inventories = await this.inventoryModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    // 过滤低库存状态
    if (status === 'low') {
      inventories = inventories.filter((item) => {
        const doc = item.toJSON() as any;
        return doc.status === 'low' || doc.status === 'out';
      });
    }

    return {
      list: inventories,
      total: status === 'low' ? inventories.length : total,
      page,
      pageSize,
    };
  }

  // 根据ID查询库存
  async findOne(id: string): Promise<Inventory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的库存ID');
    }

    const inventory = await this.inventoryModel
      .findOne({ _id: id, deletedAt: null })
      .exec();

    if (!inventory) {
      throw new NotFoundException('库存不存在');
    }

    return inventory;
  }

  // 更新库存信息（仅允许修改名称和阈值）
  async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的库存ID');
    }

    // 如果修改了产品名称，检查是否重复
    if (updateInventoryDto.productName) {
      const existingInventory = await this.inventoryModel
        .findOne({
          productName: updateInventoryDto.productName,
          _id: { $ne: id },
        })
        .exec();

      if (existingInventory) {
        throw new BadRequestException('该产品名称已存在');
      }
    }

    const updatedInventory = await this.inventoryModel
      .findByIdAndUpdate(id, updateInventoryDto, { new: true })
      .exec();

    if (!updatedInventory) {
      throw new NotFoundException('库存不存在');
    }

    return updatedInventory;
  }

  // 软删除库存
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的库存ID');
    }

    const result = await this.inventoryModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();

    if (!result) {
      throw new NotFoundException('库存不存在');
    }
  }

  // 查询库存历史记录
  async findHistory(query: QueryInventoryHistoryDto) {
    const {
      inventoryId,
      productName,
      changeType = 'all',
      page = 1,
      pageSize = 10,
    } = query;
    const filter: any = {};

    if (inventoryId) {
      if (!Types.ObjectId.isValid(inventoryId)) {
        throw new BadRequestException('无效的库存ID');
      }
      filter.inventoryId = new Types.ObjectId(inventoryId);
    }

    if (productName) {
      filter.productName = { $regex: productName, $options: 'i' };
    }

    if (changeType !== 'all') {
      filter.changeType = changeType;
    }

    const total = await this.historyModel.countDocuments(filter);

    const list = await this.historyModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  // 内部方法：更新库存数量（由进货单和损耗调用）
  async updateQuantity(
    inventoryId: Types.ObjectId | string,
    changeQuantity: number,
    price: number,
    changeType: InventoryChangeType,
    operatorId: string,
    relatedOrderId?: Types.ObjectId | string,
    relatedOrderNo?: string,
    reason?: string,
  ): Promise<Inventory> {
    const inventory = await this.inventoryModel.findById(inventoryId).exec();
    if (!inventory) {
      throw new NotFoundException('库存不存在');
    }

    const quantityBefore = inventory.quantity;
    const quantityAfter = quantityBefore + changeQuantity;

    if (quantityAfter < 0) {
      throw new BadRequestException('库存不足');
    }

    // 更新库存数量和价格
    inventory.quantity = quantityAfter;
    if (changeQuantity > 0) {
      // 只有入库时更新价格
      inventory.lastPrice = price;
    }
    await inventory.save();

    // 记录历史
    await this.historyModel.create({
      inventoryId: inventory._id,
      productName: inventory.productName,
      changeType,
      changeQuantity,
      price,
      quantityBefore,
      quantityAfter,
      relatedOrderId,
      relatedOrderNo,
      reason,
      operator: operatorId,
    });

    return inventory;
  }

  // 内部方法：根据产品名称查找或创建库存
  async findOrCreateByProductName(productName: string): Promise<Inventory> {
    let inventory = await this.inventoryModel
      .findOne({ productName, deletedAt: null })
      .exec();

    if (!inventory) {
      inventory = await this.inventoryModel.create({
        productName,
        quantity: 0,
        lastPrice: 0,
        lowStockThreshold: 0,
      });
    }

    return inventory;
  }
}
