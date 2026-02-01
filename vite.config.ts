import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // -----------------------------------------------------------------------
  // DEPLOYMENT CONFIGURATION
  // -----------------------------------------------------------------------
  // FOR VERCEL (Your current screenshot):
  // We must use '/' because Vercel hosts the app at the root domain.
  // -----------------------------------------------------------------------
  base: '/', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});