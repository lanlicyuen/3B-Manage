# 3B-Manage 任务管理功能更新说明

## 更新日期
2024-12-24

## 功能概述

本次更新为3B-Manage项目添加了预定义任务管理和任务参与统计功能，实现以下改进：

### 1. 预定义任务系统
- ✅ 创建事件时从下拉列表选择任务（替代自由输入）
- ✅ 任务按分类组织（公会战、副本、活动、日常、其他）
- ✅ 固定任务名称，便于后续统计和分析
- ✅ 支持任务的增删改管理（需要管理员权限）

### 2. 任务参与统计
- ✅ 查看同一任务、同一成员在指定日期范围的参与次数
- ✅ 按任务类型筛选统计结果
- ✅ 显示首次参与和最近参与日期
- ✅ 直观的表格展示和数据汇总

## 技术实现

### 数据库变更
新增 `task_definitions` 表：
```sql
CREATE TABLE task_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

默认任务：
- 空城首占（公会战）
- 城池争夺（公会战）
- 防守战（公会战）
- 副本推进（副本）
- BOSS挑战（副本）
- 世界BOSS（活动）
- 公会任务（日常）
- 其他活动（其他）

### 后端变更
1. **新增路由** - `server/routes/tasks.js`
   - `GET /api/tasks` - 获取所有激活的任务
   - `GET /api/tasks/categories` - 获取任务分类
   - `POST /api/tasks` - 创建新任务（管理员）
   - `PUT /api/tasks/:id` - 更新任务（管理员）
   - `DELETE /api/tasks/:id` - 软删除任务（管理员）

2. **新增统计API** - `server/routes/reports.js`
   - `GET /api/reports/task-participation` - 获取任务参与统计

### 前端变更
1. **创建事件页面** (`EventCreate.vue`)
   - 任务输入框改为下拉选择
   - 按分类组织任务选项
   - 自动加载任务列表

2. **事件详情页面** (`EventDetail.vue`)
   - 编辑模式下任务字段改为下拉选择
   - 保持与创建页面一致的体验

3. **报表页面** (`ReportView.vue`)
   - 新增"任务参与统计"板块
   - 支持按日期范围、任务类型筛选
   - 表格展示统计结果（任务、成员、参与次数、日期）

4. **API客户端** (`api.js`)
   - 添加任务管理相关API
   - 添加任务参与统计API

## 使用说明

### 创建事件时选择任务
1. 进入"创建新事件"页面
2. 在"任务"字段中从下拉列表选择预定义任务
3. 任务按分类组织，方便查找

### 查看任务参与统计
1. 进入"报表导出"页面
2. 滚动到"任务参与统计"板块
3. 选择日期范围（默认最近30天）
4. 可选：筛选特定任务类型
5. 点击"查询统计"按钮
6. 查看统计结果表格

### 管理任务定义（管理员）
可通过API直接管理任务：
```bash
# 创建新任务
curl -X POST http://localhost:20002/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新任务名称",
    "category": "分类",
    "description": "描述",
    "sort_order": 10
  }'
```

## 部署步骤

已完成的部署：
1. ✅ 运行数据库迁移：`node server/migrate_add_tasks_table.js`
2. ✅ 重启服务：`./manage_services.sh restart`
3. ✅ 验证服务状态：`./manage_services.sh status`

## 文件清单

### 新增文件
- `server/migrate_add_tasks_table.js` - 数据库迁移脚本
- `server/routes/tasks.js` - 任务管理API路由

### 修改文件
- `server/server.js` - 注册任务路由
- `server/routes/reports.js` - 添加任务参与统计API
- `client/src/api.js` - 添加任务相关API客户端
- `client/src/views/EventCreate.vue` - 任务字段改为下拉选择
- `client/src/views/EventDetail.vue` - 编辑模式任务字段改为下拉选择
- `client/src/views/ReportView.vue` - 添加任务参与统计界面

## API文档

### GET /api/tasks
获取所有激活的任务定义

**响应示例：**
```json
[
  {
    "id": 1,
    "name": "空城首占",
    "category": "公会战",
    "description": "空城首次占领",
    "sort_order": 1
  }
]
```

### GET /api/reports/task-participation
获取任务参与统计

**查询参数：**
- `from` - 起始日期（必需）
- `to` - 结束日期（必需）
- `taskName` - 任务名称（可选）
- `memberIds` - 成员ID列表，逗号分隔（可选）

**响应示例：**
```json
[
  {
    "task": "空城首占",
    "member_id": 1,
    "member_name": "小樱桃",
    "participation_count": 5,
    "first_date": "2025-12-15",
    "last_date": "2025-12-20"
  }
]
```

## 统计示例

根据附件中的数据（12/15/2025北地-空城首占），系统现在可以统计：
- "空城首占"任务在指定日期范围内每个成员的参与次数
- 多个成员在同一任务中的活跃度对比
- 任务的整体参与情况

## 注意事项

1. **现有数据兼容性**
   - 旧的事件记录中的自由文本任务字段保持不变
   - 新建事件必须从预定义列表中选择
   - 统计功能只统计有明确任务名称的事件

2. **管理员权限**
   - 任务管理（增删改）需要管理员权限
   - 统计查询需要登录权限

3. **性能考虑**
   - 任务列表在页面加载时一次性获取并缓存
   - 统计查询使用索引优化，支持大数据量

## 后续优化建议

- [ ] 添加任务管理UI界面（当前需通过API）
- [ ] 支持任务统计数据导出为CSV
- [ ] 添加任务参与趋势图表
- [ ] 支持批量导入任务定义
- [ ] 添加任务使用频率统计

## 支持

如有问题，请联系开发团队或查看项目文档。
