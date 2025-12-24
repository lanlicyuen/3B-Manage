# 🔐 权限控制系统 - 快速测试指南

## 📋 测试密码
```
12345aBc
```

## ✅ 必须完成的 7 项验收测试

### 1️⃣ 未登录状态检查
```bash
操作：
1. F12 → Application → Local Storage → 删除 isAdmin 和 adminToken
2. 刷新页面 https://3b.1plabs.pro

验收标准：
✓ 只看到"总督请进"按钮（右上角）
✗ 看不到功能导航栏（成员管理/创建事件/查看事件/报表导出）
✓ 可以查看出勤表
```

---

### 2️⃣ 未登录点击事件详情
```bash
操作：
1. 未登录状态
2. 点击出勤表中的圆点

验收标准：
✓ 可以看到事件详情（标题、日期、成员名单）
✓ 只显示"返回"按钮
✗ 看不到"编辑"按钮
✗ 看不到"导出TXT"按钮
✗ 看不到"删除"按钮
```

---

### 3️⃣ 管理员登录
```bash
操作：
1. 点击"总督请进"
2. 输入密码：12345aBc

验收标准：
✓ 弹窗提示"✅ 已进入管理模式"
✓ 页面自动刷新
✓ 右上角按钮变为"退出管理"
✓ 立即出现功能导航栏：
   📊 首页出勤表 | 👥 成员管理 | ➕ 创建事件 | 📋 查看事件 | 📈 报表导出
```

**验证 localStorage（F12 → Console）：**
```javascript
localStorage.isAdmin       // 应该是 "1"
localStorage.adminToken    // 应该是 "12345aBc"
```

---

### 4️⃣ 登录后查看事件详情
```bash
操作：
1. 登录状态
2. 点击出勤表圆点

验收标准：
✓ 显示事件信息
✓ 显示"编辑"按钮
✓ 显示"导出TXT"按钮
✓ 显示"删除"按钮
✓ 点击"编辑"可以正常编辑
✓ 点击"保存"可以成功保存
```

---

### 5️⃣ 删除事件（关键！）
```bash
操作：
1. 登录状态
2. 进入任意事件详情页
3. 点击"删除"按钮
4. 确认删除

验收标准：
✓ 弹窗确认："确定要删除此事件吗？此操作不可恢复！"
✓ 删除成功，提示"事件已删除"
✓ 自动跳转到首页
✗ 不再提示"需要总督登录"（这是之前的 bug）
```

---

### 6️⃣ 访问管理页面
```bash
操作：
1. 登录状态
2. 依次点击导航栏中的：
   - 👥 成员管理
   - ➕ 创建事件
   - 📋 查看事件
   - 📈 报表导出

验收标准：
✓ 所有页面正常访问
✓ 没有"需要总督登录"的拦截
✓ 功能正常使用
```

---

### 7️⃣ 退出登录
```bash
操作：
1. 登录状态
2. 点击"退出管理"
3. 确认退出

验收标准：
✓ 弹窗提示"已退出管理模式"
✓ 跳转到首页
✓ 右上角按钮变回"总督请进"
✓ 功能导航栏立即消失
✓ 再次点击事件详情，看不到编辑/删除按钮
```

**验证 localStorage（F12 → Console）：**
```javascript
localStorage.isAdmin       // 应该是 null
localStorage.adminToken    // 应该是 null
```

---

## 🚨 常见问题排查

### 问题 1：登录后功能表还是不显示
```bash
原因：浏览器缓存了旧版本
解决：Ctrl + Shift + R 强制刷新
或：清除浏览器缓存后重新访问
```

### 问题 2：删除事件仍提示"需要总督登录"
```bash
原因：后端服务未重启
解决：
sudo systemctl restart 3b-manage-backend.service
sudo systemctl restart 3b-manage-frontend.service
```

### 问题 3：输入密码后提示"密码错误"
```bash
确认密码：12345aBc（大小写敏感）
不是：aA12345aA（旧密码，已废弃）
```

---

## 🧪 后端 API 自动化测试

运行完整测试脚本：
```bash
cd /home/lanlic/Html-Project/3b-manage/game-manager
./test_permission_system.sh
```

**预期输出**：
```
🔒 权限控制系统 - 完整测试脚本
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.1 公开接口访问
  ✓ GET /api/events (事件列表): 200
  ✓ GET /api/events/13 (事件详情): 200
  ✓ GET /api/members (成员列表): 200

1.2 未授权写操作（应该 401）
  ✓ POST /api/events (未授权): 401
  ✓ PUT /api/events/13 (未授权): 401
  ✓ DELETE /api/events/13 (未授权): 401
  ✓ DELETE /api/members/1 (未授权): 401

1.3 管理员登录
  ✓ 登录成功，获取 Token: admin_...

1.4 授权写操作（应该成功）
  ✓ POST /api/events (已授权): 201
  ✓ POST /api/events/16/export-txt (已授权): 200

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
测试结果统计
总测试数: 10
通过: 10  ← 必须全部通过
失败: 0

✅ 所有测试通过！
```

---

## 📊 修改文件清单

### 前端（4个文件）
- `client/src/utils/auth.js` - 密码改为 12345aBc
- `client/src/api.js` - 修复 localStorage key 不一致
- `client/src/App.vue` - 添加管理功能导航栏
- `.env` - 环境变量密码改为 12345aBc

### 后端（3个文件）
- `server/middleware/auth.js` - ⭐ 修复 requireAuth 拦截问题
- `server/middleware/requireAdmin.js` - 密码改为 12345aBc
- `server/routes/admin.js` - 密码改为 12345aBc

---

## 🎯 核心修复点

| 问题 | 修复 | 文件 |
|------|------|------|
| 登录后功能表不显示 | 添加 `<nav v-if="adminLoggedIn">` | App.vue |
| 删除事件提示未登录 | requireAuth 优先检查 X-Admin-Token | auth.js |
| localStorage key 不一致 | 统一为 adminToken | api.js |
| 密码不一致 | 全改为 12345aBc | 4个文件 |

---

## 📱 移动端测试

导航栏在移动端自动适配：
- 横向滚动
- 按钮缩小
- 图标保留

---

**测试人员**：请严格按照上述 7 项测试验收  
**预期时间**：5-10 分钟完成所有测试  
**失败标准**：任何一项不符合预期即为失败  

🎉 **祝测试顺利！**
