import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      includeAssets: [
        'apple-touch-icon.png'
      ],
      // ✅ Increase PWA cache size limit and optimize
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Increased to 5MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
        // ✅ Handle large files with runtime cache
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      manifest: {
        name: '디지털 피아노 갤러리 피출앱',
        short_name: 'pianolog',
        description: '디지털 피아노 갤러리 피출앱 - 피아노 연습 기록 관리용 앱',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#45b5aa',
        scope: '/',
        id: 'pianolog-app-dcdc',
        orientation: 'portrait',
        lang: 'ko',
        categories: ['music', 'education', 'productivity'],
        icons: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // Dev server settings
  server: {
    port: 5173,
    host: true
  },
  // ✅ Build optimization settings
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    // ✅ Increase chunk size warning threshold
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // ✅ Optimize bundle size with manual chunk splitting
        manualChunks: {
          // Split large libraries into separate chunks (only installed ones)
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'lottie-vendor': ['lottie-react', 'lottie-web'],
          'sentry-vendor': ['@sentry/react'],
          'date-vendor': ['dayjs'],
          'motion-vendor': ['framer-motion'],
          'canvas-vendor': ['canvas-confetti', 'fireworks-js']
        }
      }
    }
  },
  // Environment variable settings
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})