import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DishDocument = Dish & Document;

@Schema({ timestamps: true })
export class Dish {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  categoryId: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ default: false })
  isDelisted: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  ingredients: string[];
}

export const DishSchema = SchemaFactory.createForClass(Dish);
