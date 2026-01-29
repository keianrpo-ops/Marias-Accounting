
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: true,
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        'recharts',
        '@stripe/react-stripe-js',
        '@stripe/stripe-js',
        '@supabase/supabase-js'
      ]
    }
  }
});
