const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// 导出 CSV 报表（支持多条件筛选，需要权限）
router.get('/export-csv', requireAuth, async (req, res) => {
  const { from, to, titleLike, memberIds } = req.query;
  
  try {
    let sql = `
      SELECT 
        e.id as event_id,
        e.date,
        e.title,
        e.task,
        e.remark as event_remark,
        m.id as member_id,
        m.name as member_name,
        em.note as member_note
      FROM events e
      JOIN event_members em ON e.id = em.event_id
      JOIN members m ON em.member_id = m.id
    `;
    
    let conditions = [];
    let params = [];
    
    if (from && to) {
      conditions.push('e.date BETWEEN ? AND ?');
      params.push(from, to);
    }
    
    if (titleLike) {
      conditions.push('e.title LIKE ?');
      params.push(`%${titleLike}%`);
    }
    
    if (memberIds) {
      const ids = memberIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        conditions.push(`m.id IN (${ids.join(',')})`);
      }
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY e.date, e.id, m.id';
    
    const records = await db.allAsync(sql, params);
    
    // 生成 CSV
    let csv = 'date,title,task,event_remark,member_id,member_name,member_note\n';
    
    records.forEach(r => {
      csv += `"${r.date}","${r.title}","${r.task || ''}","${r.event_remark || ''}",${r.member_id},"${r.member_name}","${r.member_note || ''}"\n`;
    });
    
    res.type('text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
    res.send('\uFEFF' + csv); // 添加 BOM 以支持 Excel 中文显示
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    const memberCount = await db.getAsync('SELECT COUNT(*) as count FROM members');
    const eventCount = await db.getAsync('SELECT COUNT(*) as count FROM events');
    
    res.json({
      totalMembers: memberCount.count,
      totalEvents: eventCount.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
