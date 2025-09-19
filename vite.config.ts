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
      // CRÍTICO: Força instância única React com paths absolutos
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
      "scheduler": path.resolve(__dirname, "./node_modules/scheduler"),
    },
    dedupe: [
      "react",
      "react-dom", 
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "scheduler",
      "react-router-dom",
      "react-router",
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-dialog", 
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-popover",
      "@radix-ui/react-slot",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-context-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-toast",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "lucide-react",
      "framer-motion",
      "react-hook-form",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "sonner",
      "cmdk",
      "vaul"
    ],
  },
  optimizeDeps: {
    include: [
      "react", 
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "lucide-react",
      "framer-motion",
      "react-hook-form",
      "react-router-dom",
      "scheduler"
    ],
    exclude: [],
    force: true  // CRÍTICO: Força rebuild das dependências
  },
  // CRÍTICO: Configuração adicional para resolver conflitos React
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Evita problemas com múltiplas instâncias em produção
        return false;
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['@radix-ui/react-tooltip', '@radix-ui/react-dialog', 'lucide-react']
        }
      }
    }
  },
}));