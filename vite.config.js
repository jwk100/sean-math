import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  base: '/sean-math/',
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon-192.png','icon-512.png','apple-touch-icon.png'],
    manifest: {
      name: "Sean's Math", short_name: 'Sean Math', start_url: '/sean-math/', scope: '/sean-math/',
      display: 'standalone', orientation: 'landscape', background_color: '#e8f4ff', theme_color: '#2b7de9',
      icons: [{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,svg}'] }
  })]
})
