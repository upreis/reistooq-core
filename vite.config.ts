import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Configuração limpa para eliminar problemas de múltiplas instâncias React
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      // Configurações específicas para evitar problemas de hooks
      jsxImportSource: 'react',
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Garantir uma única instância do React
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  
  // Configuração otimizada para evitar duplicação
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
    ],
    force: true, // Força reconstrução do cache
  },
  
  // Configuração de build limpa
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['@tanstack/react-query', 'react-router-dom'],
        }
      }
    }
  },
  
  // Evitar problemas de ESM
  define: {
    global: 'globalThis',
  },
}));