# 游戏成员管理系统 V2.0 - 完整项目结构

## 📁 项目目录树

```
game-manager/
├── README.md                    # 项目说明文档
├── CHANGELOG_V2.md              # 第二阶段更新说明
├── start.sh                     # 一键启动脚本 ⭐
├── .gitignore                   # Git忽略配置
│
├── server/                      # 后端服务 (Express + SQLite)
│   ├── package.json            # 后端依赖配置
│   ├── server.js               # 主服务器 (端口: 20002)
│   ├── db.js                   # 数据库连接与初始化
│   ├── schema.sql              # 数据库表结构
│   ├── game_manager.db         # SQLite数据库文件 (自动生成)
│   └── routes/                 # API路由目录
│       ├── members.js          # 成员相关API ⭐ 搜索+JSON导入
│       ├── events.js           # 事件相关API ⭐ 编辑+删除
│       └── reports.js          # 报表相关API ⭐ 多条件筛选
│
└── client/                      # 前端应用 (Vue 3 + Vite)
    ├── package.json            # 前端依赖配置
    ├── vite.config.js          # Vite配置 (端口: 20001, proxy: /api)
    ├── index.html              # HTML入口
    │
    └── src/                    # 源代码目录
        ├── main.js             # 应用入口
        ├── App.vue             # 根组件
        ├── router.js           # 路由配置
        ├── api.js              # API调用封装 ⭐ 相对路径+错误处理
        │
        ├── components/         # 公共组件
        │   └── MatrixCell.vue  # 点阵单元格 ⭐ 多事件+tooltip
        │
        └── views/              # 页面组件
            ├── MatrixView.vue      # 首页点阵 ⭐ 日期切换+Map索引
            ├── MembersView.vue     # 成员管理 ⭐ 搜索+JSON导入
            ├── EventCreate.vue     # 创建事件 ⭐ 全选/清空
            ├── EventDetail.vue     # 事件详情 ⭐ 编辑功能
            └── ReportView.vue      # 报表导出 ⭐ 多条件筛选
```

## 🔑 核心文件说明

### 后端核心

**server/server.js** - 主服务器
- 端口: 20002 (可通过 PORT 环境变量覆盖)
- CORS支持
- 路由挂载
- 错误处理

**server/db.js** - 数据库管理
- SQLite连接
- 自动初始化表结构
- Promise封装 (runAsync/getAsync/allAsync)

**server/routes/members.js** - 成员API
- `GET /api/members?search=` - 搜索成员
- `POST /api/members` - 创建成员
- `POST /api/members/import-json` - JSON批量导入 ⭐
- `DELETE /api/members/:id` - 删除成员

**server/routes/events.js** - 事件API
- `GET /api/events/range?from=&to=` - 获取事件（含完整成员信息）⭐
- `GET /api/events/:id` - 获取事件详情
- `POST /api/events` - 创建事件
- `PUT /api/events/:id` - 更新事件 ⭐
- `POST /api/events/:id/export-txt` - 导出TXT
- `DELETE /api/events/:id` - 删除事件 ⭐

**server/routes/reports.js** - 报表API
- `GET /api/reports/export-csv` - 导出CSV（支持多条件筛选）⭐
- `GET /api/reports/stats` - 获取统计信息

### 前端核心

**client/vite.config.js** - 开发配置
```javascript
{
  port: 20001,
  proxy: {
    '/api': 'http://localhost:20002'  // API代理 ⭐
  }
}
```

**client/src/api.js** - API封装
- 所有请求使用相对路径 `/api/*` ⭐
- 统一错误处理和抛出 ⭐
- 包含所有API方法

**client/src/views/MatrixView.vue** - 点阵视图
- 日期范围切换: 7/14/30/60天 ⭐
- Map索引优化: `${member_id}_${date}` ⭐
- 多事件显示: ≤3显示多个●，>3显示 ●●● +N ⭐
- 错误信息显示 ⭐

**client/src/components/MatrixCell.vue** - 单元格组件
- Tooltip显示事件标题+任务 ⭐
- 智能去重计数 ⭐
- 视觉反馈优化

**client/src/views/MembersView.vue** - 成员管理
- 实时搜索 (ID/姓名) ⭐
- JSON批量导入界面 ⭐
- 导入结果统计显示 ⭐

**client/src/views/EventDetail.vue** - 事件详情
- 编辑模式切换 ⭐
- 成员搜索选择 ⭐
- TXT导出预览

**client/src/views/EventCreate.vue** - 创建事件
- 成员搜索 ⭐
- 全选/清空按钮 ⭐
- 已选计数显示

**client/src/views/ReportView.vue** - 报表导出
- 日期范围筛选 ⭐
- 标题关键词筛选 ⭐
- 成员多选筛选 (下拉菜单) ⭐
- 统计卡片展示

## 🚀 快速启动

### 方式1: 使用启动脚本 (推荐)

```bash
cd ~/Html-Project/3b-manage/game-manager
./start.sh
```

### 方式2: 手动启动

**终端1 - 后端:**
```bash
cd ~/Html-Project/3b-manage/game-manager/server
npm install    # 首次运行
npm start
```

**终端2 - 前端:**
```bash
cd ~/Html-Project/3b-manage/game-manager/client
npm install    # 首次运行
npm run dev
```

## 📊 数据库结构

**members** - 成员表
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
name        TEXT NOT NULL
remark      TEXT
created_at  TEXT DEFAULT CURRENT_TIMESTAMP
```

**events** - 事件表
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
date        TEXT NOT NULL
title       TEXT NOT NULL
task        TEXT
remark      TEXT
created_at  TEXT DEFAULT CURRENT_TIMESTAMP
```

**event_members** - 事件成员关联表
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
event_id    INTEGER NOT NULL (FK -> events.id)
member_id   INTEGER NOT NULL (FK -> members.id)
note        TEXT
UNIQUE(event_id, member_id)
```

## 🔧 开发技巧

### 调试API
后端直接访问: `http://localhost:20002/api/members`

### 查看数据库
```bash
cd server
sqlite3 game_manager.db
sqlite> .schema          # 查看表结构
sqlite> SELECT * FROM members;
sqlite> .quit
```

### 重置数据库
```bash
cd server
rm game_manager.db       # 删除数据库
npm start                # 重启后会自动重建
```

## ⭐ 第二阶段新增功能标记

- ⭐ 端口固定 (20001/20002)
- ⭐ Vite proxy配置
- ⭐ API相对路径
- ⭐ 错误提示增强
- ⭐ 日期范围切换
- ⭐ 多事件显示优化
- ⭐ Tooltip功能
- ⭐ Map索引优化
- ⭐ 事件编辑功能
- ⭐ 成员搜索
- ⭐ JSON批量导入
- ⭐ 全选/清空功能
- ⭐ 多条件筛选

---

**项目状态**: ✅ 生产就绪  
**最后更新**: 2025-12-15  
**版本**: 2.0.0
