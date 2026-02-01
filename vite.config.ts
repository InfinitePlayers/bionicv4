import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // -----------------------------------------------------------------------
  // DEPLOYMENT CONFIGURATION
  // -----------------------------------------------------------------------
  // FOR GITHUB PAGES:
  // Keep base set to '/bionic/' (or your exact repo name).
  //
  // FOR VERCEL / NETLIFY:
  // Change base to '/' or remove the line entirely.
  // -----------------------------------------------------------------------
  base: '/bionic/', 
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