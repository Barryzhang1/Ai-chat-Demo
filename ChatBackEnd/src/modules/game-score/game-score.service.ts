import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameScore, GameScoreDocument } from './entities/game-score.entity';
import { CreateGameScoreDto } from './dto/create-game-score.dto';
import { QueryLeaderboardDto } from './dto/query-leaderboard.dto';
import { MongoLogger } from '../../common/utils/mongo-logger.util';

/**
 * 游戏分数服务
 */
@Injectable()
export class GameScoreService {
  private readonly logger = new Logger(GameScoreService.name);

  constructor(
    @InjectModel(GameScore.name)
    private readonly gameScoreModel: Model<GameScoreDocument>,
  ) {}

  /**
   * 创建游戏分数记录
   * 每个用户只保留最高分记录
   */
  async create(createGameScoreDto: CreateGameScoreDto) {
    this.logger.log(
      `创建游戏分数记录: ${JSON.stringify(createGameScoreDto)}`,
    );

    const { playerName, gameType, score } = createGameScoreDto;

    // 查询该玩家在该游戏中是否已有记录
    const existingRecord = await this.gameScoreModel
      .findOne({ playerName, gameType })
      .exec();

    let saved: GameScoreDocument;
    let isNewRecord = false;
    let isHighScore = false;
    const oldScore = existingRecord?.score;

    if (existingRecord) {
      // 如果已有记录，比较分数
      if (score > existingRecord.score) {
        // 新分数更高，更新记录
        isHighScore = true;
        existingRecord.score = score;
        existingRecord.playTime = createGameScoreDto.playTime;
        existingRecord.playerId = createGameScoreDto.playerId;
        saved = await existingRecord.save();
        this.logger.log(
          `更新最高分: 玩家=${playerName}, 原分数=${oldScore}, 新分数=${score}`,
        );
      } else {
        // 新分数不高于已有分数，保留原记录
        saved = existingRecord;
        this.logger.log(
          `保留原记录: 玩家=${playerName}, 最高分=${existingRecord.score}, 本次分数=${score}`,
        );
      }
    } else {
      // 没有记录，创建新记录
      const gameScore = new this.gameScoreModel(createGameScoreDto);
      saved = await gameScore.save();
      isNewRecord = true;
      isHighScore = true;
      this.logger.log(`创建新记录: 玩家=${playerName}, 分数=${score}`);
    }

    // 获取该玩家在该游戏中的排名
    const rank = await this.getRankByScore(gameType, saved.score);

    this.logger.log(
      `游戏分数${isNewRecord ? '创建' : '更新'}成功: ID=${saved._id}, 排名=${rank}, 玩家=${playerName}, 分数=${saved.score}`,
    );

    return {
      _id: saved._id,
      score: saved.score,
      rank,
      isNewRecord,
      isHighScore,
    };
  }

  /**
   * 查询排行榜
   */
  async getLeaderboard(queryDto: QueryLeaderboardDto) {
    const {
      gameType = 'FlappyBird',
      period = 'all',
      page = 1,
      limit = 100,
    } = queryDto;

    this.logger.log(
      `查询排行榜: gameType=${gameType}, period=${period}, page=${page}, limit=${limit}`,
    );

    // 构建查询条件
    const query: any = { gameType };

    // 根据时间范围过滤
    if (period !== 'all') {
      const now = new Date();
      let startDate: Date | undefined;

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    // 记录查询日志
    MongoLogger.logQuery('game_scores', query, {
      sort: { score: -1, createdAt: -1 },
      skip: (page - 1) * limit,
      limit,
    });

    const startTime = Date.now();

    // 执行查询
    const [list, total] = await Promise.all([
      this.gameScoreModel
        .find(query)
        .sort({ score: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.gameScoreModel.countDocuments(query).exec(),
    ]);

    const duration = Date.now() - startTime;
    MongoLogger.logResult(list.length, duration);

    // 添加排名信息
    const listWithRank = list.map((item, index) => ({
      ...item,
      rank: (page - 1) * limit + index + 1,
    }));

    this.logger.log(
      `排行榜查询完成: 返回${list.length}条记录, 总计${total}条, 耗时${duration}ms`,
    );

    return {
      list: listWithRank,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据分数获取排名
   */
  private async getRankByScore(
    gameType: string,
    score: number,
  ): Promise<number> {
    const count = await this.gameScoreModel
      .countDocuments({
        gameType,
        score: { $gt: score },
      })
      .exec();

    return count + 1;
  }

  /**
   * 获取玩家的个人最高分
   */
  async getPersonalBest(playerId: string, gameType: string) {
    this.logger.log(
      `查询玩家个人最高分: playerId=${playerId}, gameType=${gameType}`,
    );

    const best = await this.gameScoreModel
      .findOne({ playerId, gameType })
      .sort({ score: -1 })
      .lean()
      .exec();

    if (!best) {
      return null;
    }

    const rank = await this.getRankByScore(gameType, best.score);

    return {
      ...best,
      rank,
    };
  }

  /**
   * 获取游戏统计信息
   */
  async getGameStats(gameType: string) {
    this.logger.log(`获取游戏统计信息: gameType=${gameType}`);

    const stats = await this.gameScoreModel.aggregate([
      { $match: { gameType } },
      {
        $group: {
          _id: null,
          totalPlays: { $sum: 1 },
          highestScore: { $max: '$score' },
          averageScore: { $avg: '$score' },
          totalPlayers: { $addToSet: '$playerId' },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalPlays: 0,
        highestScore: 0,
        averageScore: 0,
        uniquePlayers: 0,
      };
    }

    return {
      totalPlays: stats[0].totalPlays,
      highestScore: stats[0].highestScore,
      averageScore: Math.round(stats[0].averageScore * 100) / 100,
      uniquePlayers: stats[0].totalPlayers.filter((id: string) => id).length,
    };
  }
}
