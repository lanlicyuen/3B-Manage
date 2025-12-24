/**
 * 管理员权限中间件
 * 用于保护需要管理员权限的 API 接口
 */

const { verifyToken } = require('./auth');

/**
 * 验证管理员 Token
 * @param {Object} req Express 请求对象
 * @param {Object} res Express 响应对象
 * @param {Function} next 下一个中间件
 */
function requireAdmin(req, res, next) {
  // 优先检查 X-Admin-Token
  let token = req.headers['x-admin-token'];
  
  // 如果没有 X-Admin-Token，则从 Authorization header 中提取
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    return res.status(401).json({ 
      error: '需要管理员权限',
      message: '请提供管理员令牌'
    });
  }
  
  // 使用 auth 中间件的 verifyToken 方法验证
  if (!verifyToken(token)) {
    return res.status(403).json({ 
      error: '权限不足',
      message: '管理员令牌无效或已过期'
    });
  }
  
  // 验证通过，继续处理请求
  next();
}

module.exports = { requireAdmin };
