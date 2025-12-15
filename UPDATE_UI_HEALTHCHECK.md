# UI改进 & 健康检查功能 - 更新说明

## 📅 更新日期：2025-12-15

---

## 🎨 一、MatrixView 日期表头优化

### ✅ 改动内容

#### 1. 日期显示格式改为两行
- **第一行**：日期（dd）- 加粗显示
- **第二行**：月份（MM）- 较小字体

**显示效果**：
```
15
12
```
而不是之前的 `15/12` 或旋转文字

#### 2. 移除文字旋转
- 移除了 `transform: rotate(-90deg)`
- 改用 `flex-direction: column` 垂直布局
- 文字正面可读，无需歪头

#### 3. 日期格宽度优化
- 调整为 **36px**（紧凑布局）
- 两行居中对齐
- 保持整洁美观

#### 4. 保留日期范围切换
- 7天 / 14天 / 30天 / 60天 / **90天**（新增）
- 默认仍为 30 天

### 📝 修改的文件

**文件**：[client/src/views/MatrixView.vue](client/src/views/MatrixView.vue)

**关键代码片段**：

```vue
<!-- 模板部分 -->
<div class="date-cell" v-for="date in dates" :key="date">
  <div class="date-day">{{ formatDate(date).day }}</div>
  <div class="date-month">{{ formatDate(date).month }}</div>
</div>
```

```javascript
// 格式化函数
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return {
    day: date.getDate(),
    month: date.getMonth() + 1
  };
};
```

```css
/* CSS 样式 */
.date-cell {
  width: 36px;
  min-width: 36px;
  padding: 5px 2px;
  display: flex;
  flex-direction: column;  /* 垂直布局 */
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.date-day {
  font-weight: bold;
  font-size: 14px;
}

.date-month {
  font-size: 11px;
  color: #e0e0e0;
}
```

---

## 🩺 二、一键健康检查功能

### ✅ 功能说明

新增一键健康检查命令，快速验证前后端服务状态。

### 🎯 特性

- ✅ **并发检测**：同时检查前端和后端（3秒超时）
- ✅ **状态可视化**：🟢 正常 / 🔴 失败
- ✅ **跨平台**：纯 Node.js 实现，Windows/Linux/macOS 通用
- ✅ **无外部依赖**：仅使用 Node.js 内置 `http` 模块
- ✅ **正确退出码**：全通过 exit 0，任何失败 exit 1

### 📦 新增文件

#### 1. **健康检查脚本**

**文件**：`scripts/healthcheck.mjs`

**核心逻辑**：
- 前端检测：GET `http://localhost:20001/`
  - 判定：HTTP 200 且 body 非空
- 后端检测：GET `http://localhost:20002/api/meta`
  - 判定：HTTP 200 且返回 JSON 含 `today` 字段
- 超时设置：3秒
- 错误类型：timeout / ECONNREFUSED / HTTP错误码

**输出示例**（成功）：
```
🔍 Health Check Starting...

🟢 Frontend http://localhost:20001/ OK
🟢 Backend  http://localhost:20002/api/meta OK

✅ All good.
```

**输出示例**（失败）：
```
🔍 Health Check Starting...

🔴 Frontend http://localhost:20001/ FAILED (timeout)
🟢 Backend  http://localhost:20002/api/meta OK

❌ Some services failed.
```

#### 2. **根目录 package.json**

**文件**：`package.json`（项目根目录）

**内容**：
```json
{
  "name": "game-manager",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "healthcheck": "node scripts/healthcheck.mjs",
    "start:server": "cd server && npm start",
    "start:client": "cd client && npm run dev",
    "install:all": "cd server && npm install && cd ../client && npm install"
  }
}
```

#### 3. **后端 /api/meta 接口**

**文件**：`server/server.js`

**新增代码**：
```javascript
// API meta 接口（用于健康检查）
app.get('/api/meta', (req, res) => {
  const today = new Date();
  res.json({ 
    status: 'ok',
    today: today.toISOString().split('T')[0],
    timestamp: today.toISOString(),
    version: '2.0.0'
  });
});
```

**接口响应示例**：
```json
{
  "status": "ok",
  "today": "2025-12-15",
  "timestamp": "2025-12-15T08:30:00.000Z",
  "version": "2.0.0"
}
```

---

## 🚀 使用方法

### 1. 运行健康检查

在项目根目录执行：

```bash
cd ~/Html-Project/3b-manage/game-manager
npm run healthcheck
```

### 2. 在 CI/CD 中使用

```bash
# 启动服务后进行健康检查
./start_services.sh
sleep 3
npm run healthcheck || exit 1
```

### 3. 检查单个服务

```bash
# 测试后端 meta 接口
curl http://localhost:20002/api/meta

# 测试前端首页
curl http://localhost:20001/
```

---

## 📊 测试验证

### 场景1：服务未启动
```bash
$ npm run healthcheck

🔴 Frontend http://localhost:20001/ FAILED (ECONNREFUSED)
🔴 Backend  http://localhost:20002/api/meta FAILED (ECONNREFUSED)
❌ Some services failed.

# Exit code: 1
```

### 场景2：服务正常运行
```bash
$ npm run healthcheck

🟢 Frontend http://localhost:20001/ OK
🟢 Backend  http://localhost:20002/api/meta OK
✅ All good.

# Exit code: 0
```

### 场景3：部分服务异常
```bash
$ npm run healthcheck

🟢 Frontend http://localhost:20001/ OK
🔴 Backend  http://localhost:20002/api/meta FAILED (timeout)
❌ Some services failed.

# Exit code: 1
```

---

## 📚 更新文档

已更新 [README.md](README.md) 添加健康检查使用说明：

```markdown
### 4. 健康检查

在项目根目录运行健康检查命令，验证前后端服务是否正常：

\`\`\`bash
npm run healthcheck
\`\`\`
```

---

## ✅ 完成清单

- [x] MatrixView 日期表头改为两行显示（日/月）
- [x] 移除文字旋转，改为正面可读
- [x] 日期格宽度优化为 36px
- [x] 保留 7/14/30/60/90 天切换功能
- [x] 创建健康检查脚本 `scripts/healthcheck.mjs`
- [x] 添加根目录 `package.json` 配置
- [x] 后端新增 `/api/meta` 健康检查接口
- [x] 更新 README.md 添加使用说明
- [x] 功能测试验证通过

---

## 🎊 总结

本次更新完成了：
1. **UI 优化**：日期表头更清晰易读
2. **运维能力**：新增健康检查，方便监控和自动化

**项目状态**：✅ 所有功能正常，可立即使用
