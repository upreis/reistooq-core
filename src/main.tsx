import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { SidebarUIProvider } from '@/context/SidebarUIContext'
import { MobileProvider } from '@/contexts/MobileContext'

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <MobileProvider>
            <SidebarUIProvider>
              <App />
            </SidebarUIProvider>
          </MobileProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
