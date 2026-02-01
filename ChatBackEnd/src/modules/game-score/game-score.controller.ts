import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GameScoreService } from './game-score.service';
import { CreateGameScoreDto } from './dto/create-game-score.dto';
import { QueryLeaderboardDto } from './dto/query-leaderboard.dto';

/**
 * 游戏分数控制器
 */
@Controller('game-scores')
export class GameScoreController {
  constructor(private readonly gameScoreService: GameScoreService) {}

  /**
   * 提交游戏分数
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGameScoreDto: CreateGameScoreDto) {
    const result = await this.gameScoreService.create(createGameScoreDto);
    return {
      code: 201,
      message: '分数提交成功',
      data: result,
    };
  }

  /**
   * 查询游戏排行榜
   */
  @Get('leaderboard')
  async getLeaderboard(@Query() queryDto: QueryLeaderboardDto) {
    const result = await this.gameScoreService.getLeaderboard(queryDto);
    return {
      code: 200,
      message: '查询成功',
      data: result,
    };
  }

  /**
   * 获取玩家个人最高分
   */
  @Get('personal-best')
  async getPersonalBest(
    @Query('playerId') playerId: string,
    @Query('gameType') gameType: string = 'FlappyBird',
  ) {
    const result = await this.gameScoreService.getPersonalBest(
      playerId,
      gameType,
    );
    return {
      code: 200,
      message: '查询成功',
      data: result,
    };
  }

  /**
   * 获取游戏统计信息
   */
  @Get('stats')
  async getGameStats(@Query('gameType') gameType: string = 'FlappyBird') {
    const result = await this.gameScoreService.getGameStats(gameType);
    return {
      code: 200,
      message: '查询成功',
      data: result,
    };
  }
}
