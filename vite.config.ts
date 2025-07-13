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
      // ✅ PWA가 캐시할 필수 파일만 남깁니다.
      includeAssets: [
        'apple-touch-icon.png', // 아이폰용 홈 화면 아이콘
        'pwa-512x512.png'      // 안드로이드용 홈 화면 아이콘
      ],
      manifest: {
        // ✅ 앱 정보를 한글로 수정합니다.
        name: 'pianolog',
        short_name: 'pianolog',
        description: '디지털 피아노 갤러리 피출앱(디지털 피아노 연습 기록 앱)',
        // ✅ 앱의 테마 색상과 맞춥니다.
        theme_color: '#45b5aa',
        background_color: '#ffffff',
        display: "standalone",
        start_url: "/",
        icons: [
          // ✅ 192px 아이콘을 삭제했으므로, 512px 설정만 남깁니다.
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})