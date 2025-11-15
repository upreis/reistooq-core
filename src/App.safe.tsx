import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarUIProvider } from "@/context/SidebarUIContext";
import { MobileProvider } from "@/contexts/MobileContext";
import { InactivityTracker } from "@/components/auth/InactivityTracker";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import FullLayout from "@/layouts/full/FullLayout";
import { config, validateConfig } from '@/config/environment';
import { MaintenanceMode } from '@/components/MaintenanceMode';
// Desabilitado temporariamente devido a erros de compatibilidade
// import { SessionRecordingProvider } from "@/components/ai-chat/SessionRecordingProvider";

// Import pages básicas
import NotFound from "./pages/NotFound";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import Scanner from "./pages/Scanner";

import DePara from "./pages/DePara";
import Alertas from "./pages/Alertas";
import ComprasPage from "./pages/Compras";
import CotacoesPage from "./pages/compras/CotacoesPage";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

console.log('🎯 App.safe.tsx: Loading...');
console.log('🔍 App.safe.tsx: React available?', typeof React);
console.log('🔍 App.safe.tsx: useEffect available?', typeof useEffect);

function SafeApp() {
  // Verificação de segurança antes de usar useEffect
  if (typeof useEffect !== 'function') {
    console.error('🚨 useEffect não está disponível!');
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>🚨 Erro crítico</h1>
          <p>React hooks não estão disponíveis</p>
          <button onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      </div>
    );
  }

  // Configuração de validação de forma segura
  useEffect(() => {
    console.log('🔧 SafeApp useEffect running...');
    try {
      if (typeof validateConfig === 'function') {
        const validation = validateConfig();
        console.log('✅ Configuration validation:', validation);
      }
    } catch (error) {
      console.error('🚨 Error in configuration:', error);
    }
  }, []);

  // Verificar modo de manutenção
  if (config.features.maintenanceMode) {
    return <MaintenanceMode />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider storageKey="vite-ui-theme">
          <TooltipProvider>
            <SidebarUIProvider>
              <MobileProvider>
                <Routes>
                  {/* Rotas protegidas com layout */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <FullLayout />
                      <InactivityTracker />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="estoque" element={<Estoque />} />
                    <Route path="pedidos" element={<Pedidos />} />
                    <Route path="scanner" element={<Scanner />} />
                    <Route path="de-para" element={<DePara />} />
                    <Route path="alertas" element={<Alertas />} />
                    
                    {/* Rotas de compras */}
                    <Route path="compras/*" element={<ComprasPage />} />
                    <Route path="compras/cotacoes" element={<CotacoesPage />} />
                    
                  </Route>
                  
                  {/* Rota 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                
                {/* Toast providers */}
                <Toaster />
                <Sonner 
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                    },
                  }}
                />
              </MobileProvider>
            </SidebarUIProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default SafeApp;