import { defineConfig } from 'vite';
export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  publicDir: '../../public',
  server: { host: '127.0.0.1', port: 4310, strictPort: true, proxy: { '/api': 'http://127.0.0.1:4311' } },
  build: { outDir: '../../.editor-dist', emptyOutDir: true },
});
