<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-left">
        <img src="/brand/logo.png" alt="Logo" class="header-logo" />
        <h1 class="system-title">游戏成员管理系统</h1>
      </div>
      <div class="header-right">
        <button v-if="!adminLoggedIn" @click="showLogin" class="btn-login">
          总督请进
        </button>
        <button v-else @click="handleLogout" class="btn-logout">
          退出管理
        </button>
      </div>
    </header>

    <!-- 管理功能导航栏（只在登录后显示） -->
    <nav v-if="adminLoggedIn" class="admin-nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
        📊 首页出勤表
      </router-link>
      <router-link to="/members" class="nav-item" :class="{ active: $route.path === '/members' }">
        👥 成员管理
      </router-link>
      <router-link to="/events/create" class="nav-item" :class="{ active: $route.path === '/events/create' }">
        ➕ 创建事件
      </router-link>
      <router-link to="/events" class="nav-item" :class="{ active: $route.path === '/events' }">
        📋 查看事件
      </router-link>
      <router-link to="/reports" class="nav-item" :class="{ active: $route.path === '/reports' }">
        📈 报表导出
      </router-link>
    </nav>

    <div class="content">
      <router-view :key="$route.fullPath" />
    </div>
    <footer class="app-footer">
      © {{ new Date().getFullYear() }} 1plabs.pro 版权所有
    </footer>
    <!-- PWA 安装按钮 -->
    <InstallPWA />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import InstallPWA from './components/InstallPWA.vue'
import { isAdmin } from './utils/auth'
import { api } from './api'

const router = useRouter()
const adminLoggedIn = ref(false)

// 初始化：从 localStorage 读取登录状态
onMounted(() => {
  adminLoggedIn.value = isAdmin()
})

// 显示登录弹窗
async function showLogin() {
  const password = prompt('请输入管理员密码：')
  if (!password) return
  
  try {
    const result = await api.adminLogin(password)
    localStorage.setItem('admin_token', result.token)
    adminLoggedIn.value = true
    alert('✅ 已进入管理模式')
    // 刷新当前页面以更新权限状态
    router.go(0)
  } catch (error) {
    alert('❌ ' + (error.message || '登录失败'))
  }
}

// 退出登录
async function handleLogout() {
  if (confirm('确定退出管理模式？')) {
    try {
      await api.adminLogout()
    } catch (error) {
      console.error('退出登录失败:', error)
    }
    localStorage.removeItem('admin_token')
    localStorage.removeItem('isAdmin')
    adminLoggedIn.value = false
    alert('已退出管理模式')
    // 跳转到首页
    router.push('/')
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f0f2f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
}

.app-footer {
  text-align: center;
  padding: 20px 0;
  margin-top: 40px;
  color: #999;
  font-size: 14px;
  background-color: transparent;
}

/* 顶部导航栏样式 */
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-left .system-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 10px;
}

.btn-login,
.btn-logout {
  padding: 8px 20px;
  border: 2px solid white;
  background: transparent;
  color: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-login:hover {
  background: white;
  color: #667eea;
  transform: translateY(-2px);
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}


/* 顶部导航栏样式 */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.15);
  padding: 4px;
  border-radius: 6px;
}

.system-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.btn-login,
.btn-logout {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-login {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-login:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.btn-logout {
  background-color: rgba(255, 255, 255, 0.95);
  color: #667eea;
}

.btn-logout:hover {
  background-color: white;
  transform: translateY(-1px);
}

/* 管理功能导航栏 */
.admin-nav {
  background: linear-gradient(to right, #f8f9fa, #e9ecef);
  padding: 12px 24px;
  display: flex;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #dee2e6;
}

.nav-item {
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid #dee2e6;
}

.nav-item:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .app-header {
    padding: 10px 16px;
  }
  
  .header-logo {
    height: 28px;
  }
  
  .system-title {
    font-size: 16px;
  }
  
  .header-right {
    gap: 8px;
  }
  
  .btn-login,
  .btn-logout {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  /* 移动端导航栏 */
  .admin-nav {
    padding: 8px 12px;
    gap: 6px;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .nav-item {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
