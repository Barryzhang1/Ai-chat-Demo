import { config } from '../config';

const API_BASE_URL = config.apiUrl;

/**
 * 游戏分数API
 */
export const gameScoreApi = {
  /**
   * 提交游戏分数
   * @param {Object} scoreData - 分数数据
   * @param {string} scoreData.playerName - 玩家名称
   * @param {number} scoreData.score - 游戏分数
   * @param {string} scoreData.gameType - 游戏类型
   * @param {number} scoreData.playTime - 游戏时长（秒）
   * @returns {Promise} 提交结果
   */
  submitScore: async (scoreData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/game-scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Submit score error:', error);
      throw error;
    }
  },

  /**
   * 获取游戏排行榜
   * @param {Object} params - 查询参数
   * @param {string} params.gameType - 游戏类型
   * @param {string} params.period - 时间范围 (today/week/month/all)
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @returns {Promise} 排行榜数据
   */
  getLeaderboard: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        gameType: params.gameType || 'FlappyBird',
        period: params.period || 'all',
        page: params.page || 1,
        limit: params.limit || 100,
      });

      const response = await fetch(
        `${API_BASE_URL}/game-scores/leaderboard?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw error;
    }
  },

  /**
   * 获取玩家个人最高分
   * @param {string} playerId - 玩家ID
   * @param {string} gameType - 游戏类型
   * @returns {Promise} 个人最高分数据
   */
  getPersonalBest: async (playerId, gameType = 'FlappyBird') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/game-scores/personal-best?playerId=${playerId}&gameType=${gameType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get personal best error:', error);
      throw error;
    }
  },

  /**
   * 获取游戏统计信息
   * @param {string} gameType - 游戏类型
   * @returns {Promise} 统计信息
   */
  getGameStats: async (gameType = 'FlappyBird') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/game-scores/stats?gameType=${gameType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get game stats error:', error);
      throw error;
    }
  },
};

export default gameScoreApi;
