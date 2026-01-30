import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
  PurchaseOrderStatus,
} from './entities/purchase-order.entity';
import {
  CreatePurchaseOrderDto,
  ApprovePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  QueryPurchaseOrderDto,
} from './dto/purchase-order.dto';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryChangeType } from '../inventory/entities/inventory-history.entity';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  // 生成订单号
  private generateOrderNo(): string {
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
    return `PO${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  }

  // 创建进货单
  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    userId: string,
  ): Promise<PurchaseOrder> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('无效的用户ID');
    }

    // 计算每项金额和总金额
    const items = createPurchaseOrderDto.items.map((item) => ({
      ...item,
      amount: item.quantity * item.price,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    // 生成订单号
    const orderNo = this.generateOrderNo();

    const createdOrder = await this.purchaseOrderModel.create({
      orderNo,
      supplierName: createPurchaseOrderDto.supplierName,
      items,
      totalAmount,
      status: PurchaseOrderStatus.PENDING,
      creator: userId,
      remark: createPurchaseOrderDto.remark,
    });

    return createdOrder;
  }

  // 查询进货单列表
  async findAll(query: QueryPurchaseOrderDto) {
    const {
      orderNo,
      status = 'all',
      supplierName,
      page = 1,
      pageSize = 10,
    } = query;
    const filter: any = { deletedAt: null };

    if (orderNo) {
      filter.orderNo = { $regex: orderNo, $options: 'i' };
    }

    if (status !== 'all') {
      filter.status = status;
    }

    if (supplierName) {
      filter.supplierName = { $regex: supplierName, $options: 'i' };
    }

    const total = await this.purchaseOrderModel.countDocuments(filter);

    const list = await this.purchaseOrderModel
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

  // 根据ID查询进货单
  async findOne(id: string): Promise<PurchaseOrder> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的订单ID');
    }

    const order = await this.purchaseOrderModel
      .findOne({ _id: id, deletedAt: null })
      .exec();

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  // 审批进货单
  async approve(
    id: string,
    approvePurchaseOrderDto: ApprovePurchaseOrderDto,
    userId: string,
  ): Promise<PurchaseOrder> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的订单ID');
    }

    if (!userId || userId.trim() === '') {
      throw new BadRequestException('无效的用户ID');
    }

    const order = await this.purchaseOrderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== PurchaseOrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许审批');
    }

    const { approve, remark } = approvePurchaseOrderDto;

    // 调试日志
    console.log('Approve DTO:', approvePurchaseOrderDto);
    console.log('Approve value:', approve, 'Type:', typeof approve);

    order.approver = userId;
    order.approvedAt = new Date();
    order.status = approve
      ? PurchaseOrderStatus.APPROVED
      : PurchaseOrderStatus.CANCELLED;
    if (remark) {
      order.remark = remark;
    }

    await order.save();
    return order;
  }

  // 入库确认
  async receive(
    id: string,
    receivePurchaseOrderDto: ReceivePurchaseOrderDto,
    userId: string,
  ): Promise<PurchaseOrder> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的订单ID');
    }

    if (!userId || userId.trim() === '') {
      throw new BadRequestException('无效的用户ID');
    }

    const order = await this.purchaseOrderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== PurchaseOrderStatus.APPROVED) {
      throw new BadRequestException('订单状态不允许入库');
    }

    // 更新订单状态
    order.receivedBy = userId;
    order.receivedAt = new Date();
    order.status = PurchaseOrderStatus.COMPLETED;
    if (receivePurchaseOrderDto.remark) {
      order.remark = receivePurchaseOrderDto.remark;
    }

    // 更新库存（原子操作）
    for (const item of order.items) {
      // 查找或创建库存
      const inventory = await this.inventoryService.findOrCreateByProductName(
        item.productName,
      );

      // 更新库存数量
      await this.inventoryService.updateQuantity(
        (inventory as any)._id,
        item.quantity,
        item.price,
        InventoryChangeType.PURCHASE,
        userId,
        order._id,
        order.orderNo,
        `进货入库：${order.supplierName}`,
      );
    }

    await order.save();
    return order;
  }

  // 删除进货单（软删除）
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的订单ID');
    }

    const order = await this.purchaseOrderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status === PurchaseOrderStatus.COMPLETED) {
      throw new ForbiddenException('已完成的订单不能删除');
    }

    order.deletedAt = new Date();
    await order.save();
  }
}
