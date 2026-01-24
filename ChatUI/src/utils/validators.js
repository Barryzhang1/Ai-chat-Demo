// 验证工具函数

// 检查是否与点餐相关
export const checkOrderRelevance = (text) => {
  const orderKeywords = [
    '点餐', '吃', '菜', '人', '预算', '忌口', '喜好', 
    '辣', '甜', '咸', '价格', '菜单', '推荐', '订单',
    '多少钱', '几个人', '想要', '需要'
  ];
  return orderKeywords.some(keyword => text.includes(keyword));
};

// 验证菜品数据
export const validateDish = (dish) => {
  if (!dish.name || dish.name.trim() === '') {
    return { valid: false, message: '菜品名称不能为空' };
  }
  if (!dish.price || dish.price <= 0) {
    return { valid: false, message: '价格必须大于0' };
  }
  if (dish.stock !== undefined && dish.stock < 0) {
    return { valid: false, message: '库存不能为负数' };
  }
  return { valid: true };
};

// 验证订单数据
export const validateOrder = (order) => {
  if (!order.items || order.items.length === 0) {
    return { valid: false, message: '订单不能为空' };
  }
  return { valid: true };
};
