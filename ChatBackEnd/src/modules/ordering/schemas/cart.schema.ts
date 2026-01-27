import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

/**
 * 购物车菜品项
 */
class CartDishItem {
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
 * 查询偏好设置
 */
class Preferences {
  @Prop()
  numberOfPeople?: number;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ type: [String] })
  excludeTags?: string[];

  @Prop({ default: 5 })
  limit?: number;
}

/**
 * 批量查询条件（用于"八荤八素"等复杂需求）
 */
class QueryCondition {
  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ type: [String] })
  excludeTags?: string[];

  @Prop()
  limit?: number;

  @Prop()
  description?: string;
}

/**
 * 购物车Schema
 */
@Schema({ timestamps: true, collection: 'carts' })
export class Cart {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ type: [CartDishItem], default: [] })
  dishes: CartDishItem[];

  @Prop({ type: Preferences })
  preferences?: Preferences;

  @Prop({ type: [QueryCondition] })
  queries?: QueryCondition[];

  @Prop({ required: true, default: 0 })
  totalPrice: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
