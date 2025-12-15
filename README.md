# 游戏成员管理系统

一个本地运行的 WebApp，用于管理游戏成员和事件记录。

> 🌐 **生产环境部署**：参见 [DEPLOYMENT.md](DEPLOYMENT.md)（域名反代、NPM 配置、安全设置）

## 🔐 权限说明

**默认为只读模式**：
- 游客可以查看点阵出勤表
- 游客可以查看事件详情
- 管理功能需要总督登录

**总督登录后可以**：
- 成员管理（添加、编辑、删除、导入）
- 创建和编辑事件
- 查看完整事件列表
- 导出报表

### 登录方式

1. 访问首页 http://localhost:20001
2. 点击右上角"🔐 总督请进"按钮
3. 输入管理密码：`12345aBc`
4. 登录成功后即可使用所有管理功能
5. 点击"🚪 退出"返回只读模式

## 📋 功能特性

- ✅ **成员管理**：添加、编辑、删除成员，支持JSON批量导入
- ✅ **事件创建**：创建事件并关联参与成员
- ✅ **事件列表**：查看所有事件，支持搜索和日期过滤
- ✅ **点阵视图**：30/60/90 天日历矩阵，直观显示成员参与情况
- ✅ **事件详情**：查看和编辑事件完整信息
- ✅ **TXT 导出**：将事件信息导出为文本文件
- ✅ **CSV 报表**：按日期范围导出 CSV 格式报表
- ✅ **权限控制**：游客只读，总督可管理

## 🛠️ 技术栈

### 后端
- Node.js 18+
- Express 4.x
- SQLite 3.x

### 前端
- Vue 3
- Vue Router 4
- Vite 4

## 📦 项目结构

```
game-manager/
├─ server/              # 后端服务
│  ├─ db.js            # 数据库连接
│  ├─ schema.sql       # 数据库结构
│  ├─ server.js        # Express 服务器
│  ├─ routes/          # API 路由
│  │  ├─ members.js    # 成员相关 API
│  │  ├─ events.js     # 事件相关 API
│  │  └─ reports.js    # 报表相关 API
│  └─ package.json
│
├─ client/             # 前端应用
│  ├─ src/
│  │  ├─ views/        # 页面组件
│  │  │  ├─ MatrixView.vue      # 首页点阵
│  │  │  ├─ MembersView.vue     # 成员管理
│  │  │  ├─ EventCreate.vue     # 创建事件
│  │  │  ├─ EventDetail.vue     # 事件详情
│  │  │  └─ ReportView.vue      # 报表导出
│  │  ├─ components/
│  │  │  └─ MatrixCell.vue      # 点阵单元格
│  │  ├─ api.js        # API 调用封装
│  │  ├─ router.js     # 路由配置
│  │  ├─ App.vue       # 根组件
│  │  └─ main.js       # 应用入口
│  ├─ index.html
│  ├─ vite.config.js
│  └─ package.json
│
└─ README.md           # 本文件
```

## ⚡ 开始之前

### 开发环境 vs 生产环境

**本地开发（推荐使用 dev server）**：
```bash
cd client
npm run dev  # ✅ 快速热更新，自动刷新
```

**生产部署（必须使用 preview/build）**：
```bash
cd client
npm run build && npm run preview  # ✅ 优化构建，稳定可靠
```

### 🚫 重要警告

**严禁在生产环境使用 `npm run dev`**

在公网服务器或通过域名访问时，**绝对不要使用开发服务器**，原因：

1. ❌ **安全风险**：暴露源码、开发工具端点
2. ❌ **Host 校验**：会导致 502 Bad Gateway 错误
3. ❌ **性能问题**：实时编译消耗资源
4. ❌ **稳定性差**：缺乏进程守护，容易崩溃

**正确做法**：
- 本地开发：`npm run dev`（端口 20001，仅本机访问）
- 生产部署：`npm run build` + `npm run preview`（或 Nginx 托管 dist/）
- 进程管理：使用 PM2 守护进程（见 [DEPLOYMENT.md](DEPLOYMENT.md)）

---

## 🚀 快速开始（本地开发）

### 1. 安装依赖

#### 安装后端依赖
```bash
cd server
npm install
```

#### 安装前端依赖
```bash
cd client
npm install
```

### 2. 启动服务（本地开发）

**需要开启两个终端窗口**

#### 终端 1：启动后端服务
```bash
cd server
npm start
```

服务将运行在：`http://127.0.0.1:20002`

#### 终端 2：启动前端应用（开发模式）
```bash
cd client
npm run dev
```

应用将自动在浏览器打开：`http://localhost:20001`

> ⚠️ **注意**：`npm run dev` 仅用于本地开发！生产部署请参见 [DEPLOYMENT.md](DEPLOYMENT.md)

### 3. 开始使用

1. **添加成员**：点击「成员管理」按钮，添加游戏成员
2. **创建事件**：点击「创建事件」按钮，填写事件信息并选择参与成员
3. **查看点阵**：在首页查看最近 30 天的成员参与情况
4. **导出数据**：在「报表导出」页面导出 CSV 报表

### 4. 健康检查

在项目根目录运行健康检查命令，验证前后端服务是否正常：

```bash
npm run healthcheck
```

输出示例：
```
🟢 Frontend http://localhost:20001 OK
🟢 Backend  http://localhost:20002 OK
✅ All good.
```

如有服务未启动或异常，会显示 🔴 并返回错误码。

---

## 🌐 生产环境部署

本地开发调试完成后，部署到生产服务器请参见：

**📖 [DEPLOYMENT.md](DEPLOYMENT.md)** - 完整部署指南

包含：
- ✅ Nginx Proxy Manager 反向代理配置
- ✅ PM2 进程守护与开机自启
- ✅ 前端生产构建与预览模式
- ✅ 后端安全监听（仅 127.0.0.1）
- ✅ HTTPS 证书配置
- ✅ 常见问题排查

**快速部署命令**（使用 PM2）：
```bash
# 安装 PM2
npm install -g pm2

# 一键启动前后端
./pm2-manager.sh start

# 配置开机自启
./pm2-manager.sh setup
```

---

## 🔧 开发模式

后端开发模式（自动重启）：
```bash
cd server
npm run dev  # 需要全局安装 nodemon
```

## 📊 数据库说明

数据库文件：`server/game_manager.db`（SQLite 格式）

包含 3 张表：
- **members**：成员信息
- **events**：事件信息
- **event_members**：成员与事件的关联

首次启动时会自动创建数据库和表结构。

## 📡 API 接口

### 成员相关
- `GET /api/members` - 获取所有成员
- `POST /api/members` - 创建新成员
- `DELETE /api/members/:id` - 删除成员

### 事件相关
- `GET /api/events/range?from=&to=` - 按日期范围获取事件
- `GET /api/events/:id` - 获取事件详情
- `POST /api/events` - 创建新事件
- `POST /api/events/:id/export-txt` - 导出事件为 TXT
- `DELETE /api/events/:id` - 删除事件

### 报表相关
- `GET /api/reports/export-csv?from=&to=` - 导出 CSV 报表
- `GET /api/reports/stats` - 获取统计信息

## 🎯 使用场景

- 游戏公会活动管理
- 副本挑战记录
- 成员出勤追踪
- 团队活动统计

## ⚠️ 注意事项

1. 本系统为本地应用，数据存储在本地 SQLite 数据库
2. 无需登录认证，适合个人或小团队使用
3. 建议定期备份 `server/game_manager.db` 文件
4. 前后端需要同时运行才能正常使用

## 📝 许可证

MIT License

## 📱 PWA 移动端安装

本系统支持 **PWA (Progressive Web App)** 模式，可以像原生应用一样安装到手机桌面。

### 本地测试要求

⚠️ **重要提示**：
1. **必须使用生产构建模式**：PWA 仅在 `preview` 模式下可用，`dev` 模式无法激活 Service Worker
2. **HTTPS 或 localhost**：浏览器要求 PWA 必须在安全上下文运行
3. **手机无法访问 localhost**：移动设备需使用局域网 IP 地址

### 在电脑浏览器测试

```bash
# 1. 构建前端生产版本
cd client
npm run build

# 2. 启动预览服务（生产模式）
npm run preview

# 访问 http://localhost:20001
# Chrome 会在地址栏显示「安装」图标
# 或者页面右下角会弹出「📱 安装到桌面」按钮
```

### 在手机浏览器测试

```bash
# 1. 确保后端服务正在运行（端口 20002）
cd server
npm start

# 2. 构建并启动前端预览服务
cd client
npm run build
npm run preview

# 3. 查看你的局域网 IP
ip addr show | grep "inet " | grep -v 127.0.0.1
# 或者 Windows 用户运行: ipconfig

# 假设你的局域网 IP 是 192.168.1.100
# 手机浏览器访问: http://192.168.1.100:20001
```

#### iOS Safari 安装步骤
1. 访问 `http://你的局域网IP:20001`
2. 点击底部分享按钮
3. 选择「添加到主屏幕」
4. 确认安装

#### Android Chrome 安装步骤
1. 访问 `http://你的局域网IP:20001`
2. 浏览器会自动显示底部安装横幅
3. 或点击页面右下角「📱 安装到桌面」按钮
4. 确认安装

### PWA 功能特性

- ✅ **离线缓存**：静态资源离线可用
- ✅ **网络优先**：API 请求始终获取最新数据（5分钟缓存）
- ✅ **桌面图标**：自定义 192x192 和 512x512 图标
- ✅ **全屏体验**：安装后以独立窗口运行
- ✅ **自动更新**：后台自动检查并更新 Service Worker

### 故障排查

**问题：未显示「安装」按钮**
- 确保使用 `npm run preview` 而不是 `npm run dev`
- 检查浏览器控制台是否有 Service Worker 注册错误
- Chrome DevTools → Application → Manifest 检查配置

**问题：手机无法访问**
- 确保手机和电脑在同一局域网
- 检查电脑防火墙是否放行端口 20001 和 20002
- 尝试临时关闭电脑防火墙测试

**问题：API 请求失败**
- 修改客户端 API 基础路径使用局域网 IP：
  ```javascript
  // client/src/api.js
  const BASE_URL = 'http://192.168.1.100:20002/api'
  ```
- 或者在手机端设置后端代理

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**祝使用愉快！** 🎮
