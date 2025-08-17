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
      // Force single React instance across the app to avoid invalid hook calls
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
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
    exclude: [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "scheduler"
    ],
    force: true,
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Don't externalize React in dev mode, but ensure it's properly resolved
        return false;
      }
    }
  }
}));