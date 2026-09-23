/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // three.js 관련 라이브러리를 별도 청크로 분리해 캐시 효율을 높입니다.
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
          ui: ['react', 'react-dom', 'framer-motion', 'zustand'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/utils/**/*.ts', 'src/store/**/*.ts', 'src/data/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/utils/textures/textureFactory.ts', 'src/utils/textures/texture.worker.ts'],
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
    },
  },
});
