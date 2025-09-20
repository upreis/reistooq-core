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
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor';
          }
          
          // UI Components
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          
          // Data fetching
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          
          // Charts
          if (id.includes('recharts')) {
            return 'chart-vendor';
          }
          
          // Icons
          if (id.includes('lucide-react')) {
            return 'icon-vendor';
          }
          
          // Animations
          if (id.includes('framer-motion')) {
            return 'animation-vendor';
          }
          
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "scheduler",
      // ✅ ADICIONADOS - Previne múltiplas instâncias:
      "@tanstack/react-query",
      "@radix-ui/react-slot",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tooltip",
      "lucide-react",
      "framer-motion"
    ],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    force: true,
  },
}));