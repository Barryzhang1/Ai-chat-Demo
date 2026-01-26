import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SeatDocument = Seat & Document;

export enum SeatStatus {
  AVAILABLE = 'available',     // 可用
  OCCUPIED = 'occupied',        // 已占用（用餐中）
  CLOSED = 'closed',            // 已关闭（临时不可用）
}

@Schema({ timestamps: true })
export class Seat {
  _id: string;

  @Prop({ required: true, unique: true })
  seatNumber: number;

  @Prop({ 
    type: String, 
    enum: SeatStatus, 
    default: SeatStatus.AVAILABLE 
  })
  status: SeatStatus;

  @Prop()
  occupiedBy?: string; // Socket ID of the user

  @Prop()
  occupiedByName?: string; // User nickname

  @Prop()
  occupiedAt?: Date;

  @Prop({ default: true })
  isActive: boolean; // 用于软删除
}

export const SeatSchema = SchemaFactory.createForClass(Seat);
