<template>
  <div v-if="showInstallPrompt" class="install-pwa">
    <button 
      class="install-button"
      @click="installPWA"
    >
      📲 安装到桌面
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showInstallPrompt = ref(false)
let deferredPrompt = null

onMounted(() => {
  console.log('📱 InstallPWA 组件已挂载，等待 beforeinstallprompt 事件...');

  // 监听安装提示事件
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ beforeinstallprompt 事件已触发');
    
    // 阻止默认提示
    e.preventDefault();
    
    // 保存事件
    deferredPrompt = e;
    
    // 显示自定义按钮
    showInstallPrompt.value = true;
    
    // 设置全局标记（用于诊断）
    window.__pwaInstallPromptCaptured = true;
    
    console.log('📲 PWA 安装按钮已显示');
  });

  // 监听安装成功事件
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA 安装成功');
    showInstallPrompt.value = false;
    deferredPrompt = null;
  });

  // 3秒后检查事件是否触发
  setTimeout(() => {
    if (!deferredPrompt) {
      console.log('⚠️ 3秒后未收到 beforeinstallprompt 事件');
      console.log('可能原因:');
      console.log('  1. PWA 已经安装');
      console.log('  2. 使用 npm run dev（需要 npm run preview）');
      console.log('  3. 不满足 PWA 安装条件');
      console.log('检查项:');
      console.log('  - 是否生产模式:', import.meta.env.PROD);
      console.log('  - manifest.json:', document.querySelector('link[rel="manifest"]') ? '✅' : '❌');
      console.log('  - Service Worker:', navigator.serviceWorker.controller ? '✅' : '⏳ 注册中');
    }
  }, 3000);
});

const installPWA = async () => {
  if (!deferredPrompt) {
    console.warn('⚠️ 没有可用的安装提示事件');
    return;
  }
  
  console.log('📲 用户点击安装按钮，显示浏览器原生提示...');
  
  // 显示安装提示
  deferredPrompt.prompt();
  
  // 等待用户选择
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`用户选择: ${outcome}`);
  
  if (outcome === 'accepted') {
    console.log('✅ 用户接受安装');
  } else {
    console.log('❌ 用户拒绝安装');
  }
  
  // 重置
  deferredPrompt = null;
  showInstallPrompt.value = false;
}
</script>

<style scoped>
.install-pwa {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.install-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  font-weight: 500;
}

.install-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.install-button:active {
  transform: translateY(0);
}

@keyframes slideIn {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
