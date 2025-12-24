// 认证中间件
const tokens = new Map(); // 内存存储token（重启后失效）

// 生成随机token
function generateToken() {
  return 'admin_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 创建token
function createToken(userId = 'admin') {
  const token = generateToken();
  tokens.set(token, {
    userId,
    createdAt: new Date()
  });
  return token;
}

// 验证token
function verifyToken(token) {
  return tokens.has(token);
}

// 删除token
function removeToken(token) {
  tokens.delete(token);
}

// 认证中间件
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '需要总督登录' });
  }
  
  const token = authHeader.substring(7);
  
  if (!verifyToken(token)) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
  
  req.userId = 'admin';
  next();
}

module.exports = {
  createToken,
  verifyToken,
  removeToken,
  requireAuth
};
