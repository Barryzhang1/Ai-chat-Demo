/**
 * 游戏分数API服务
 */

// API基础URL配置
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * 提交游戏分数到后端
 * @param {Object} scoreData - 分数数据
 * @param {string} scoreData.playerName - 玩家名称
 * @param {number} scoreData.score - 游戏分数
 * @param {string} scoreData.gameType - 游戏类型
 * @param {number} scoreData.playTime - 游戏时长（秒）
 * @returns {Promise<Object>} 返回分数提交结果
 */
export const submitGameScore = async (scoreData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/game-scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('响应错误:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('提交分数失败:', error);
    
    // 保存到本地存储作为备份
    saveScoreToLocal(scoreData);
    
    throw error;
  }
};

/**
 * 查询游戏排行榜
 * @param {Object} params - 查询参数
 * @param {string} params.gameType - 游戏类型
 * @param {string} params.period - 时间范围 (today/week/month/all)
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @returns {Promise<Object>} 返回排行榜数据
 */
export const getLeaderboard = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      gameType: params.gameType || 'FlappyBird',
      period: params.period || 'all',
      page: params.page || 1,
      limit: params.limit || 10,
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

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('获取排行榜失败:', error);
    throw error;
  }
};

/**
 * 获取游戏统计信息
 * @param {string} gameType - 游戏类型
 * @returns {Promise<Object>} 返回统计信息
 */
export const getGameStats = async (gameType = 'FlappyBird') => {
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

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('获取统计信息失败:', error);
    throw error;
  }
};

/**
 * 保存分数到本地存储（作为备份）
 * @param {Object} scoreData - 分数数据
 */
const saveScoreToLocal = (scoreData) => {
  try {
    const localScores = JSON.parse(
      localStorage.getItem('flappyBirdPendingScores') || '[]'
    );
    localScores.push({
      ...scoreData,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('flappyBirdPendingScores', JSON.stringify(localScores));
  } catch (error) {
    console.error('保存到本地存储失败:', error);
  }
};

/**
 * 从 URL 参数或本地存储获取玩家名称
 * 优先使用 URL 参数传递的名称，其次使用本地保存的匿名名称
 * 如果都为空，自动生成并保存匿名名称
 * @returns {string} 玩家名称
 */
export const getPlayerName = () => {
  // 优先从 URL 参数获取玩家名称
  const urlParams = new URLSearchParams(window.location.search);
  const urlPlayerName = urlParams.get('playerName');
  
  if (urlPlayerName && urlPlayerName !== 'null' && urlPlayerName !== 'undefined') {
    return urlPlayerName;
  }
  
  // 如果URL没有传递，使用FlappyBird专用的玩家名称
  let anonymousName = localStorage.getItem('flappyBirdPlayerName');
  
  // 如果本地也没有，生成一个新的
  if (!anonymousName) {
    anonymousName = generateAnonymousName();
    savePlayerName(anonymousName);
  }
  
  return anonymousName;
};

/**
 * 保存玩家名称到本地存储
 * 注意：只保存匿名玩家名称，登录用户名称由ChatUI管理
 * @param {string} name - 玩家名称
 */
export const savePlayerName = (name) => {
  // 只有匿名玩家才保存到FlappyBird专用的存储
  localStorage.setItem('flappyBirdPlayerName', name);
};

/**
 * 生成匿名玩家名称
 * @returns {string} 匿名玩家名称
 */
export const generateAnonymousName = () => {
  const adjectives = ['快乐的', '勇敢的', '聪明的', '可爱的', '神秘的', '闪耀的'];
  const nouns = ['小鸟', '飞鸟', '雏鸟', '游侠', '冒险家', '探险者'];
  
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  
  return `${randomAdj}${randomNoun}${randomNum}`;
};
