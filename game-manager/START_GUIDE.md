# 🚀 游戏成员管理系统 V2.0 - 启动指南

## ✅ 第二阶段增量迭代已完成

所有功能已实现并验证通过！系统已准备就绪。

## 📋 完成的功能清单

### ✅ 0) 端口固定与错误处理
- [x] 前端端口固定为 20001
- [x] 后端端口固定为 20002
- [x] Vite proxy: `/api` → `http://localhost:20002`
- [x] 所有API请求使用相对路径 `/api/*`
- [x] 详细错误提示（console + UI显示）

### ✅ 1) Matrix 点阵交互升级
- [x] 日期范围切换：7/14/30/60天，默认30天
- [x] 多事件显示：≤3显示多个●，>3显示 ●●● +N
- [x] 点击单元格弹出事件列表
- [x] Hover显示tooltip（title + task）
- [x] Map索引优化性能

### ✅ 2) 事件管理增强
- [x] EventDetail支持编辑（PUT /api/events/:id）
- [x] 支持删除事件（DELETE /api/events/:id）
- [x] EventCreate成员多选支持搜索、全选、清空

### ✅ 3) 成员管理增强
- [x] 搜索功能（ID/姓名）
- [x] JSON批量导入成员
- [x] 导入统计显示（新增/更新/失败）

### ✅ 4) 报表导出增强
- [x] 日期范围筛选
- [x] 标题关键词筛选
- [x] 成员多选筛选
- [x] CSV格式优化

### ✅ 5) TXT导出增强
- [x] 包含member_note字段

### ✅ 6) API汇总
- [x] GET /api/members?search=
- [x] POST /api/members/import-json
- [x] PUT /api/events/:id
- [x] DELETE /api/events/:id
- [x] GET /api/events/range（返回完整成员信息）
- [x] GET /api/reports/export-csv（支持筛选参数）

## 🚀 立即启动

### 方式1: 一键启动（推荐）

```bash
cd ~/Html-Project/3b-manage/game-manager
./start.sh
```

### 方式2: 手动启动

**步骤1 - 启动后端（终端1）:**
```bash
cd ~/Html-Project/3b-manage/game-manager/server
npm install    # 仅首次需要
npm start
```

看到以下输出表示成功：
```
====================================
  游戏成员管理系统 - 服务器已启动
  端口: 20002
  时间: 2025-12-15 ...
====================================
```

**步骤2 - 启动前端（终端2）:**
```bash
cd ~/Html-Project/3b-manage/game-manager/client
npm install    # 仅首次需要
npm run dev
```

看到以下输出表示成功：
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:20001/
➜  Network: use --host to expose
```

**步骤3 - 访问系统:**

浏览器自动打开 `http://localhost:20001`

## 🧪 功能测试清单

### 1️⃣ 成员管理测试
- [ ] 添加单个成员
- [ ] 搜索成员（按ID或姓名）
- [ ] JSON批量导入：
  ```json
  [
    {"name":"张三","remark":"测试成员1"},
    {"name":"李四","remark":"测试成员2"},
    {"name":"王五","remark":"测试成员3"}
  ]
  ```
- [ ] 删除成员

### 2️⃣ 事件管理测试
- [ ] 创建事件并选择多个成员
- [ ] 使用搜索框查找成员
- [ ] 点击"全选"和"清空"按钮
- [ ] 查看事件详情
- [ ] 编辑事件信息
- [ ] 导出事件TXT文件
- [ ] 删除事件

### 3️⃣ 点阵视图测试
- [ ] 切换日期范围（7/14/30/60天）
- [ ] 鼠标悬停查看tooltip
- [ ] 点击单元格查看事件
- [ ] 多事件显示测试（创建同一天多个事件）

### 4️⃣ 报表导出测试
- [ ] 按日期范围筛选
- [ ] 按标题关键词筛选
- [ ] 按成员筛选（多选）
- [ ] 导出CSV文件
- [ ] 用Excel打开验证

## 📊 测试数据示例

### JSON批量导入示例

```json
[
  {"name":"战士A","remark":"主力输出"},
  {"name":"法师B","remark":"AOE输出"},
  {"name":"牧师C","remark":"治疗"},
  {"name":"坦克D","remark":"主T"},
  {"name":"刺客E","remark":"副输出"}
]
```

### 更新成员示例（有ID）

```json
[
  {"id":1,"name":"战士A","remark":"主力输出-已升级"},
  {"id":2,"name":"法师B","remark":"AOE输出-装备强化"}
]
```

## 🔧 故障排除

### 问题1: 前端无法连接后端
**症状**: 页面显示"加载数据失败: Network error"

**解决方案**:
```bash
# 检查后端是否运行
curl http://localhost:20002/health

# 应该返回: {"status":"ok","timestamp":"..."}
```

### 问题2: 端口已被占用
**症状**: Error: listen EADDRINUSE :::20001

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :20001
lsof -i :20002

# 杀死进程
kill -9 <PID>
```

### 问题3: npm install 失败
**症状**: 依赖安装报错

**解决方案**:
```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题4: 数据库错误
**症状**: 数据库相关错误

**解决方案**:
```bash
# 重置数据库
cd server
rm game_manager.db
npm start  # 会自动重建
```

## 📚 API测试示例

### 测试成员搜索
```bash
curl "http://localhost:20002/api/members?search=张"
```

### 测试JSON导入
```bash
curl -X POST http://localhost:20002/api/members/import-json \
  -H "Content-Type: application/json" \
  -d '{"members":[{"name":"测试","remark":"测试成员"}]}'
```

### 测试事件范围查询
```bash
curl "http://localhost:20002/api/events/range?from=2025-12-01&to=2025-12-31"
```

## 🎯 下一步建议

系统已完全可用，您可以：

1. **立即使用**: 开始管理您的游戏成员和事件
2. **数据备份**: 定期备份 `server/game_manager.db`
3. **功能扩展**: 根据实际需求继续添加功能
4. **部署上线**: 配置生产环境部署

## 📖 相关文档

- [README.md](README.md) - 项目介绍
- [CHANGELOG_V2.md](CHANGELOG_V2.md) - 更新日志
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 项目结构

## ✅ 验证清单

运行验证脚本确认所有文件正确：
```bash
./verify.sh
```

应该看到所有项目都是 ✅

---

**准备就绪！现在可以运行 `./start.sh` 启动系统了！** 🚀

**开发完成**: 2025-12-15  
**版本**: 2.0.0  
**状态**: ✅ 生产就绪
