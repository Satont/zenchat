import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, 'dist/main'),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@desktop': resolve(__dirname, 'src'),
      '@twirchat/shared': resolve(__dirname, '../shared/index.ts'),
      '@twirchat/shared/constants': resolve(__dirname, '../shared/constants.ts'),
      '@twirchat/shared/protocol': resolve(__dirname, '../shared/protocol.ts'),
      '@twirchat/shared/types': resolve(__dirname, '../shared/types.ts'),
    },
  },
  root: 'src/views/main',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
