import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  onSuccess: async () => {
    mkdirSync('dist/styles', { recursive: true });
    copyFileSync('src/styles/reeljs.css', 'dist/styles/reeljs.css');
  },
});
