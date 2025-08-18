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
  envDir: "env"
})
