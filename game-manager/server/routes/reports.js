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

// 获取任务参与统计（按任务、成员、日期范围）
router.get('/task-participation', requireAuth, async (req, res) => {
  const { from, to, taskName, memberIds } = req.query;
  
  try {
    let sql = `
      SELECT 
        e.task,
        m.id as member_id,
        m.name as member_name,
        COUNT(DISTINCT e.id) as participation_count,
        MIN(e.date) as first_date,
        MAX(e.date) as last_date
      FROM events e
      JOIN event_members em ON e.id = em.event_id
      JOIN members m ON em.member_id = m.id
      WHERE e.task IS NOT NULL AND e.task != ''
    `;
    
    let params = [];
    
    // 日期范围过滤
    if (from && to) {
      sql += ' AND e.date BETWEEN ? AND ?';
      params.push(from, to);
    }
    
    // 任务名称过滤
    if (taskName) {
      sql += ' AND e.task = ?';
      params.push(taskName);
    }
    
    // 成员过滤
    if (memberIds) {
      const ids = memberIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        sql += ` AND m.id IN (${ids.join(',')})`;
      }
    }
    
    sql += ' GROUP BY e.task, m.id ORDER BY e.task, participation_count DESC, m.name';
    
    const stats = await db.allAsync(sql, params);
    res.json(stats);
  } catch (error) {
    console.error('[GET /api/reports/task-participation] 错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 导出任务参与统计CSV
router.get('/export-task-participation-csv', requireAuth, async (req, res) => {
  const { from, to, taskName } = req.query;
  
  try {
    let sql = `
      SELECT 
        e.task,
        m.id as member_id,
        m.name as member_name,
        COUNT(DISTINCT e.id) as participation_count,
        MIN(e.date) as first_date,
        MAX(e.date) as last_date
      FROM events e
      JOIN event_members em ON e.id = em.event_id
      JOIN members m ON em.member_id = m.id
      WHERE e.task IS NOT NULL AND e.task != ''
    `;
    
    let params = [];
    
    if (from && to) {
      sql += ' AND e.date BETWEEN ? AND ?';
      params.push(from, to);
    }
    
    if (taskName) {
      sql += ' AND e.task = ?';
      params.push(taskName);
    }
    
    sql += ' GROUP BY e.task, m.id ORDER BY e.task, participation_count DESC, m.name';
    
    const stats = await db.allAsync(sql, params);
    
    // 生成 CSV
    let csv = '任务,成员ID,成员姓名,参与次数,首次参与,最近参与\n';
    
    stats.forEach(stat => {
      csv += `"${stat.task}",${stat.member_id},"${stat.member_name}",${stat.participation_count},${stat.first_date},${stat.last_date}\n`;
    });
    
    res.type('text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="task_participation_${from}_${to}.csv"`);
    res.send('\uFEFF' + csv); // 添加 BOM 以支持 Excel 中文显示
  } catch (error) {
    console.error('[GET /api/reports/export-task-participation-csv] 错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取成员参与统计汇总（按成员聚合，显示各任务参与次数和总次数）
router.get('/member-participation-summary', requireAuth, async (req, res) => {
  const { from, to, memberIds } = req.query;
  
  try {
    let sql = `
      SELECT 
        m.id as member_id,
        m.name as member_name,
        e.task,
        COUNT(DISTINCT e.id) as task_count
      FROM events e
      JOIN event_members em ON e.id = em.event_id
      JOIN members m ON em.member_id = m.id
      WHERE e.task IS NOT NULL AND e.task != ''
    `;
    
    let params = [];
    
    // 日期范围过滤
    if (from && to) {
      sql += ' AND e.date BETWEEN ? AND ?';
      params.push(from, to);
    }
    
    // 成员过滤
    if (memberIds) {
      const ids = memberIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        sql += ` AND m.id IN (${ids.join(',')})`;
      }
    }
    
    sql += ' GROUP BY m.id, e.task ORDER BY m.id, e.task';
    
    const stats = await db.allAsync(sql, params);
    res.json(stats);
  } catch (error) {
    console.error('[GET /api/reports/member-participation-summary] 错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 导出成员参与统计汇总为CSV
router.get('/export-member-summary-csv', requireAuth, async (req, res) => {
  const { from, to } = req.query;
  
  try {
    let sql = `
      SELECT 
        m.id as member_id,
        m.name as member_name,
        e.task,
        COUNT(DISTINCT e.id) as task_count
      FROM events e
      JOIN event_members em ON e.id = em.event_id
      JOIN members m ON em.member_id = m.id
      WHERE e.task IS NOT NULL AND e.task != ''
    `;
    
    let params = [];
    
    if (from && to) {
      sql += ' AND e.date BETWEEN ? AND ?';
      params.push(from, to);
    }
    
    sql += ' GROUP BY m.id, e.task ORDER BY m.id, e.task';
    
    const rawData = await db.allAsync(sql, params);
    
    // 处理数据：按成员分组
    const memberMap = new Map();
    const taskSet = new Set();
    
    rawData.forEach(record => {
      taskSet.add(record.task);
      
      if (!memberMap.has(record.member_id)) {
        memberMap.set(record.member_id, {
          member_id: record.member_id,
          member_name: record.member_name,
          tasks: {},
          total_count: 0
        });
      }
      
      const member = memberMap.get(record.member_id);
      member.tasks[record.task] = record.task_count;
      member.total_count += record.task_count;
    });
    
    const members = Array.from(memberMap.values()).sort((a, b) => b.total_count - a.total_count);
    const tasks = Array.from(taskSet).sort();
    
    // 生成 CSV
    let csv = 'ID,成员姓名';
    tasks.forEach(task => {
      csv += `,"${task}"`;
    });
    csv += ',总参与次数\n';
    
    members.forEach(member => {
      csv += `${member.member_id},"${member.member_name}"`;
      tasks.forEach(task => {
        csv += `,${member.tasks[task] || 0}`;
      });
      csv += `,${member.total_count}\n`;
    });
    
    res.type('text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="member_summary_${from}_${to}.csv"`);
    res.send('\uFEFF' + csv); // 添加 BOM 以支持 Excel 中文显示
  } catch (error) {
    console.error('[GET /api/reports/export-member-summary-csv] 错误:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
