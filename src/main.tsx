import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

import { setupGlobalToast } from "@/utils/toast-bridge";
import { toast } from "sonner";
import './index.css'

// ✅ VALIDAÇÃO CRÍTICA: Verifica se React foi carregado corretamente
console.log('🔵 [Main] Iniciando aplicação...');
console.log('🔍 [Main] React version:', React.version);

// ✅ Verifica se hooks estão disponíveis
const hooksAvailable = React.useState && React.useEffect && React.useContext;
if (!hooksAvailable) {
  console.error('🚨 CRITICAL: React hooks not available!');
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #1a1a1a; color: #fff; font-family: system-ui; flex-direction: column; padding: 20px;">
        <div style="text-align: center; max-width: 600px;">
          <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #ef4444;">⚠️ Erro Crítico de React</h1>
          <p style="margin-bottom: 1rem; color: #a3a3a3;">Os React hooks não estão disponíveis. Cache corrompido detectado.</p>
          <button onclick="clearCacheAndReload()" style="padding: 12px 24px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; margin-top: 1rem;">
            Limpar Cache e Recarregar
          </button>
          <p style="margin-top: 2rem; color: #737373; font-size: 0.85rem;">
            Ou pressione Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
          </p>
        </div>
      </div>
      <script>
        function clearCacheAndReload() {
          try {
            localStorage.clear();
            sessionStorage.clear();
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
                location.reload();
              });
            } else {
              location.reload();
            }
          } catch (e) {
            location.reload();
          }
        }
      </script>
    `;
  }
  throw new Error('React hooks not available - cache corrupted');
}

// Setup do toast global
setupGlobalToast((options) => {
  if (options.variant === 'destructive') {
    toast.error(options.title, { description: options.description });
  } else {
    toast.success(options.title, { description: options.description });
  }
});

const container = document.getElementById("root");
if (!container) {
  throw new Error('Failed to find the root element');
}

console.log('✅ [Main] Hooks validados, montando app...');

const root = createRoot(container);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

console.log('✅ [Main] App renderizado com sucesso');
