import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps to save memory
    minify: 'esbuild', // Use esbuild for faster, less memory-intensive minification
    rollupOptions: {
      output: {
        // Reduce chunk splitting to use less memory
        manualChunks: undefined
      }
    },
    chunkSizeWarningLimit: 2000,
    // Optimize for production with less memory usage
    target: 'es2015',
    cssCodeSplit: false, // Disable CSS code splitting to reduce memory
    assetsInlineLimit: 2048, // Reduce inline limit
    // Memory optimization
    reportCompressedSize: false, // Skip compression reporting to save memory
    emptyOutDir: true,
    // Ensure PWA files are copied
    copyPublicDir: true
  },
  // For deployment on platforms like Vercel/Netlify
  base: '/'
}) 