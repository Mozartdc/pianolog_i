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
'robots.txt',
'apple-touch-icon.png'
],
manifest: {
name: 'pianolog',
short_name: 'pianolog',
description: '디지털 피아노 갤러리 피출앱',
theme_color: '#ffffff',
icons: [
{
src: 'pwa-512x512.png',
sizes: '512x512',
type: 'image/png'
},
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