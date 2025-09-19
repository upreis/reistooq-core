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
      // Força instância única React
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
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
      "@radix-ui/react-tooltip",
      "@radix-ui/react-dialog", 
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-popover",
      "@radix-ui/react-slot",
      "lucide-react",
      "framer-motion",
      "react-hook-form",
      "class-variance-authority",
      "clsx",
      "tailwind-merge"
    ],
  },
  optimizeDeps: {
    include: [
      "react", 
      "react-dom",
      "@tanstack/react-query",
      "lucide-react",
      "framer-motion",
      "react-hook-form"
    ],
    exclude: []
  },
}));