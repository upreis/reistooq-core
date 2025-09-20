import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

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

console.log('🔧 Getting root container...');
const container = document.getElementById("root");
if (!container) {
  console.error('🚨 Root element not found!');
  throw new Error('Failed to find the root element');
}

console.log('🔧 Creating root...');
const root = createRoot(container);

// Create error boundary wrapper with progressive loading
function AppWithErrorBoundary() {
  console.log('🔧 AppWithErrorBoundary rendering...');
  
  try {
    return (
      <ErrorBoundary>
        <React.Suspense fallback={<div style={{padding: '20px', textAlign: 'center'}}>Carregando...</div>}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </React.Suspense>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('🚨 Error in AppWithErrorBoundary:', error);
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{textAlign: 'center'}}>
          <h1>⚠️ Erro Crítico</h1>
          <p>Falha ao inicializar a aplicação</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '10px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}

console.log('🔧 Rendering app...');
try {
  root.render(<AppWithErrorBoundary />);
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('🚨 Failed to render app:', error);
  // Fallback para mostrar erro crítico
  root.render(
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{textAlign: 'center'}}>
        <h1>🚨 Erro Crítico na Inicialização</h1>
        <p>Falha ao renderizar a aplicação</p>
        <pre style={{fontSize: '12px', marginTop: '10px'}}>{error?.toString()}</pre>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            marginTop: '10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Recarregar
        </button>
      </div>
    </div>
  );
}