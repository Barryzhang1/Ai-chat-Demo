import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 用户文档类型
 */
export type UserDocument = User & Document;

/**
 * 用户Schema
 */
@Schema({
  timestamps: true, // 自动添加createdAt和updatedAt
  collection: 'users',
})
export class User {
  /**
   * 用户唯一标识 (UUID v4)
   */
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  id: string;

  /**
   * 用户昵称
   */
  @Prop({
    required: true,
    unique: true,
    minlength: 2,
    maxlength: 20,
    index: true,
  })
  nickname: string;

  /**
   * 创建时间（自动生成）
   */
  createdAt?: Date;

  /**
   * 更新时间（自动更新）
   */
  updatedAt?: Date;
}

/**
 * 导出User Schema
 */
export const UserSchema = SchemaFactory.createForClass(User);
