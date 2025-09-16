import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import App from './App'
import SimpleApp from './App.simple'
import FallbackApp from './App.fallback'

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
    // Now that React hooks work, try the full app
    return (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  } catch (error) {
    console.error('Full app failed, using simple app:', error);
    return (
      <BrowserRouter>
        <SimpleApp />
      </BrowserRouter>
    );
  }
}

// Render with multiple fallback levels
try {
  root.render(<AppWithErrorBoundary />);
} catch (error) {
  console.error('Failed to render AppWithErrorBoundary, using direct fallback:', error);
  try {
    root.render(<FallbackApp />);
  } catch (fallbackError) {
    console.error('Even fallback failed:', fallbackError);
    // Last resort: render minimal HTML
    root.render(
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        minHeight: '100vh'
      }}>
        <h1>Sistema Temporariamente Indisponível</h1>
        <p>Ocorreu um erro crítico. Recarregue a página.</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '0.5rem 1rem', 
            marginTop: '1rem',
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
    );
  }
}