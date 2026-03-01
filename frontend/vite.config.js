import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // Automatically splits node_modules into a separate 'vendor' chunk.
    // Vendor code changes less frequently than app code, so it gets a long
    // cache TTL on CDN while app chunks get busted on every deploy.
    splitVendorChunkPlugin(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
  build: {
    outDir:          'dist',
    sourcemap:       false,
    // Warn on chunks > 500 KB to catch unintentional large bundles
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Fine-grained manual chunks for optimal cache utilisation
        manualChunks: {
          // Core React runtime — changes only on React version updates
          'react-core': ['react', 'react-dom'],
          // Routing — separated so page navigations don't re-download React
          'react-router': ['react-router-dom'],
          // Redux — changes only when store shape changes
          'redux':        ['@reduxjs/toolkit', 'react-redux'],
          // Charts — recharts is large (~800 KB unparsed), isolated so
          // customers never download it unless they visit the admin dashboard
          'charts':       ['recharts'],
          // UI utilities
          'ui-utils':     ['react-hook-form', 'react-hot-toast', 'axios'],
        },
        // Use content hash in filenames for long-term CDN caching
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash].[ext]',
      },
    },
  },
  // Optimize dependencies that don't use ES modules
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'axios'],
  },
});
