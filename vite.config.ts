/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ✅ CONFIGURAÇÃO ULTRA-SIMPLIFICADA - Remove todas as otimizações que podem causar conflitos
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.ts',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  build: {
    target: 'es2020',
    sourcemap: false,
    // ✅ REMOVIDO: manualChunks - deixa Vite fazer automaticamente
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // ✅ REMOVIDO: lista explícita - deixa Vite detectar automaticamente
    force: true, // Força rebuild do cache
  },
}));
