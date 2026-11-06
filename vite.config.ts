import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'CLIVE · CompanionOS',
        short_name: 'CLIVE',
        description: 'Your cheeky digital companion.',
        theme_color: '#080d18',
        background_color: '#080d18',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: []
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] }
    })
  ],
  server: { host: '0.0.0.0' }
})