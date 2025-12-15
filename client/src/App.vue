<template>
  <div id="app">
    <div class="content">
      <router-view />
    </div>
    <footer class="app-footer">
      © {{ new Date().getFullYear() }} 1plabs.pro 版权所有
    </footer>
    <!-- PWA 安装按钮 -->
    <InstallPWA />
  </div>
</template>

<script setup>
import InstallPWA from './components/InstallPWA.vue'
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
</style>
