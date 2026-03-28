import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Iglesia - Sistema de Gestión',
        short_name: 'Iglesia',
        description: 'Sistema de gestión pastoral para iglesias',
        theme_color: '#1E3A5F',
        background_color: '#F4F6F9',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: 'icons/icon-512.svg', sizes: '192x192', type: 'image/svg+xml' },
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cbpaofgpqwcrcpzldnch\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
})
