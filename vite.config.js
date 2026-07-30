import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Config reconstruida a partir de recuperado/manifest.webmanifest,
// recuperado/sw.js y recuperado/registerSW.js:
//  - sw.js hace skipWaiting() + clientsClaim()  -> registerType: 'autoUpdate'
//  - registerSW.js es el script generado          -> injectRegister: 'script'
//  - el precache incluye .woff/.woff2            -> globPatterns con las fuentes
//  - NavigationRoute(createHandlerBoundToURL("/index.html")) -> navigateFallback
//  - favicon.svg e icons/*.png aparecen dos veces en el precache
//    (una por globPatterns y otra por includeAssets)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Cian duerme',
        short_name: 'Cian duerme',
        description: 'Registro de sueño y tomas del bebé, offline y sincronizado.',
        start_url: '/',
        display: 'standalone',
        background_color: '#EDFFDA',
        theme_color: '#36A783',
        lang: 'es',
        scope: '/',
        orientation: 'portrait',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
