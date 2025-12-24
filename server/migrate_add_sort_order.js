/**
 * 数据库迁移脚本：为 event_members 表添加 sort_order 字段
 * 执行方式：node server/migrate_add_sort_order.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'game_manager.db');

async function migrate() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ 无法打开数据库:', err.message);
        reject(err);
        return;
      }
      console.log('✅ 已连接到数据库');
    });

    db.serialize(() => {
      // 1. 检查 sort_order 字段是否已存在
      db.all("PRAGMA table_info(event_members)", (err, rows) => {
        if (err) {
          console.error('❌ 查询表结构失败:', err.message);
          db.close();
          reject(err);
          return;
        }

        const hasSortOrder = rows.some(row => row.name === 'sort_order');
        
        if (hasSortOrder) {
          console.log('⚠️  sort_order 字段已存在，跳过迁移');
          db.close();
          resolve();
          return;
        }

        console.log('📝 开始迁移：添加 sort_order 字段...');

        // 2. 添加 sort_order 字段（默认值 0）
        db.run('ALTER TABLE event_members ADD COLUMN sort_order INTEGER DEFAULT 0', (err) => {
          if (err) {
            console.error('❌ 添加字段失败:', err.message);
            db.close();
            reject(err);
            return;
          }

          console.log('✅ 已添加 sort_order 字段');

          // 3. 为现有数据按 member_id ASC 生成 sort_order
          db.all(`
            SELECT DISTINCT event_id 
            FROM event_members 
            ORDER BY event_id
          `, (err, events) => {
            if (err) {
              console.error('❌ 查询事件失败:', err.message);
              db.close();
              reject(err);
              return;
            }

            if (events.length === 0) {
              console.log('✅ 数据库为空，无需迁移数据');
              db.close();
              resolve();
              return;
            }

            console.log(`📊 发现 ${events.length} 个事件，开始迁移数据...`);

            let completed = 0;

            events.forEach((event) => {
              // 获取该事件的所有成员（按 member_id 排序）
              db.all(`
                SELECT id, member_id 
                FROM event_members 
                WHERE event_id = ? 
                ORDER BY member_id ASC
              `, [event.event_id], (err, members) => {
                if (err) {
                  console.error(`❌ 查询事件 ${event.event_id} 的成员失败:`, err.message);
                  return;
                }

                // 更新每个成员的 sort_order
                members.forEach((member, index) => {
                  db.run(`
                    UPDATE event_members 
                    SET sort_order = ? 
                    WHERE id = ?
                  `, [index + 1, member.id], (err) => {
                    if (err) {
                      console.error(`❌ 更新 event_members.id=${member.id} 失败:`, err.message);
                    }
                  });
                });

                completed++;
                console.log(`  ✅ 事件 ${event.event_id}: ${members.length} 个成员已迁移`);

                if (completed === events.length) {
                  console.log('🎉 迁移完成！');
                  db.close((err) => {
                    if (err) {
                      console.error('❌ 关闭数据库失败:', err.message);
                      reject(err);
                    } else {
                      console.log('✅ 数据库已关闭');
                      resolve();
                    }
                  });
                }
              });
            });
          });
        });
      });
    });
  });
}

// 执行迁移
migrate()
  .then(() => {
    console.log('\n✅ 迁移成功完成！');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ 迁移失败:', err);
    process.exit(1);
  });
