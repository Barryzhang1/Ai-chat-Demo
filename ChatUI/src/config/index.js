// 环境变量配置
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// 获取默认的 Socket URL
const getDefaultSocketUrl = () => {
  // 开发环境默认使用 3001 端口
  if (isDevelopment) {
    return 'http://localhost:3001';
  }
  // 生产环境使用当前域名
  return window.location.origin;
};

export const config = {
  // API 基础地址，生产环境使用相对路径通过 nginx 代理，开发环境使用环境变量
  apiUrl: process.env.REACT_APP_API_URL || (isDevelopment ? 'http://localhost:3001/api' : '/api'),
  // Socket.IO 服务器地址，开发环境需要指定完整地址，生产环境通过 nginx 代理
  socketUrl: process.env.REACT_APP_SOCKET_URL || getDefaultSocketUrl(),
  appName: '点餐系统',
  isDevelopment,
  isProduction,
};
