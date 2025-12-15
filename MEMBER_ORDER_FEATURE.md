# 成员顺序功能 - 使用说明

## ✅ 功能实现完成

已成功实现"方案A"：参与成员的显示顺序 = 用户选择顺序

## 🎯 功能特性

### 1. 创建事件 (EventCreate.vue)
- ✅ 点选成员时，按点选顺序添加到已选列表
- ✅ 已选成员显示为：`1. 成员名字, 2. 成员名字, 3. 成员名字`
- ✅ 不显示成员 ID，只显示序号和名字
- ✅ 支持拖拽调整顺序（拖动 ☰ 图标）
- ✅ 保存时将顺序写入数据库 `sort_order` 字段

### 2. 编辑事件 (EventDetail.vue)
- ✅ 点击"编辑"按钮进入编辑模式
- ✅ 保持原有成员顺序
- ✅ 支持拖拽调整顺序
- ✅ 可以添加/删除成员
- ✅ 保存时更新数据库中的顺序

### 3. 查看事件 (EventDetail.vue)
- ✅ 成员列表按保存的顺序显示
- ✅ 显示格式：`1. 成员名字`
- ✅ TXT 导出也按此顺序

## 🔧 技术实现

### 前端
- **依赖**: `vuedraggable@next` (Vue 3 兼容版本)
- **单一数据源**: `selectedMemberIds` 数组，索引即顺序
- **拖拽组件**: 
  ```vue
  <draggable 
    v-model="selectedMemberIds" 
    item-key="id" 
    :animation="200" 
    handle=".drag-handle"
  >
  ```

### 后端
- **数据库字段**: `event_members.sort_order` (INTEGER, DEFAULT 0)
- **创建事件**: 遍历 `memberIds` 数组，`sort_order = index + 1`
- **查询事件**: `ORDER BY em.sort_order ASC, m.id ASC`
- **更新事件**: 删除旧记录，插入新记录（带正确的 sort_order）

### 数据库迁移
```bash
node server/migrate_add_sort_order.js
```
- ✅ 已执行完成
- ✅ 为现有数据填充了 sort_order（按 member_id 升序排列）
- ✅ 7 个事件，53 个成员记录已迁移

## 📝 使用方法

### 创建事件时指定顺序
1. 填写事件基本信息（标题、地点、时间、备注）
2. 在"参与成员"区域勾选成员（按你希望的顺序点选）
3. 已选成员会显示在上方的蓝色区域，带序号
4. 如需调整顺序，拖动成员前面的 ☰ 图标
5. 点击"创建事件"保存

### 编辑已有事件的成员顺序
1. 进入事件详情页面
2. 点击右上角"编辑"按钮
3. 在编辑模式下，已选成员会保持原有顺序
4. 拖动 ☰ 图标调整顺序
5. 点击"保存"更新

### 批量操作
- **全选**: 将所有未选成员添加到列表末尾
- **清空**: 清空所有已选成员
- **移除**: 点击成员右侧的 × 按钮

## 🎨 UI 特性

### 拖拽样式
- **拖动手柄**: ☰ 图标，鼠标悬停变蓝色
- **拖动中**: 被拖动项半透明（opacity: 0.8）
- **拖动目标**: 占位符半透明（opacity: 0.4）

### 已选成员区域
- 蓝色虚线边框
- 浅蓝色背景 (#f0f7ff)
- 显示已选人数
- 空状态提示："请从下方选择成员"

### 成员显示
- **序号**: 蓝色粗体 (1., 2., 3., ...)
- **名字**: 黑色常规字体
- **移除按钮**: 红色圆形 × 按钮

## 🔍 验证结果

### 数据库验证
```bash
sqlite3 server/game_manager.db "SELECT event_id, member_id, sort_order FROM event_members WHERE event_id = 1 ORDER BY sort_order LIMIT 5;"
```
输出示例：
```
1|1|1
1|2|2
1|3|3
1|6|4
1|9|5
```

### API 验证
```bash
curl http://localhost:20002/api/events/1
```
返回的 `members` 数组已按 `sort_order` 排序。

## 📊 兼容性

### 向后兼容
- ✅ 旧数据迁移后，按 member_id 排序（保持原有行为）
- ✅ 如果 sort_order 相同或为 0，会自动按 member_id 二次排序
- ✅ 前端 UI 不依赖 member_id 显示顺序

### 前端兼容
- ✅ Vue 3.3.4
- ✅ vuedraggable@next 4.1.0 (Vue 3 版本)
- ✅ 所有现代浏览器（Chrome, Firefox, Safari, Edge）

### 移动端
- ✅ 触摸拖拽支持（通过 sortablejs）
- ✅ 响应式布局
- ⚠️ 建议使用较大屏幕操作拖拽

## 🚀 性能

- **前端**: 纯数组操作，无额外计算开销
- **后端**: 
  - 创建/更新：批量 INSERT（循环写入 sort_order）
  - 查询：单个 JOIN + ORDER BY（索引优化）
- **数据库**: sort_order 字段占用 4 字节/记录

## 🐛 已知限制

1. **批量操作不保留顺序**:
   - 使用"全选"按钮会将未选成员追加到末尾
   - 解决方案：手动调整顺序

2. **删除成员后重新编辑**:
   - 如果删除中间成员，其他成员的 sort_order 不会自动重排
   - 影响：查询时仍按 sort_order 排序，不影响显示
   - 优化建议：编辑保存时重新分配 1..N（已实现）

3. **拖拽到边界外**:
   - 拖拽到容器外会取消拖动
   - 解决方案：使用容器内滚动条

## 📦 相关文件

### 前端
- `client/src/views/EventCreate.vue` - 创建事件页面（541 行）
- `client/src/views/EventDetail.vue` - 事件详情/编辑页面（620 行）
- `client/package.json` - 添加了 vuedraggable 依赖

### 后端
- `server/routes/events.js` - 事件 API 路由（支持 sort_order）
- `server/schema.sql` - 数据库结构定义（含 sort_order 字段）
- `server/migrate_add_sort_order.js` - 数据库迁移脚本

## 🎉 测试建议

1. **创建新事件**:
   - 按特定顺序点选成员（如：先选 member_10，再选 member_1）
   - 验证已选列表显示顺序正确
   - 拖拽调整几次
   - 保存后查看详情页顺序是否一致

2. **编辑旧事件**:
   - 打开已有事件
   - 点击"编辑"，查看成员顺序是否保持
   - 拖动成员到新位置
   - 保存后刷新页面验证

3. **导出 TXT**:
   - 创建带有特定顺序的事件
   - 点击"导出TXT"
   - 验证导出的文本文件中成员顺序正确

4. **数据库验证**:
   ```bash
   sqlite3 server/game_manager.db "SELECT * FROM event_members WHERE event_id = [新建事件ID] ORDER BY sort_order;"
   ```

## 🔗 相关文档

- [项目结构说明](PROJECT_STRUCTURE.md)
- [部署指南](DEPLOYMENT.md)
- [变更日志](CHANGELOG_V2.md)
