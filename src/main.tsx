import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { SidebarUIProvider } from '@/context/SidebarUIContext'
import { MobileProvider } from '@/contexts/MobileContext'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <MobileProvider>
        <SidebarUIProvider>
          <App />
        </SidebarUIProvider>
      </MobileProvider>
    </AuthProvider>
  </React.StrictMode>
);
