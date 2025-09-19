import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // CORRIGIDO: Paths corretos sem /index.js
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime.js"),
      "scheduler": path.resolve(__dirname, "./node_modules/scheduler"),
    },
    dedupe: [
      "react",
      "react-dom", 
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "scheduler"
    ],
  },
  optimizeDeps: {
    include: [
      "react", 
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "scheduler"
    ],
    exclude: [],
    force: true
  },
  // CRÍTICO: Configuração para resolver conflitos React
  define: {
    __DEV__: JSON.stringify(mode === 'development'),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Força todos os React-related em um chunk único
          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-single';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
}));