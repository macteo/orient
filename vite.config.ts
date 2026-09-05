import { existsSync, globSync } from 'node:fs';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const generatedPagesDir = '.generated/pages';

const generatedInputs = existsSync(generatedPagesDir)
  ? globSync(`${generatedPagesDir}/**/index.html`)
  : [];

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  publicDir: 'public',
  plugins: [tailwindcss()],
  define: {
    'import.meta.env.VITE_TEST_SEED': JSON.stringify(process.env.VITE_TEST_SEED ?? ''),
  },
  build: {
    rollupOptions: {
      input: ['index.html', ...generatedInputs],
    },
  },
});
