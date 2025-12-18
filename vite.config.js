import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for GitHub Pages deployment
  // Change 'retro-arcade-game' to your repository name
  base: process.env.GITHUB_PAGES ? '/retro-arcade-game/' : '/',
  root: '.',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
