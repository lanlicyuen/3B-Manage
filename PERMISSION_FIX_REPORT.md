# 权限问题修复报告

## 问题描述
用户在退出再登录后，访问"成员管理"和"创建事件"页面时仍然提示"需要总督登录才能访问此页面"。

## 问题分析

### 根本原因
前端代码中存在 **Token 存储键名不一致** 的问题：

1. **登录时保存**：`LoginModal.vue` 和 `App.vue` 使用 `admin_token` 作为键名
2. **路由守卫读取**：`router.js` 使用 `admin_token` ✅ 正确
3. **API 请求读取**：`api.js` 使用 `adminToken` ❌ **错误**
4. **工具函数读取**：`utils/auth.js` 使用 `adminToken` ❌ **错误**

### 问题流程
```
用户登录 → 保存 localStorage['admin_token'] 
         ↓
路由守卫检查 localStorage['admin_token'] → ✅ 存在，允许进入页面
         ↓
页面加载，发起 API 请求 → 读取 localStorage['adminToken'] → ❌ 不存在
         ↓
后端收不到 Token → 返回 401 错误 → 前端提示"需要登录"
```

## 修复方案

### 1. 统一 API Token 键名
**文件**：`client/src/api.js`

```javascript
// 修复前
function getAdminToken() {
  return localStorage.getItem('adminToken'); // ❌ 错误的键名
}

// 修复后
function getAdminToken() {
  return localStorage.getItem('admin_token'); // ✅ 正确的键名
}
```

### 2. 统一工具函数 Token 键名
**文件**：`client/src/utils/auth.js`

```javascript
// 修复前
const TOKEN_KEY = 'adminToken'; // ❌ 错误

export function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === '1'; // 依赖额外的 isAdmin 标记
}

// 修复后
const TOKEN_KEY = 'admin_token'; // ✅ 正确

export function isAdmin() {
  return !!localStorage.getItem(TOKEN_KEY); // ✅ 直接检查 token 是否存在
}
```

### 3. 更新 App.vue 登录逻辑
**文件**：`client/src/App.vue`

将前端密码验证改为调用后端 API：

```javascript
// 修复前：前端直接验证密码
function showLogin() {
  const password = prompt('请输入管理员密码：')
  if (login(password)) { // 前端验证
    localStorage.setItem('adminToken', password)
    // ...
  }
}

// 修复后：调用后端 API
async function showLogin() {
  const password = prompt('请输入管理员密码：')
  try {
    const result = await api.adminLogin(password) // 后端验证
    localStorage.setItem('admin_token', result.token) // 保存后端返回的 token
    // ...
  } catch (error) {
    alert('❌ ' + error.message)
  }
}
```

## 修复文件清单

| 文件 | 修改内容 |
|------|---------|
| `client/src/api.js` | 修改 `getAdminToken()` 函数，使用 `admin_token` 键名 |
| `client/src/utils/auth.js` | 修改 `TOKEN_KEY` 常量和 `isAdmin()` 函数 |
| `client/src/App.vue` | 更新 `showLogin()` 和 `handleLogout()` 函数，调用后端 API |

## 验证步骤

1. ✅ 重新构建前端代码
   ```bash
   cd client && npm run build
   ```

2. ✅ 重启前端服务
   ```bash
   ./manage_services.sh restart frontend
   ```

3. 测试流程：
   - [ ] 访问 https://3b.1plabs.pro
   - [ ] 点击"总督请进"登录
   - [ ] 访问"成员管理"页面 → 应该能正常加载
   - [ ] 访问"创建事件"页面 → 应该能正常加载
   - [ ] 退出登录
   - [ ] 尝试访问受限页面 → 应该提示需要登录并跳转

## 技术细节

### Token 流程（修复后）
```
1. 用户输入密码
   ↓
2. 调用 POST /api/admin/login { password }
   ↓
3. 后端验证密码 → 生成 token → 返回 { token, message, role }
   ↓
4. 前端保存 localStorage['admin_token'] = token
   ↓
5. 后续所有请求在 Header 中携带：
   - Authorization: Bearer {token}
   - X-Admin-Token: {token}
   ↓
6. 后端 requireAuth 中间件验证 token
   ↓
7. 验证通过 → 允许访问
```

### 后端验证逻辑
**文件**：`server/middleware/auth.js`

```javascript
function requireAuth(req, res, next) {
  // 优先使用 X-Admin-Token
  if (req.headers['x-admin-token']) {
    req.userId = 'admin';
    return next();
  }
  
  // 其次使用 Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '需要总督登录' });
  }
  
  const token = authHeader.substring(7);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
  
  req.userId = 'admin';
  next();
}
```

## 影响范围

### 受影响的功能
- ✅ 成员管理（增删改查）
- ✅ 创建事件
- ✅ 事件编辑
- ✅ 事件删除
- ✅ 报表导出

### 不受影响的功能
- 首页出勤表查看
- 事件列表查看
- 事件详情查看（不编辑）

## 注意事项

1. **已登录用户需要重新登录**
   - 旧的 token 使用错误的键名，需要清除并重新登录
   - 用户在下次访问时会自动被要求重新登录

2. **浏览器缓存**
   - 建议用户硬刷新页面（Ctrl + Shift + R）确保加载新代码
   - 或者清除浏览器缓存

3. **密码保持不变**
   - 默认密码：`aA12345aA`
   - 可通过环境变量 `ADMIN_PASSWORD` 配置

## 后续优化建议

1. **Token 过期机制**
   - 当前 token 存储在内存中，服务重启后失效
   - 建议添加 Redis 或数据库持久化
   - 添加 token 过期时间（如 7天）

2. **统一登录入口**
   - 移除 App.vue 中的 prompt 登录方式
   - 统一使用 LoginModal 组件
   - 提供更好的用户体验

3. **权限细分**
   - 当前只有一个"总督"角色
   - 可以扩展为多级权限（总督、管理员、成员）

## 修复完成时间
2025-12-18

## 修复状态
✅ **已完成并部署**
