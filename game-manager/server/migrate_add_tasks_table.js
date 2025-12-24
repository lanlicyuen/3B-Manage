const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'game_manager.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  } else {
    console.log('已连接到数据库');
    migrate();
  }
});

function migrate() {
  db.serialize(() => {
    // 创建任务定义表
    db.run(`
      CREATE TABLE IF NOT EXISTS task_definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('创建任务定义表失败:', err.message);
        process.exit(1);
      } else {
        console.log('✓ 任务定义表创建成功');
      }
    });

    // 插入一些默认任务
    const defaultTasks = [
      { name: '空城首占', category: '公会战', description: '空城首次占领', sort_order: 1 },
      { name: '城池争夺', category: '公会战', description: '城池争夺战', sort_order: 2 },
      { name: '防守战', category: '公会战', description: '城池防守', sort_order: 3 },
      { name: '副本推进', category: '副本', description: '副本进度推进', sort_order: 4 },
      { name: 'BOSS挑战', category: '副本', description: 'BOSS战斗', sort_order: 5 },
      { name: '世界BOSS', category: '活动', description: '世界BOSS活动', sort_order: 6 },
      { name: '公会任务', category: '日常', description: '公会日常任务', sort_order: 7 },
      { name: '其他活动', category: '其他', description: '其他类型活动', sort_order: 8 }
    ];

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO task_definitions (name, category, description, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    defaultTasks.forEach(task => {
      stmt.run([task.name, task.category, task.description, task.sort_order], (err) => {
        if (err) {
          console.error(`插入任务 ${task.name} 失败:`, err.message);
        } else {
          console.log(`✓ 添加默认任务: ${task.name} (${task.category})`);
        }
      });
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('完成插入时出错:', err.message);
        process.exit(1);
      } else {
        console.log('\n✓ 数据库迁移完成！');
        console.log('现在可以在创建事件时从预定义任务中选择。');
        db.close();
      }
    });
  });
}
