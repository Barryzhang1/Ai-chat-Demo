import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionType } from '../enums/transaction-type.enum';

export type ExtraTransactionDocument = ExtraTransaction & Document;

/**
 * 额外收支记录模型
 * 用于记录非订单收入和各项支出
 */
@Schema({ timestamps: true, collection: 'extra_transactions' })
export class ExtraTransaction {
  @Prop({ required: true, unique: true, index: true })
  transactionNo: string;

  @Prop({
    required: true,
    enum: Object.values(TransactionType),
    index: true,
  })
  type: TransactionType;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ maxlength: 200 })
  description?: string;

  @Prop({ required: true, type: Date, index: true })
  transactionDate: Date;

  @Prop({ required: true, type: String })
  creator: string;

  @Prop({ type: Date })
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExtraTransactionSchema =
  SchemaFactory.createForClass(ExtraTransaction);

// 创建索引
ExtraTransactionSchema.index({ type: 1, transactionDate: -1 });
ExtraTransactionSchema.index({ deletedAt: 1 });
ExtraTransactionSchema.index({ creator: 1 });
