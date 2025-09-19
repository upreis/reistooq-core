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
      // Force single React instance - more aggressive approach
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime", 
      "react/jsx-dev-runtime",
      "scheduler",
      "react-router-dom",
      "@tanstack/react-query"
    ],
  },
  optimizeDeps: {
    include: [
      "react", 
      "react-dom", 
      "react/jsx-runtime",
      "react/jsx-dev-runtime"
    ],
    force: true
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined
      }
    }
  },
}));