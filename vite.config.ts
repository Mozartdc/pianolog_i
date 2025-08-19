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
      // ✅ PWA 캐시 크기 제한 증가 및 최적화
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB로 증가
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
        // ✅ 큰 파일들은 런타임 캐시로 처리
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
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
  // 개발 서버 설정
  server: {
    port: 5173,
    host: true
  },
  // ✅ 빌드 최적화 설정
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    // ✅ 청크 크기 경고 임계값 증가
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // ✅ 수동 청크 분할로 번들 크기 최적화
        manualChunks: {
          // 큰 라이브러리들을 별도 청크로 분리 (실제 설치된 것만)
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
  // 환경 변수 설정
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})