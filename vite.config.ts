import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    ),
  },
  optimizeDeps: {
    include: [
      '@tanstack/react-router',
      '@wordpress/admin-ui',
      '@wordpress/components',
      '@wordpress/dataviews',
      '@wordpress/route',
      '@wordpress/ui',
      '@wordpress/theme',
      '@wordpress/icons',
    ],
  },
})
