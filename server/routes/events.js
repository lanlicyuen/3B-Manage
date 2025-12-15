const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// 获取事件列表（支持搜索和日期过滤，返回事件及参与人数）
router.get('/', async (req, res) => {
  const { from, to, q } = req.query;
  
  try {
    let sql = `
      SELECT 
        e.id,
        e.date,
        e.title,
        e.task,
        e.remark,
        e.created_at,
        COUNT(em.member_id) as member_count
      FROM events e
      LEFT JOIN event_members em ON e.id = em.event_id
    `;
    
    let conditions = [];
    let params = [];
    
    // 日期范围过滤
    if (from && to) {
      conditions.push('e.date BETWEEN ? AND ?');
      params.push(from, to);
    } else {
      // 默认返回最近365天
      const today = new Date().toISOString().split('T')[0];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const yearAgoStr = oneYearAgo.toISOString().split('T')[0];
      conditions.push('e.date BETWEEN ? AND ?');
      params.push(yearAgoStr, today);
    }
    
    // 标题搜索
    if (q) {
      conditions.push('e.title LIKE ?');
      params.push(`%${q}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY e.id ORDER BY e.date DESC';
    
    const events = await db.allAsync(sql, params);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取事件列表（支持日期范围筛选，返回完整成员信息）
router.get('/range', async (req, res) => {
  const { from, to } = req.query;
  
  try {
    let sql = `
      SELECT 
        e.id as event_id,
        e.date,
        e.title,
        e.task,
        e.remark,
        m.id as member_id,
        m.name as member_name,
        em.note as member_note
      FROM events e
      LEFT JOIN event_members em ON e.id = em.event_id
      LEFT JOIN members m ON em.member_id = m.id
    `;
    
    let params = [];
    
    if (from && to) {
      sql += ' WHERE e.date BETWEEN ? AND ?';
      params = [from, to];
    }
    
    sql += ' ORDER BY e.date DESC, e.id, m.id';
    
    const rows = await db.allAsync(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个事件详情（包含参与成员）
router.get('/:id', async (req, res) => {
  try {
    const event = await db.getAsync(
      'SELECT * FROM events WHERE id = ?',
      [req.params.id]
    );
    
    if (!event) {
      return res.status(404).json({ error: '事件不存在' });
    }
    
    const members = await db.allAsync(`
      SELECT m.id, m.name, em.note
      FROM event_members em
      JOIN members m ON em.member_id = m.id
      WHERE em.event_id = ?
      ORDER BY m.id
    `, [req.params.id]);
    
    res.json({ ...event, members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新事件（需要权限）
router.put('/:id', requireAuth, async (req, res) => {
  const { date, title, task, remark, memberIds } = req.body;
  
  if (!date || !title) {
    return res.status(400).json({ error: '日期和标题不能为空' });
  }

  try {
    // 检查事件是否存在
    const existing = await db.getAsync('SELECT id FROM events WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: '事件不存在' });
    }
    
    // 更新事件
    await db.runAsync(
      'UPDATE events SET date = ?, title = ?, task = ?, remark = ? WHERE id = ?',
      [date, title, task || '', remark || '', req.params.id]
    );
    
    // 删除旧的成员关联
    await db.runAsync('DELETE FROM event_members WHERE event_id = ?', [req.params.id]);
    
    // 插入新的成员关联
    if (memberIds && memberIds.length > 0) {
      for (const memberId of memberIds) {
        await db.runAsync(
          'INSERT INTO event_members (event_id, member_id) VALUES (?, ?)',
          [req.params.id, memberId]
        );
      }
    }
    
    // 返回更新后的完整信息
    const event = await db.getAsync('SELECT * FROM events WHERE id = ?', [req.params.id]);
    const members = await db.allAsync(`
      SELECT m.id, m.name, em.note
      FROM event_members em
      JOIN members m ON em.member_id = m.id
      WHERE em.event_id = ?
    `, [req.params.id]);
    
    res.json({ ...event, members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建新事件（需要权限）
router.post('/', requireAuth, async (req, res) => {
  const { date, title, task, remark, memberIds } = req.body;
  
  if (!date || !title) {
    return res.status(400).json({ error: '日期和标题不能为空' });
  }

  try {
    // 插入事件
    const result = await db.runAsync(
      'INSERT INTO events (date, title, task, remark) VALUES (?, ?, ?, ?)',
      [date, title, task || '', remark || '']
    );
    
    const eventId = result.lastID;
    
    // 插入事件成员关联
    if (memberIds && memberIds.length > 0) {
      for (const memberId of memberIds) {
        await db.runAsync(
          'INSERT INTO event_members (event_id, member_id) VALUES (?, ?)',
          [eventId, memberId]
        );
      }
    }
    
    // 返回完整事件信息
    const event = await db.getAsync('SELECT * FROM events WHERE id = ?', [eventId]);
    const members = await db.allAsync(`
      SELECT m.id, m.name
      FROM event_members em
      JOIN members m ON em.member_id = m.id
      WHERE em.event_id = ?
    `, [eventId]);
    
    res.status(201).json({ ...event, members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 导出事件为 TXT（需要权限）
router.post('/:id/export-txt', requireAuth, async (req, res) => {
  try {
    const event = await db.getAsync(
      'SELECT * FROM events WHERE id = ?',
      [req.params.id]
    );
    
    if (!event) {
      return res.status(404).json({ error: '事件不存在' });
    }
    
    const members = await db.allAsync(`
      SELECT m.id, m.name, em.note
      FROM event_members em
      JOIN members m ON em.member_id = m.id
      WHERE em.event_id = ?
      ORDER BY m.id
    `, [req.params.id]);
    
    // 生成 TXT 内容
    let txt = '[Event]\n';
    txt += `Date: ${event.date}\n`;
    txt += `Title: ${event.title}\n`;
    txt += `Task: ${event.task || ''}\n`;
    txt += `Remark: ${event.remark || ''}\n\n`;
    txt += '[Members]\n';
    
    members.forEach(m => {
      txt += `${String(m.id).padStart(3, '0')} ${m.name}`;
      if (m.note) txt += ` (${m.note})`;
      txt += '\n';
    });
    
    res.type('text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="event_${event.id}_${event.date}.txt"`);
    res.send(txt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除事件（需要权限）
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: '事件已删除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
