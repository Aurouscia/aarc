import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { appVersionMark } from '@aurouscia/vite-app-version'
import fullReload from 'vite-plugin-full-reload'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
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
      '/api': {
        target: 'http://aarc.jowei19.com',
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
  envDir: "env"
})
