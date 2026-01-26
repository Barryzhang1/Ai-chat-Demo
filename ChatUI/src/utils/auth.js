// Cookie 操作工具
const TOKEN_KEY = 'chat_token';

export const authUtils = {
  // 设置 Token
  setToken: (token, days = 1) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${TOKEN_KEY}=${token};path=/;expires=${expires.toUTCString()}`;
    // 同时也存入 localStorage 作为一个备份，或者为了兼容旧代码（如果有的话使用了 localStorage）
    localStorage.setItem(TOKEN_KEY, token);
  },

  // 获取 Token
  getToken: () => {
    const name = TOKEN_KEY + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
  },

  // 清除 Token
  removeToken: () => {
    document.cookie = `${TOKEN_KEY}=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    localStorage.removeItem(TOKEN_KEY);
    // 清除旧的 localStorage 数据
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
  },
  
  // 检查是否已登录
  isAuthenticated: () => {
      return !!authUtils.getToken();
  }
};
