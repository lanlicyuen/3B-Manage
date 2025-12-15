import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa/apple-touch-icon.png', 'pwa/icon-192.png', 'pwa/icon-512.png'],
      manifest: {
        name: '3B游戏成员管理系统',
        short_name: '3B管理',
        description: '3B游戏成员和事件管理系统',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // 缓存静态资源（app shell）
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // API请求使用 network-first 策略
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5分钟
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: true, // 启用以便在 preview 模式测试
        type: 'module'
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 20001,
    open: true,
    allowedHosts: ['3b.1plabs.pro'],
    proxy: {
      '/api': {
        target: 'http://localhost:20002',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 20001,
    strictPort: true,
    allowedHosts: ['3b.1plabs.pro'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:20002',
        changeOrigin: true
      }
    }
  }
});
