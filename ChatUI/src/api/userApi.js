// User API - 用户相关接口
import { config } from '../config';

const API_BASE_URL = config.apiUrl;

export const userApi = {
  // 用户注册
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  // 获取用户信息
  getUserInfo: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
    }
  },
};
