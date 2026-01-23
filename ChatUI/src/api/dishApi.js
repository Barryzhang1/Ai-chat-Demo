// Dish API - 菜品相关接口
import { config } from '../config';

const API_BASE_URL = config.apiUrl;

export const dishApi = {
  // 获取菜品列表
  getDishes: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dishes`);
      return await response.json();
    } catch (error) {
      console.error('Get dishes error:', error);
      throw error;
    }
  },

  // 根据需求生成推荐菜单
  getRecommendedMenu: async (requirements) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dishes/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requirements),
      });
      return await response.json();
    } catch (error) {
      console.error('Get recommended menu error:', error);
      throw error;
    }
  },

  // 创建新菜品
  createDish: async (dishData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dishes`, {
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

  // 更新菜品库存
  updateDishStock: async (dishId, stock) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dishes/${dishId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock }),
      });
      return await response.json();
    } catch (error) {
      console.error('Update dish stock error:', error);
      throw error;
    }
  },
};
