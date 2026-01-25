import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DishDocument = Dish & Document;

@Schema({ timestamps: true })
export class Dish {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: false })
  description?: string;

  @Prop({ default: false })
  isDelisted: boolean;

  @Prop({ default: false })
  isSpicy: boolean;

  @Prop({ default: false })
  hasScallions: boolean;

  @Prop({ default: false })
  hasCilantro: boolean;

  @Prop({ default: false })
  hasGarlic: boolean;

  @Prop({ default: 0 })
  cookingTime: number;
}

export const DishSchema = SchemaFactory.createForClass(Dish);
