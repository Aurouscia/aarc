import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { appVersionMark } from '@aurouscia/vite-app-version'
import fullReload from 'vite-plugin-full-reload'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = 'env'
  const env = loadEnv(mode, resolve(__dirname, envDir), '')
  
  return {
    plugins: [
      vue(),
      appVersionMark(),
      fullReload([
        "src/app/**", "src/models/**", "src/utils/**"
      ])
    ],
    server: {
      host: '127.0.0.1',
      port: 5173,
      cors: {
        origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
        credentials: true
      },
      allowedHosts: [
        '127.0.0.1',
        'localhost'
      ],
      proxy: {
        '/proxy': {
          target: env.VITE_DevProxyTarget,
          changeOrigin: true,
        },
        '/api': {
          target: env.VITE_DevProxyTarget,
          changeOrigin: true,
        },
        '/sudo': {
          target: env.VITE_DevProxyTarget,
          changeOrigin: true,
        }
      }
    },
    build:{
      emptyOutDir:true,
      outDir:"../AARC-Backend/wwwroot",
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('@aurouscia'))
              return 'au'
            if (id.includes('node_modules'))
              return 'libs'
          }
        }
      }
    },
    resolve:{
      alias:{
        '@': resolve(__dirname, './src'),
        '~': resolve('')
      }
    },
    envDir: envDir
  }
})