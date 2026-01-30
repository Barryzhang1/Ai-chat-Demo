import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({ required: true, unique: true })
  productName: string;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop({ required: true, default: 0 })
  lastPrice: number;

  @Prop({ required: false, default: 0 })
  lowStockThreshold?: number;

  @Prop({ required: false })
  deletedAt?: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// 创建索引
InventorySchema.index({ productName: 1 }, { unique: true });
InventorySchema.index({ quantity: 1 });
InventorySchema.index({ deletedAt: 1 });

// 虚拟字段：库存总价值
InventorySchema.virtual('totalValue').get(function (this: InventoryDocument) {
  return this.quantity * this.lastPrice;
});

// 虚拟字段：库存状态
InventorySchema.virtual('status').get(function (this: InventoryDocument) {
  if (this.quantity === 0) {
    return 'out';
  }
  if (
    this.quantity > 0 &&
    this.lowStockThreshold &&
    this.lowStockThreshold > 0 &&
    this.quantity <= this.lowStockThreshold
  ) {
    return 'low';
  }
  return 'normal';
});

// 确保虚拟字段在toJSON时也包含
InventorySchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});
