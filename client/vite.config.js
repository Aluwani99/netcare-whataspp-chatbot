import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './', // relative paths so the site works at https://USER.github.io/REPO/
  plugins: [react()],
  // the demo build bundles the bot logic from ../server/src, which has no use for dotenv
  resolve: { alias: { 'dotenv/config': path.resolve(here, 'src/empty.js') } },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' }, fs: { allow: ['..'] } },
});
