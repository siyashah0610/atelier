import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  envDir: '../',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { popup: resolve(__dirname, 'index.html') },
      output: { entryFileNames: '[name].js', chunkFileNames: '[name].js', assetFileNames: '[name].[ext]' },
    },
  },
})
