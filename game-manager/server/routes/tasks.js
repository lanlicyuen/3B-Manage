const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

// 获取所有任务定义（公开接口）
router.get('/', async (req, res) => {
  try {
    const tasks = await db.allAsync(`
      SELECT id, name, category, description, sort_order
      FROM task_definitions
      WHERE is_active = 1
      ORDER BY sort_order ASC, name ASC
    `);
    res.json(tasks);
  } catch (error) {
    console.error('[GET /api/tasks] 错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取任务分类列表
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.allAsync(`
      SELECT DISTINCT category
      FROM task_definitions
      WHERE is_active = 1 AND category IS NOT NULL
      ORDER BY category ASC
    `);
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('[GET /api/tasks/categories] 错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建新任务定义（需要管理员权限）
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, category, description, sort_order } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '任务名称不能为空' });
  }

  try {
    const result = await db.runAsync(`
      INSERT INTO task_definitions (name, category, description, sort_order)
      VALUES (?, ?, ?, ?)
    `, [
      name.trim(),
      category || null,
      description || null,
      sort_order || 0
    ]);
    
    res.status(201).json({
      id: result.lastID,
      name: name.trim(),
      category,
      description,
      sort_order: sort_order || 0
    });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      res.status(400).json({ error: '任务名称已存在' });
    } else {
      console.error('[POST /api/tasks] 错误:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

// 更新任务定义（需要管理员权限）
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { name, category, description, sort_order, is_active } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '任务名称不能为空' });
  }

  try {
    await db.runAsync(`
      UPDATE task_definitions
      SET name = ?, category = ?, description = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `, [
      name.trim(),
      category || null,
      description || null,
      sort_order || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      req.params.id
    ]);
    
    res.json({ success: true });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      res.status(400).json({ error: '任务名称已存在' });
    } else {
      console.error('[PUT /api/tasks/:id] 错误:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

// 删除任务定义（软删除，需要管理员权限）
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.runAsync(`
      UPDATE task_definitions
      SET is_active = 0
      WHERE id = ?
    `, [req.params.id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/tasks/:id] 错误:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
