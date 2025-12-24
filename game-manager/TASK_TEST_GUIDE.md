# 3B-Manage 任务功能快速测试指南

## 测试环境
- 后端地址: http://localhost:20002
- 前端地址: http://localhost:20001
- 或通过Nginx反代访问

## 测试清单

### ✅ 1. 验证任务API
```bash
# 获取所有任务
curl http://localhost:20002/api/tasks

# 获取任务分类
curl http://localhost:20002/api/tasks/categories
```

**预期结果：** 返回8个默认任务，包含公会战、副本、活动、日常、其他等分类

### ✅ 2. 测试事件创建页面
1. 访问前端 → 点击"创建新事件"
2. 查看"任务"字段是否显示为下拉选择框
3. 下拉列表应该按分类组织（公会战、副本、活动等）
4. 选择一个任务（如"空城首占"）
5. 填写其他必填字段，创建事件

**预期结果：** 
- 任务字段显示为下拉框，不再是输入框
- 选项按分类分组显示
- 成功创建事件

### ✅ 3. 测试事件编辑页面
1. 进入已创建的事件详情页
2. 点击"编辑"按钮（需要管理员权限）
3. 查看"任务"字段是否为下拉选择
4. 修改任务选择
5. 保存更改

**预期结果：** 
- 编辑模式下任务字段也是下拉选择
- 可以成功更改任务并保存

### ✅ 4. 测试任务参与统计
1. 访问"报表导出"页面
2. 滚动到"任务参与统计"板块
3. 设置日期范围（默认已填入最近30天）
4. 可选：选择特定任务类型筛选
5. 点击"查询统计"

**预期结果：**
- 显示统计表格，包含以下列：
  - 任务名称
  - 成员名称
  - 参与次数（带绿色徽章）
  - 首次参与日期
  - 最近参与日期
- 底部显示记录总数

### ✅ 5. API测试（需要token）

#### 创建测试事件（需要管理员登录）
```bash
# 先登录获取token
TOKEN=$(curl -s -X POST http://localhost:20002/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"YOUR_PASSWORD"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 创建带任务的事件
curl -X POST http://localhost:20002/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-24",
    "title": "测试事件",
    "task": "空城首占",
    "remark": "测试任务功能",
    "memberIds": [1, 2, 3]
  }'
```

#### 查询任务参与统计
```bash
curl "http://localhost:20002/api/reports/task-participation?from=2025-12-01&to=2025-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

## 数据验证

### 根据附件数据测试
根据你提供的表格数据（12/15/2025北地-空城首占），如果这些数据已经在系统中：

1. **创建对应事件**
   - 日期: 2025-12-15
   - 标题: 北地
   - 任务: 空城首占（从下拉选择）
   - 成员: 小樱桃、绿叶成阴、噬魃染果法噬等

2. **查询统计**
   - 设置日期范围: 2025-12-01 到 2025-12-31
   - 任务筛选: 空城首占
   - 查看每个成员在"空城首占"任务中的参与次数

## 常见问题排查

### 问题1：下拉列表没有显示任务
**解决方案：**
```bash
# 检查数据库是否有任务
sqlite3 server/game_manager.db "SELECT * FROM task_definitions WHERE is_active = 1;"

# 重新运行迁移
cd server && node migrate_add_tasks_table.js
```

### 问题2：统计查询返回空结果
**可能原因：**
- 没有创建带任务名称的事件
- 日期范围不包含有任务的事件
- 需要登录权限

### 问题3：服务未响应
```bash
# 检查服务状态
./manage_services.sh status

# 重启服务
./manage_services.sh restart

# 查看后端日志
journalctl -u 3b-manage-backend.service -f
```

## 性能测试

### 大数据量测试
如果有大量历史数据，测试统计查询性能：
```bash
# 查询一年的统计数据
time curl "http://localhost:20002/api/reports/task-participation?from=2024-01-01&to=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

**预期：** 响应时间应在1-2秒内

## 截图建议
测试时建议截图保存：
1. 创建事件页面的任务下拉选择
2. 任务参与统计表格
3. 统计结果示例

## 反馈
测试完成后，请反馈：
- ✅ 所有功能正常
- ⚠️ 发现的问题或建议
- 📝 用户体验反馈
