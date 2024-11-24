import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server:{
    port:5173
  },
  build:{
    emptyOutDir:true,
    outDir:"../AARC-Backend/wwwroot"
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
  }
})
