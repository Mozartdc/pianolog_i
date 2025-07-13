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
'favicon.svg',
'favicon.ico',
'robots.txt',
'apple-touch-icon.png'
],
manifest: {
name: 'pianolog',
short_name: 'pianolog',
description: 'A piano practice app',
theme_color: '#ffffff',
icons: [
{
src: 'pwa-192x192.png',
sizes: '192x192',
type: 'image/png'
},
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