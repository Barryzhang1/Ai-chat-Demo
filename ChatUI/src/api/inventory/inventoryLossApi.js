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

const inventoryLossApi = {
  // 获取损耗记录列表
  getInventoryLossList: async (params) => {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_BASE_URL}/inventory-loss${queryString}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  // 获取损耗记录详情
  getInventoryLossDetail: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory-loss/${id}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  // 创建损耗记录
  createInventoryLoss: async (data) => {
    const response = await fetch(`${API_BASE_URL}/inventory-loss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  // 删除损耗记录
  deleteInventoryLoss: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory-loss/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },
};

export default inventoryLossApi;
