import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameScoreDocument = GameScore & Document;

/**
 * 游戏分数实体
 * 用于记录玩家在游戏中的得分
 */
@Schema({ timestamps: true, collection: 'game_scores' })
export class GameScore {
  /**
   * 玩家ID（如果已登录）
   */
  @Prop({ index: true })
  playerId?: string;

  /**
   * 玩家名称
   */
  @Prop({ required: true })
  playerName: string;

  /**
   * 游戏分数
   */
  @Prop({ required: true, min: 0, index: true })
  score: number;

  /**
   * 游戏类型
   */
  @Prop({ required: true, index: true, default: 'FlappyBird' })
  gameType: string;

  /**
   * 游戏时长（秒）
   */
  @Prop({ min: 0 })
  playTime?: number;

  /**
   * 创建时间（自动生成）
   */
  createdAt?: Date;

  /**
   * 更新时间（自动更新）
   */
  updatedAt?: Date;
}

export const GameScoreSchema = SchemaFactory.createForClass(GameScore);

// 创建复合索引
GameScoreSchema.index({ gameType: 1, score: -1, createdAt: -1 });
GameScoreSchema.index({ gameType: 1, createdAt: -1 });
GameScoreSchema.index({ playerId: 1, createdAt: -1 });
