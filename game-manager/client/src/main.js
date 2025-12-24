import { createApp } from 'vue';
import router from './router';
import App from './App.vue';
import { isAdmin } from './utils/auth';

const app = createApp(App);
app.use(router);

// 路由守卫：保护需要管理员权限的页面
router.beforeEach((to, from, next) => {
  // 需要管理员权限的路由
  const adminRoutes = ['/members', '/events/create', '/events', '/reports'];
  
  // 检查是否需要权限（排除事件详情页，允许只读访问）
  const needsAdmin = adminRoutes.some(route => {
    // 精确匹配 /events 但不匹配 /events/:id
    if (route === '/events') {
      return to.path === '/events';
    }
    return to.path.startsWith(route);
  }) || to.path.match(/^\/events\/\d+\/edit$/);
  
  if (needsAdmin && !isAdmin()) {
    alert('需要总督登录才能访问此页面');
    next('/');
    return;
  }
  
  next();
});

app.mount('#app');

// 注册 PWA Service Worker
if ('serviceWorker' in navigator) {
  // 使用 vite-plugin-pwa 生成的虚拟模块
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('🔄 PWA 有新版本可用');
      },
      onOfflineReady() {
        console.log('✅ PWA 离线可用');
      },
      onRegistered(registration) {
        console.log('✅ Service Worker 已注册', registration);
      },
      onRegisterError(error) {
        console.error('❌ Service Worker 注册失败', error);
      }
    });
  }).catch(err => {
    console.warn('⚠️ PWA 模块加载失败（开发模式正常）', err);
  });

  // PWA 安装诊断（仅在 preview/production 模式）
  if (import.meta.env.PROD) {
    setTimeout(() => {
      // 检查是否捕获到 beforeinstallprompt 事件
      if (!window.__pwaInstallPromptCaptured) {
        console.log('📱 PWA 安装检查:');
        console.log('  ℹ️ 未捕获到 beforeinstallprompt 事件');
        console.log('  可能原因:');
        console.log('    1. 已经安装过此 PWA');
        console.log('    2. 不满足安装条件（需要 HTTPS 或 localhost）');
        console.log('    3. manifest.json 配置问题');
        console.log('    4. Service Worker 未成功注册');
        console.log('  当前环境:');
        console.log('    - HTTPS:', location.protocol === 'https:');
        console.log('    - Localhost:', location.hostname === 'localhost');
        console.log('    - SW 支持:', 'serviceWorker' in navigator);
      }
    }, 3000);
  }
}
