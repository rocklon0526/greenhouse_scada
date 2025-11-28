import { defineConfig } from 'vite'
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
  // 增加這段設定來優化依賴項，解決可能的 ESM 相容性問題
  optimizeDeps: {
    // 加入 zustand 到此列表中，強制 Vite 處理其 CommonJS 轉換
    include: ['react', 'react-dom', 'scheduler', 'zustand'],
  },
  server: {
    // 若埠號被佔用，自動開啟下一個
    port: 5173,
    strictPort: false, 
  }
})