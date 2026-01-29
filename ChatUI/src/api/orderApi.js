// Order API - 订单相关接口
import { config } from '../config';
import { authUtils } from '../utils/auth';

const API_BASE_URL = config.apiUrl;

// Helper to get headers with token
const getHeaders = () => {
  const token = authUtils.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const orderApi = {
  // AI 智能点餐
  aiOrder: async (message) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordering/ai-order`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'AI 请求失败');
      return data;
    } catch (error) {
      console.error('AI Order error:', error);
      throw error;
    }
  },

  // 获取聊天历史
  getChatHistory: async (limit = 20) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordering/chat-history?limit=${limit}`, {
        headers: getHeaders(),
      });
      if (response.status === 404) return { data: [] }; // Handle no history gracefully
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '获取聊天历史失败');
      return data;
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error;
    }
  },

  // 刷新菜单 (清空上下文)
  refreshMenu: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordering/refresh-menu`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '刷新菜单失败');
      return data;
    } catch (error) {
      console.error('Refresh menu error:', error);
      throw error;
    }
  },

  // 创建订单 (AI 推荐的购物车转订单)
  createOrderFromCart: async (orderData) => {
     try {
      const response = await fetch(`${API_BASE_URL}/ordering/create-order`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(orderData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '创建订单失败');
      return data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  // 获取购物车
  getCart: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordering/cart`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '获取购物车失败');
      return data;
    } catch (error) {
      console.error('Get cart error:', error);
      throw error;
    }
  },

  // 创建订单 (原有接口，保留但可能需要鉴权)
  createOrder: async (orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordering/create-order`, {
        method: 'POST',
        headers: getHeaders(), // Use getHeaders
        body: JSON.stringify(orderData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '创建订单失败');
      return data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  // 获取订单列表
  getOrders: async (params = {}) => {
    try {
      const { page = 1, limit = 10, status } = params;
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (status) {
        queryParams.append('status', status);
      }
      
      const response = await fetch(
        `${API_BASE_URL}/ordering/orders?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '获取订单列表失败');
      return data;
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

  // 修改订单状态
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ordering/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '修改订单状态失败');
      return data;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  },
};
