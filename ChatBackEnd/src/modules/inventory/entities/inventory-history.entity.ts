import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryHistoryDocument = InventoryHistory & Document;

export enum InventoryChangeType {
  PURCHASE = 'purchase', // 进货入库
  LOSS = 'loss', // 损耗出库
  MANUAL_ADJUST = 'manual_adjust', // 手动调整
  ORDER_CONSUME = 'order_consume', // 订单消耗
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class InventoryHistory {
  @Prop({ type: Types.ObjectId, ref: 'Inventory', required: true })
  inventoryId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({
    required: true,
    enum: Object.values(InventoryChangeType),
  })
  changeType: InventoryChangeType;

  @Prop({ required: true })
  changeQuantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  quantityBefore: number;

  @Prop({ required: true, min: 0 })
  quantityAfter: number;

  @Prop({ type: Types.ObjectId, required: false })
  relatedOrderId?: Types.ObjectId;

  @Prop({ required: false })
  relatedOrderNo?: string;

  @Prop({ required: false })
  reason?: string;

  @Prop({ type: String, required: true })
  operator: string;
}

export const InventoryHistorySchema =
  SchemaFactory.createForClass(InventoryHistory);

// 创建索引
InventoryHistorySchema.index({ inventoryId: 1, createdAt: -1 });
InventoryHistorySchema.index({ relatedOrderId: 1 });
InventoryHistorySchema.index({ changeType: 1 });
InventoryHistorySchema.index({ createdAt: -1 });

// 确保虚拟字段在toJSON时也包含
InventoryHistorySchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});
