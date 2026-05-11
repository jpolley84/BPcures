import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Split vendor libs into their own cacheable chunks. Users hit the site
    // many times; the vendor chunk's hash rarely changes (only when react/
    // router/framer/lucide versions bump), so it sits in their browser cache
    // across deploys while our app code re-fetches on every push.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // framer-motion is the single biggest dep (~60 KB gzipped) — pull it
          // into its own chunk so users who don't hit motion-heavy routes load
          // it lazily once parsed by another lazy route.
          if (id.includes('framer-motion')) return 'vendor-motion';
          // lucide-react icon library — tree-shaken in app code but the
          // imported subset is large enough to warrant its own chunk.
          if (id.includes('lucide-react')) return 'vendor-icons';
          // react + react-dom + react-router — the framework core. Changes
          // rarely; cache hit rate is highest here.
          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('scheduler') ||
            (id.includes('node_modules/react/') && !id.includes('react-router'))
          ) {
            return 'vendor-react';
          }
          // Stripe SDK — only loaded on checkout-related code paths. Splitting
          // it lets the home/quiz initial load skip Stripe parse time.
          if (id.includes('@stripe/')) return 'vendor-stripe';
          // Everything else from node_modules goes to a misc vendor chunk.
          return 'vendor';
        },
      },
    },
    // Suppress the 500kB warning — with route-splitting + vendor-splitting,
    // no individual chunk should exceed 250kB. If one does, we want to see
    // the warning again to investigate.
    chunkSizeWarningLimit: 250,
  },
})
