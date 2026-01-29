import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatHistoryDocument = ChatHistory & Document;

/**
 * 聊天消息项
 */
@Schema({ _id: false })
export class ChatMessage {
  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: Object })
  cart?: {
    dishes: Array<{
      dishId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalPrice: number;
  };
}

const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

/**
 * 聊天历史Schema
 */
@Schema({ timestamps: true, collection: 'chatHistories' })
export class ChatHistory {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages: ChatMessage[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
