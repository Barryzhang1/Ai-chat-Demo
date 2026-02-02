import { config } from '../../config';
import { authUtils } from '../../utils/auth';

const API_BASE_URL = config.apiUrl;

const buildQueryString = (params) => {
  if (!params) return '';
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return query ? `?${query}` : '';
};

const inventoryApi = {
  // 获取库存列表
  getInventoryList: async (params) => {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_BASE_URL}/inventory${queryString}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  // 获取库存详情
  getInventoryDetail: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  // 创建库存项目
  createInventory: async (data) => {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  // 更新库存项目
  updateInventory: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  // 删除库存项目
  deleteInventory: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  // 获取库存历史
  getInventoryHistory: async (params) => {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_BASE_URL}/inventory/history/list${queryString}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  // 获取食材消耗记录（订单消耗）
  getConsumeHistory: async (inventoryId, page = 1, pageSize = 20) => {
    const queryString = buildQueryString({ page, pageSize });
    const response = await fetch(`${API_BASE_URL}/inventory/${inventoryId}/consume-history${queryString}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },
};

export default inventoryApi;
