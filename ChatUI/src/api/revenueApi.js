import { config } from '../config';
import { authUtils } from '../utils/auth';

const API_BASE_URL = config.apiUrl;

/**
 * 收入管理 API
 */
export const revenueApi = {
  /**
   * 获取当日收入统计
   * @param {string} date - 查询日期 (YYYY-MM-DD)，可选
   * @returns {Promise<Object>} 当日统计数据
   */
  getTodayStats: async (date) => {
    const queryString = date ? `?date=${date}` : '';
    const response = await fetch(`${API_BASE_URL}/revenue/stats/today${queryString}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  /**
   * 获取月度收入统计
   * @param {string} date - 查询月份 (YYYY-MM)，可选
   * @returns {Promise<Object>} 月度统计数据
   */
  getMonthStats: async (date) => {
    const queryString = date ? `?date=${date}` : '';
    const response = await fetch(`${API_BASE_URL}/revenue/stats/month${queryString}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  /**
   * 获取总体收入统计
   * @returns {Promise<Object>} 总体统计数据
   */
  getTotalStats: async () => {
    const response = await fetch(`${API_BASE_URL}/revenue/stats/total`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  /**
   * 批量创建额外收支记录
   * @param {Array<Object>} transactions - 交易记录列表
   * @returns {Promise<Object>} 创建结果
   */
  batchCreateTransactions: async (transactions) => {
    const response = await fetch(`${API_BASE_URL}/revenue/transactions/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
      body: JSON.stringify({ transactions }),
    });
    return await response.json();
  },

  /**
   * 查询额外收支列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 收支列表和统计数据
   */
  queryTransactions: async (params = {}) => {
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    const url = queryString
      ? `${API_BASE_URL}/revenue/transactions?${queryString}`
      : `${API_BASE_URL}/revenue/transactions`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  /**
   * 删除额外收支记录
   * @param {string} id - 记录ID
   * @returns {Promise<Object>} 删除结果
   */
  deleteTransaction: async (id) => {
    const response = await fetch(`${API_BASE_URL}/revenue/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },
};
