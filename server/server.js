const express = require('express');
const cors = require('cors');
const path = require('path');

const membersRouter = require('./routes/members');
const eventsRouter = require('./routes/events');
const reportsRouter = require('./routes/reports');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 20002;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// API 路由
app.use('/api/admin', adminRouter);
app.use('/api/members', membersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/reports', reportsRouter);

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API meta 接口（用于健康检查）
app.get('/api/meta', (req, res) => {
  const today = new Date();
  res.json({ 
    status: 'ok',
    today: today.toISOString().split('T')[0],
    timestamp: today.toISOString(),
    version: '2.0.0'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器（监听所有网络接口，允许 Docker 容器访问）
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`
====================================
  游戏成员管理系统 - 服务器已启动
  监听地址: ${HOST}:${PORT}
  时间: ${new Date().toLocaleString('zh-CN')}
  提示: 通过 Nginx Proxy Manager (Docker) 反代访问
====================================
  `);
});
