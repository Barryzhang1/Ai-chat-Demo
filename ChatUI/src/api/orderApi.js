// Order API - 订单相关接口
import { config } from '../config';

const API_BASE_URL = config.apiUrl;

export const orderApi = {
  // 创建订单
  createOrder: async (orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      return await response.json();
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  // 获取订单列表
  getOrders: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      return await response.json();
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },

  // 获取订单详情
  getOrderById: async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      return await response.json();
    } catch (error) {
      console.error('Get order error:', error);
      throw error;
    }
  },
};
