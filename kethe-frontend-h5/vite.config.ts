import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url'
import metaPlugin, { getBuildHash } from './build/meta.ts'
import dayjs from 'dayjs'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isServe = command === 'serve'
  console.log('env.VITE_APP_MODE_ENV: ', env.VITE_APP_MODE_ENV)
  console.log('isServe: ', isServe)
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  return {
    define: {
      // https://github.com/vitejs/vite/issues/2605#issuecomment-803276660
      LOCAL_BUILD_HASH: env.VITE_APP_MODE_ENV !== 'dev' ? JSON.stringify(getBuildHash()) : '""',
      LOCAL_BUILD_TIME: env.VITE_APP_MODE_ENV !== 'dev' ? JSON.stringify(now) : '""',
    },
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'logo.svg',
          'favicon-16x16.png',
          'favicon-32x32.png',
          'apple-touch-icon.png',
        ],
        manifest: {
          name: 'Kethe',
          short_name: 'Kethe',
          description: 'Kethe clipboard workspace',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallbackDenylist: [/^\/kethe\/api(?:\/|$)/],
        },
      }),
      metaPlugin(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/kethe/api': {
          target: 'http://localhost:6307',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kethe\/api/, '/api'),
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
