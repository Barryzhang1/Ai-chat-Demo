import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InventoryLoss,
  InventoryLossDocument,
} from './entities/inventory-loss.entity';
import {
  CreateInventoryLossDto,
  QueryInventoryLossDto,
} from './dto/inventory-loss.dto';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryChangeType } from '../inventory/entities/inventory-history.entity';

@Injectable()
export class InventoryLossService {
  constructor(
    @InjectModel(InventoryLoss.name)
    private readonly inventoryLossModel: Model<InventoryLossDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  // 生成损耗单号
  private generateLossNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `LOSS${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  }

  // 创建损耗记录
  async create(
    createInventoryLossDto: CreateInventoryLossDto,
    userId: string,
  ): Promise<InventoryLoss> {
    // 验证inventoryId是否为有效的ObjectId
    if (!Types.ObjectId.isValid(createInventoryLossDto.inventoryId)) {
      throw new BadRequestException('无效的库存ID');
    }

    // 验证userId是否存在（UUID格式，不需要ObjectId验证）
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('无效的用户ID');
    }

    const inventoryId = createInventoryLossDto.inventoryId;
    const inventory = await this.inventoryService.findOne(inventoryId);

    // 检查库存是否足够
    if (inventory.quantity < createInventoryLossDto.quantity) {
      throw new BadRequestException('库存不足，无法记录损耗');
    }

    const price = inventory.lastPrice;
    const amount = createInventoryLossDto.quantity * price;

    // 生成损耗单号
    const lossNo = this.generateLossNo();

    // 创建损耗记录
    const createdLoss = await this.inventoryLossModel.create({
      lossNo,
      inventoryId: (inventory as any)._id,
      productName: inventory.productName,
      quantity: createInventoryLossDto.quantity,
      price,
      amount,
      reason: createInventoryLossDto.reason,
      remark: createInventoryLossDto.remark,
      operator: userId,
    });

    // 更新库存（扣减）
    await this.inventoryService.updateQuantity(
      (inventory as any)._id,
      -createInventoryLossDto.quantity,
      price,
      InventoryChangeType.LOSS,
      userId,
      (createdLoss as any)._id,
      lossNo,
      `损耗出库：${createInventoryLossDto.reason}`,
    );

    return createdLoss;
  }

  // 查询损耗记录列表
  async findAll(query: QueryInventoryLossDto) {
    const { inventoryId, productName, page = 1, pageSize = 10 } = query;
    const filter: any = { deletedAt: null };

    if (inventoryId) {
      if (!Types.ObjectId.isValid(inventoryId)) {
        throw new BadRequestException('无效的库存ID');
      }
      filter.inventoryId = inventoryId;
    }

    if (productName) {
      filter.productName = { $regex: productName, $options: 'i' };
    }

    const total = await this.inventoryLossModel.countDocuments(filter);

    const list = await this.inventoryLossModel
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

  // 根据ID查询损耗记录
  async findOne(id: string): Promise<InventoryLoss> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的损耗记录ID');
    }

    const loss = await this.inventoryLossModel
      .findOne({ _id: id, deletedAt: null })
      .exec();

    if (!loss) {
      throw new NotFoundException('损耗记录不存在');
    }

    return loss;
  }

  // 删除损耗记录（软删除，不恢复库存）
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的损耗记录ID');
    }

    const result = await this.inventoryLossModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();

    if (!result) {
      throw new NotFoundException('损耗记录不存在');
    }
  }
}
