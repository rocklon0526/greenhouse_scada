import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src'),
      '@modules': path.resolve(__dirname, '../../modules'),
      'lucide-react': path.resolve(__dirname, './node_modules/lucide-react'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      '@projects': path.resolve(__dirname, '../../../projects'),
      // Dynamic Project Entry
      '@project-entry': path.resolve(__dirname, '../../../projects/greenhouse/frontend/index.ts'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  server: {
    host: '0.0.0.0', // [重要] 確保 Docker 外部可以訪問
    fs: {
      allow: ['..', '../../../projects'],
    },
    port: 5173,
    strictPort: false,

    // ▼▼▼ 新增這段設定 ▼▼▼
    watch: {
      usePolling: true,   // [關鍵] 強制輪詢檔案變更
      interval: 100,      // (選填) 輪詢間隔，預設 100ms
    },
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    proxy: {
      '/api': {
        target: 'http://backend-core:8000', // 注意：在 Docker 內可能需要改為 'http://backend-core:8000'
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://backend-core:8000',   // 同上，可能需改為 'ws://backend-core:8000'
        ws: true,
        changeOrigin: true,
      }
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})