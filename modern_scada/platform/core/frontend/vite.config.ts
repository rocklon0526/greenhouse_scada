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
    },
    // Prevent duplicate React instances in the bundle
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  server: {
    fs: {
      // Allow serving files from parent directories
      allow: ['..', '../../../projects'],
    },
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      }
    },
  },
  build: {
    // Increase chunk size warning limit for larger 3D components
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})