import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryLossDocument = InventoryLoss & Document;

@Schema({ timestamps: true })
export class InventoryLoss {
  @Prop({ required: true, unique: true })
  lossNo: string;

  @Prop({ type: Types.ObjectId, ref: 'Inventory', required: true })
  inventoryId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: false })
  remark?: string;

  @Prop({ type: String, required: true })
  operator: string;

  @Prop({ required: false })
  deletedAt?: Date;
}

export const InventoryLossSchema = SchemaFactory.createForClass(InventoryLoss);

// 创建索引
InventoryLossSchema.index({ lossNo: 1 }, { unique: true });
InventoryLossSchema.index({ inventoryId: 1, createdAt: -1 });
InventoryLossSchema.index({ createdAt: -1 });
InventoryLossSchema.index({ deletedAt: 1 });

// 确保虚拟字段在toJSON时也包含
InventoryLossSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});
