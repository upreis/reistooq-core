import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import App from './App'
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

// Render with error handling for React context issues
try {
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
} catch (error) {
  console.error('Failed to render main App, using fallback:', error);
  root.render(<FallbackApp />);
}