const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// 获取所有成员（支持搜索）
router.get('/', async (req, res) => {
  const { search } = req.query;
  
  try {
    let sql = 'SELECT id, name, remark, created_at FROM members';
    let params = [];
    
    if (search) {
      sql += ' WHERE CAST(id AS TEXT) LIKE ? OR name LIKE ?';
      const searchPattern = `%${search}%`;
      params = [searchPattern, searchPattern];
    }
    
    sql += ' ORDER BY id';
    
    const members = await db.allAsync(sql, params);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建新成员（需要权限）
router.post('/', requireAuth, async (req, res) => {
  const { name, remark } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '成员姓名不能为空' });
  }

  try {
    const result = await db.runAsync(
      'INSERT INTO members (name, remark) VALUES (?, ?)',
      [name, remark || '']
    );
    
    const newMember = await db.getAsync(
      'SELECT * FROM members WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新成员（需要权限）
router.put('/:id', requireAuth, async (req, res) => {
  const { name, remark } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '成员姓名不能为空' });
  }

  try {
    // 检查成员是否存在
    const existing = await db.getAsync('SELECT id FROM members WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: '成员不存在' });
    }
    
    await db.runAsync(
      'UPDATE members SET name = ?, remark = ? WHERE id = ?',
      [name.trim(), remark || '', req.params.id]
    );
    
    const updated = await db.getAsync(
      'SELECT * FROM members WHERE id = ?',
      [req.params.id]
    );
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除成员（需要权限）
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM members WHERE id = ?', [req.params.id]);
    res.json({ message: '成员已删除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// JSON 批量导入成员（需要权限）
router.post('/import-json', requireAuth, async (req, res) => {
  const { members } = req.body;
  
  if (!Array.isArray(members)) {
    return res.status(400).json({ error: '数据格式错误，需要 { members: [...] }' });
  }
  
  const stats = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: []
  };
  
  try {
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      
      if (!member.name || !member.name.trim()) {
        stats.failed++;
        stats.errors.push(`第 ${i + 1} 行：姓名不能为空`);
        continue;
      }
      
      try {
        if (member.id) {
          // 更新现有成员
          const existing = await db.getAsync('SELECT id FROM members WHERE id = ?', [member.id]);
          if (existing) {
            await db.runAsync(
              'UPDATE members SET name = ?, remark = ? WHERE id = ?',
              [member.name.trim(), member.remark || '', member.id]
            );
            stats.updated++;
          } else {
            stats.failed++;
            stats.errors.push(`第 ${i + 1} 行：ID ${member.id} 不存在`);
          }
        } else {
          // 插入新成员
          await db.runAsync(
            'INSERT INTO members (name, remark) VALUES (?, ?)',
            [member.name.trim(), member.remark || '']
          );
          stats.inserted++;
        }
      } catch (err) {
        stats.failed++;
        stats.errors.push(`第 ${i + 1} 行：${err.message}`);
      }
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
