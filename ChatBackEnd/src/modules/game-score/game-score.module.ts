import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameScoreService } from './game-score.service';
import { GameScoreController } from './game-score.controller';
import { GameScore, GameScoreSchema } from './entities/game-score.entity';

/**
 * 游戏分数模块
 * 提供游戏分数提交和排行榜查询功能
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameScore.name, schema: GameScoreSchema },
    ]),
  ],
  controllers: [GameScoreController],
  providers: [GameScoreService],
  exports: [GameScoreService],
})
export class GameScoreModule {}
