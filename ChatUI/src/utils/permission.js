// 权限管理工具函数
import { authUtils } from './auth';

/**
 * 解析 JWT Token 获取用户信息
 * @param {string} token - JWT Token
 * @returns {object|null} 解析后的用户信息
 */
export const parseJWT = (token) => {
  if (!token) return null;
  
  try {
    // JWT 格式：header.payload.signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
};

/**
 * 获取当前用户角色
 * @returns {string|null} 用户角色 'BOSS' | 'STAFF' | 'USER' | null
 */
export const getUserRole = () => {
  const token = authUtils.getToken();
  if (!token) return null;
  
  const payload = parseJWT(token);
  return payload?.role || null;
};

/**
 * 检查用户是否有指定角色
 * @param {string|string[]} allowedRoles - 允许的角色
 * @returns {boolean} 是否有权限
 */
export const hasRole = (allowedRoles) => {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(userRole);
};

/**
 * 检查用户是否可以访问商家后台
 * @returns {boolean} 是否可以访问
 */
export const canAccessMerchant = () => {
  return hasRole(['BOSS', 'STAFF']);
};

/**
 * 检查用户是否是 BOSS
 * @returns {boolean} 是否是 BOSS
 */
export const isBoss = () => {
  return hasRole('BOSS');
};

/**
 * 检查用户是否是 STAFF
 * @returns {boolean} 是否是 STAFF
 */
export const isStaff = () => {
  return hasRole('STAFF');
};

/**
 * 检查用户是否是普通用户
 * @returns {boolean} 是否是普通用户
 */
export const isUser = () => {
  return hasRole('USER');
};

/**
 * 获取当前用户信息（从 Token 中解析）
 * @returns {object|null} 用户信息
 */
export const getCurrentUser = () => {
  const token = authUtils.getToken();
  if (!token) return null;
  
  return parseJWT(token);
};
