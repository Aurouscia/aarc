import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import checker from 'vite-plugin-checker'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    checker({vueTsc:true})
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
