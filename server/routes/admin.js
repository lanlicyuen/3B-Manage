const express = require('express');
const router = express.Router();
const { createToken, removeToken } = require('../middleware/auth');

// 预设密码（从环境变量读取，如未设置则使用默认值）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aA12345aA';

// 管理员登录
router.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '密码错误' });
  }
  
  const token = createToken();
  res.json({ 
    token,
    message: '登录成功',
    role: 'admin'
  });
});

// 退出登录
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    removeToken(token);
  }
  res.json({ message: '已退出' });
});

module.exports = router;
