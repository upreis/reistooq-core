import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GlobalErrorBoundary } from '@/core/errors'

import { setupGlobalToast } from "@/utils/toast-bridge";
import { toast } from "sonner";
import './index.css'

// 🧹 CLEANUP: Remover chaves pesadas do localStorage que causam travamento
const HEAVY_KEYS_TO_CLEAN = [
  'vendas-canceladas-store',
  'devolucoes-store',
  'vendas-persistent-state'
];

try {
  let cleaned = 0;
  HEAVY_KEYS_TO_CLEAN.forEach(key => {
    const item = localStorage.getItem(key);
    if (item && item.length > 50000) { // > 50KB
      localStorage.removeItem(key);
      cleaned++;
      console.log(`🧹 [Cleanup] Removida chave pesada: ${key} (${(item.length / 1024).toFixed(1)}KB)`);
    }
  });
  if (cleaned > 0) {
    console.log(`✅ [Cleanup] ${cleaned} chaves pesadas removidas do localStorage`);
  }
} catch (e) {
  console.warn('⚠️ [Cleanup] Erro ao limpar localStorage:', e);
}

console.log('🔵 [Main] Iniciando aplicação...');

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

console.log('✅ [Main] Montando app...');

const root = createRoot(container);

root.render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>
);

console.log('✅ [Main] App renderizado');
