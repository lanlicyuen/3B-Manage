/**
 * 管理员权限中间件
 * 用于保护需要管理员权限的 API 接口
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aA12345aA';

/**
 * 验证管理员 Token
 * @param {Object} req Express 请求对象
 * @param {Object} res Express 响应对象
 * @param {Function} next 下一个中间件
 */
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  
  if (!token) {
    return res.status(401).json({ 
      error: '需要管理员权限',
      message: '请提供管理员令牌'
    });
  }
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(403).json({ 
      error: '权限不足',
      message: '管理员令牌无效'
    });
  }
  
  // 验证通过，继续处理请求
  next();
}

module.exports = { requireAdmin };
