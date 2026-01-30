import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PurchaseOrderDocument = PurchaseOrder & Document;

export enum PurchaseOrderStatus {
  PENDING = 'pending', // 待审批
  APPROVED = 'approved', // 已审批，待入库
  COMPLETED = 'completed', // 已入库
  CANCELLED = 'cancelled', // 已取消
}

// 进货单项目子文档
@Schema({ _id: false })
export class PurchaseOrderItem {
  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  amount: number;
}

export const PurchaseOrderItemSchema =
  SchemaFactory.createForClass(PurchaseOrderItem);

@Schema({ timestamps: true })
export class PurchaseOrder {
  @Prop({ required: true, unique: true })
  orderNo: string;

  @Prop({ required: true })
  supplierName: string;

  @Prop({ type: [PurchaseOrderItemSchema], required: true })
  items: PurchaseOrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({
    required: true,
    enum: Object.values(PurchaseOrderStatus),
    default: PurchaseOrderStatus.PENDING,
  })
  status: PurchaseOrderStatus;

  @Prop({ type: String, required: true })
  creator: string;

  @Prop({ type: String, required: false })
  approver?: string;

  @Prop({ required: false })
  approvedAt?: Date;

  @Prop({ type: String, required: false })
  receivedBy?: string;

  @Prop({ required: false })
  receivedAt?: Date;

  @Prop({ required: false })
  remark?: string;

  @Prop({ required: false })
  deletedAt?: Date;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);

// 创建索引
PurchaseOrderSchema.index({ orderNo: 1 }, { unique: true });
PurchaseOrderSchema.index({ status: 1, createdAt: -1 });
PurchaseOrderSchema.index({ creator: 1 });
PurchaseOrderSchema.index({ deletedAt: 1 });

// 确保虚拟字段在toJSON时也包含
PurchaseOrderSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});
