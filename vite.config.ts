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
      // FORÇA ABSOLUTA: Todas as variações React para mesmo caminho
      "react": path.resolve(__dirname, "./node_modules/react/index.js"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom/index.js"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime.js"),
      "scheduler": path.resolve(__dirname, "./node_modules/scheduler/index.js"),
      "scheduler/tracing": path.resolve(__dirname, "./node_modules/scheduler/tracing.js"),
    },
    dedupe: [
      "react",
      "react-dom", 
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "scheduler",
      "scheduler/tracing"
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
    force: true,
    // CRÍTICO: Evita pre-bundling que pode criar instâncias separadas
    esbuildOptions: {
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
    }
  },
  // CRÍTICO: Configuração extrema para forçar instância única
  define: {
    __DEV__: JSON.stringify(mode === 'development'),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // FORÇA todos os React-related em um chunk único
          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-single';
          }
          // Agrupa outras dependências
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  // CRÍTICO: Cache busting para forçar rebuild completo
  cacheDir: '.vite-new'
}));