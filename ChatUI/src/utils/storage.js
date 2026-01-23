// LocalStorage 工具函数
export const storage = {
  // 获取用户名
  getUserName: () => {
    return localStorage.getItem('userName');
  },

  // 设置用户名
  setUserName: (name) => {
    localStorage.setItem('userName', name);
  },

  // 清除用户名
  clearUserName: () => {
    localStorage.removeItem('userName');
  },

  // 获取用户角色
  getUserRole: () => {
    return localStorage.getItem('userRole');
  },

  // 设置用户角色
  setUserRole: (role) => {
    localStorage.setItem('userRole', role);
  },

  // 清除所有用户数据
  clearAll: () => {
    localStorage.clear();
  },
};
