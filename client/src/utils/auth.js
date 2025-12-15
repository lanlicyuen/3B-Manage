/**
 * 权限管理模块
 * 负责管理员登录状态、密码验证、Token 管理
 */

const ADMIN_KEY = 'isAdmin';
const TOKEN_KEY = 'adminToken';
const ADMIN_PASSWORD = 'aA12345aA'; // 与后端环境变量保持一致

/**
 * 检查是否已登录
 */
export function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === '1';
}

/**
 * 获取管理员 Token
 */
export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 管理员登录
 * @param {string} password 密码
 * @returns {boolean} 是否登录成功
 */
export function login(password) {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_KEY, '1');
    localStorage.setItem(TOKEN_KEY, password);
    return true;
  }
  return false;
}

/**
 * 管理员登出
 */
export function logout() {
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 权限检查装饰器（用于按钮点击事件）
 * @param {Function} handler 原始处理函数
 * @returns {Function} 包装后的函数
 */
export function requireAuth(handler) {
  return function(...args) {
    if (!isAdmin()) {
      alert('需要管理员权限，请先登录');
      return;
    }
    return handler.apply(this, args);
  };
}
