import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { appVersionMark } from '@aurouscia/vite-app-version'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    appVersionMark()
  ],
  server:{
    port:5173
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
  css:{
    preprocessorOptions:{
      scss:{
        api: 'modern-compiler'
      }
    }
  },
  envDir: "env"
})
