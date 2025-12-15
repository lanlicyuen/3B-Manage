# 🔧 Nginx 配置修复指南

## 问题诊断

### 症状
- 浏览器显示空白页面
- 控制台错误：`Failed to load resource: 500 (Internal Server Error)`
- Router is responding to: /
- 本地测试正常，生产环境 API 返回 502 Bad Gateway

### 原因
Nginx Proxy Manager 中的 API 代理配置错误或缺失，导致 `/api/*` 请求无法转发到后端服务（127.0.0.1:20002）

## 验证步骤

### 1. 本地服务检查
```bash
# 检查前端服务（应该在 0.0.0.0:20001）
curl -I http://localhost:20001/
# 预期：200 OK，返回 HTML

# 检查后端服务（应该在 127.0.0.1:20002）
curl -s http://127.0.0.1:20002/api/members | head -c 100
# 预期：返回 JSON 数组

# 检查后端事件列表
curl -s http://127.0.0.1:20002/api/events | head -c 100
# 预期：返回 JSON 数组
```

### 2. 生产环境检查
```bash
# 检查前端页面
curl -Ik https://3b.1plabs.pro/
# 预期：200 OK

# 检查 API 代理（这里会失败）
curl -sk https://3b.1plabs.pro/api/members
# 实际：502 Bad Gateway
# 预期：返回 JSON 数据
```

## 修复方案

### 方案 A：使用 Nginx Proxy Manager Web UI（推荐）

1. 访问 Nginx Proxy Manager：http://YOUR_SERVER:9001
   - 默认账号：admin@example.com
   - 如需修改密码，登录后在设置中更改

2. 找到 `3b.1plabs.pro` 的 Proxy Host 配置

3. 点击右侧的"三个点"→ "Edit"

4. 进入"Custom Locations"标签

5. 添加/编辑 API 代理：
   ```
   Define location: /api
   Scheme: http
   Forward Hostname / IP: 127.0.0.1
   Forward Port: 20002
   
   勾选：
   ☑ Websockets Support（如果有）
   ☑ Block Common Exploits
   
   Advanced 配置（可选）：
   proxy_set_header Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```

6. 保存配置

7. 测试：
   ```bash
   curl -sk https://3b.1plabs.pro/api/members | head -c 100
   ```

### 方案 B：使用命令行修改（不推荐）

如果必须手动编辑，Nginx配置通常在：
- `/data/nginx/proxy_host/` （NPM Docker容器内）
- `/etc/nginx/sites-available/` （传统安装）

**不建议手动修改**，因为 Nginx Proxy Manager 会覆盖手动更改。

## 验证修复

### 1. 测试 API 端点
```bash
# 测试成员列表
curl -sk https://3b.1plabs.pro/api/members | jq length
# 预期：返回成员数量（如 98）

# 测试事件列表
curl -sk https://3b.1plabs.pro/api/events | jq length
# 预期：返回事件数量（如 4）
```

### 2. 测试前端页面
打开浏览器访问：https://3b.1plabs.pro

- 应该能看到矩阵视图
- 控制台无 500/502 错误
- 成员数据正常加载

## 当前服务状态

### 端口监听
```bash
# 前端：Vite开发服务器
0.0.0.0:20001  → Vue3 前端应用

# 后端：Express API服务器
127.0.0.1:20002 → Node.js/Express API
```

### 进程状态
```bash
# 查看服务进程
ps aux | grep -E "vite|node server.js" | grep -v grep

# 前端进程
node /home/lanlic/Html-Project/3b-manage/game-manager/client/node_modules/.bin/vite

# 后端进程
node server.js (在 /home/lanlic/Html-Project/3b-manage/game-manager/server)
```

### 日志位置
```bash
# 后端日志
tail -f /home/lanlic/Html-Project/3b-manage/game-manager/server/server.log

# 前端日志（终端输出）
# 在运行 npm run dev 的终端查看
```

## 预期的 Nginx 配置

完整的 Proxy Host 配置应该包含：

### 主配置
- **Domain Names**: `3b.1plabs.pro`
- **Scheme**: `http`
- **Forward Hostname/IP**: `127.0.0.1`（前端）
- **Forward Port**: `20001`
- **Block Common Exploits**: ✓
- **Websockets Support**: ✓（PWA需要）
- **HTTP/2 Support**: ✓

### SSL配置
- **Force SSL**: ✓
- **HTTP/2 Support**: ✓
- **HSTS Enabled**: ✓（可选）

### Custom Locations
**Location 1: /api**
- **Forward Scheme**: http
- **Forward Host**: 127.0.0.1
- **Forward Port**: 20002

## 故障排查清单

- [ ] 前端服务运行在 0.0.0.0:20001
- [ ] 后端服务运行在 127.0.0.1:20002
- [ ] 本地测试 `curl http://localhost:20002/api/members` 成功
- [ ] Nginx Proxy Manager 有 `3b.1plabs.pro` 配置
- [ ] Custom Location `/api` 指向 127.0.0.1:20002
- [ ] SSL 证书有效
- [ ] 防火墙允许 443 端口
- [ ] 生产测试 `curl https://3b.1plabs.pro/api/members` 成功

## 紧急回退

如果配置出错导致网站无法访问：

1. 登录 Nginx Proxy Manager (http://YOUR_SERVER:9001)
2. 禁用或删除有问题的 Custom Location
3. 保存并重新加载
4. 网站应该恢复访问（但 API 仍然不工作）

## 参考配置示例

### 完整的 Nginx 配置片段
```nginx
# 主站点（前端）
server {
    listen 443 ssl http2;
    server_name 3b.1plabs.pro;
    
    # SSL 配置由 NPM 管理
    
    # 前端应用（默认）
    location / {
        proxy_pass http://127.0.0.1:20001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # PWA 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 后端 API（关键配置）
    location /api {
        proxy_pass http://127.0.0.1:20002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 后续维护

### 重启服务
```bash
# 重启后端
cd /home/lanlic/Html-Project/3b-manage/game-manager/server
pkill -f "node server.js"
nohup node server.js > server.log 2>&1 &

# 重启前端（如需要）
cd /home/lanlic/Html-Project/3b-manage/game-manager/client
# Ctrl+C 终止当前进程
npm run dev
```

### 查看实时日志
```bash
# 后端日志
tail -f /home/lanlic/Html-Project/3b-manage/game-manager/server/server.log

# 实时监控所有API请求
tail -f server.log | grep "GET \|POST \|PUT \|DELETE "
```

---

**创建时间**: 2025-12-15  
**状态**: 等待 Nginx 配置修复  
**影响**: API 请求 502，前端显示空白页
