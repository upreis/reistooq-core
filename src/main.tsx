import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import App from './App'

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

// Create error boundary wrapper with progressive loading
function AppWithErrorBoundary() {
  try {
    // Import main app
    return (
      <React.Suspense fallback={<div>Carregando...</div>}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.Suspense>
    );
  } catch (error) {
    console.error('Main app failed:', error);
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        minHeight: '100vh'
      }}>
        <h1>Sistema Indisponível</h1>
        <p>Erro crítico detectado. Recarregue a página.</p>
        <button onClick={() => window.location.reload()}>Recarregar</button>
      </div>
    );
  }
}

root.render(<AppWithErrorBoundary />);