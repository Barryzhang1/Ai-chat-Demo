import { config } from '../config';
import { authUtils } from '../utils/auth';

const API_BASE_URL = config.apiUrl;

/**
 * 用户管理API
 */
export const usersApi = {
  /**
   * 获取所有用户列表
   * @returns {Promise} 用户列表
   */
  getAllUsers: async () => {
    try {
      const token = authUtils.getToken();
      const response = await fetch(`${API_BASE_URL}/users/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '获取用户列表失败');
      }

      return await response.json();
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  },

  /**
   * 更新用户角色
   * @param {string} userId - 用户ID
   * @param {string} role - 新角色 (BOSS/STAFF/USER)
   * @returns {Promise} 更新后的用户信息
   */
  updateUserRole: async (userId, role) => {
    try {
      const token = authUtils.getToken();
      const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '更新用户角色失败');
      }

      return await response.json();
    } catch (error) {
      console.error('更新用户角色失败:', error);
      throw error;
    }
  },
};
