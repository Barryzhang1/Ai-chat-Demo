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

const purchaseOrderApi = {
  // 获取进货单列表
  getPurchaseOrderList: async (params) => {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_BASE_URL}/purchase-order${queryString}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  // 获取进货单详情
  getPurchaseOrderDetail: async (id) => {
    const response = await fetch(`${API_BASE_URL}/purchase-order/${id}`, {
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },

  // 创建进货单
  createPurchaseOrder: async (data) => {
    const response = await fetch(`${API_BASE_URL}/purchase-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  // 审批进货单
  approvePurchaseOrder: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/purchase-order/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  // 入库确认
  receivePurchaseOrder: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/purchase-order/${id}/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },

  // 删除进货单
  deletePurchaseOrder: async (id) => {
    const response = await fetch(`${API_BASE_URL}/purchase-order/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authUtils.getToken()}`,
      },
    });
    return await response.json();
  },
};

export default purchaseOrderApi;
