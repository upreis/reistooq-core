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

const container = document.getElementById("root");
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);

// Create error boundary wrapper with progressive loading
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>Carregando...</div>}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.Suspense>
    </ErrorBoundary>
  );
}

root.render(<AppWithErrorBoundary />);