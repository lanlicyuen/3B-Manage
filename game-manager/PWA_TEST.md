# PWA 快速测试指南

## 本地电脑测试

```bash
cd /home/lanlic/Html-Project/3b-manage/game-manager

# 1. 启动后端
cd server
npm start &
cd ..

# 2. 构建并启动前端预览
cd client
npm run build
npm run preview
```

访问 http://localhost:20001，查看浏览器地址栏或页面右下角是否出现安装提示。

## 手机测试

### 准备工作

```bash
# 1. 查看你的局域网 IP
ip addr show | grep "inet " | grep -v 127.0.0.1

# 假设输出: 192.168.1.100
```

### 启动服务

```bash
# 后端必须正在运行（端口 20002）
cd /home/lanlic/Html-Project/3b-manage/game-manager/server
npm start

# 前端预览服务（端口 20001）
cd /home/lanlic/Html-Project/3b-manage/game-manager/client
npm run build
npm run preview
```

### 手机访问

手机浏览器打开：`http://你的局域网IP:20001`

示例：`http://192.168.1.100:20001`

## 验证清单

- [ ] 浏览器显示安装提示
- [ ] 点击安装后桌面出现图标
- [ ] 打开 PWA 应用可以正常使用
- [ ] 离线状态下静态页面仍可访问
- [ ] 网络恢复后 API 请求正常

## 常见问题

**Q: 手机无法访问**  
A: 确保手机和电脑在同一 WiFi，检查防火墙设置

**Q: API 请求失败 (CORS)**  
A: 修改 `client/src/api.js` 的 `BASE_URL` 为局域网 IP：
```javascript
const BASE_URL = 'http://192.168.1.100:20002/api'
```

**Q: 未显示安装按钮**  
A: 必须使用 `npm run preview`，dev 模式无法激活 Service Worker
