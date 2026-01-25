import { config } from '../config';

const API_BASE_URL = config.apiUrl;

export const dishApi = {
  // 获取菜品列表
  getDishes: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dish`);
      return await response.json();
    } catch (error) {
      console.error('Get dishes error:', error);
      throw error;
    }
  },

  // 创建新菜品
  createDish: async (dishData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dishData),
      });
      return await response.json();
    } catch (error) {
      console.error('Create dish error:', error);
      throw error;
    }
  },

  // 更新菜品状态
  updateDishStatus: async (id, statusUpdate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dish/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate),
      });
      if (!response.ok) {
        throw new Error('Failed to update dish status');
      }
      return await response.json();
    } catch (error) {
      console.error('Update dish status error:', error);
      throw error;
    }
  },

  // 更新菜品信息
  updateDish: async (id, dishData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dish/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dishData),
      });
      if (!response.ok) {
        throw new Error('Failed to update dish');
      }
      return await response.json();
    } catch (error) {
      console.error('Update dish error:', error);
      throw error;
    }
  },
};
