import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

/**
 * 订单菜品项
 */
class OrderDishItem {
  @Prop({ type: Types.ObjectId, ref: 'Dish', required: true })
  dishId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, default: 1 })
  quantity: number;
}

/**
 * 订单Schema
 */
@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: [OrderDishItem], required: true })
  dishes: OrderDishItem[];

  @Prop({ required: true })
  totalPrice: number;

  @Prop({
    required: true,
    enum: ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({ maxlength: 200 })
  note?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
