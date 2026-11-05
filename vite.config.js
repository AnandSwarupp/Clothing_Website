import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths let the built site run from any host or sub-folder.
  base: './',
  server: { port: 5173, strictPort: false },
  preview: { port: 4173, strictPort: false },
});
