import { config } from '../config';

const API_BASE_URL = config.apiUrl;

export const categoryApi = {
  // 获取所有类别
  getCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  },

  // 创建类别
  createCategory: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  },

  // 更新类别
  updateCategory: async (id, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update category');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  // 删除类别
  deleteCategory: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  },
};
