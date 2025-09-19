import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"

import { setupGlobalToast } from "@/utils/toast-bridge";
import { toast } from "sonner";
import './index.css'

// Setup do toast global
setupGlobalToast((options) => {
  if (options.variant === 'destructive') {
    toast.error(options.title, { description: options.description });
  } else {
    toast.success(options.title, { description: options.description });
  }
});

const container = document.getElementById("root");
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);

// Componente temporário enquanto Vite reconstrói
function TemporaryApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: '#ffffff',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <h1>🔧 Sistema Reistooq - Reconstruindo</h1>
      <p>Aplicando correções para múltiplas instâncias React...</p>
      <div style={{ marginTop: '2rem' }}>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#333', 
          borderRadius: '8px', 
          marginBottom: '1rem' 
        }}>
          <h3>✅ Configuração Vite Atualizada</h3>
          <p>- Alias absolutos para React forçados</p>
          <p>- Cache limpo (.vite-new)</p>
          <p>- Chunk único React garantido</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Recarregar Sistema
        </button>
      </div>
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
        <p>Aguarde o Vite finalizar o rebuild...</p>
        <p>Rota atual: {window.location.pathname}</p>
      </div>
    </div>
  );
}

root.render(
  <StrictMode>
    <BrowserRouter>
      <TemporaryApp />
    </BrowserRouter>
  </StrictMode>
);