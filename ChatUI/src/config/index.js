// 环境变量配置
export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  appName: process.env.REACT_APP_NAME || '点餐系统',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
