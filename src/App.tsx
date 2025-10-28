import React from 'react';
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
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import FullLayout from "@/layouts/full/FullLayout";
import { config, validateConfig } from '@/config/environment';
import { MaintenanceMode } from '@/components/MaintenanceMode';

// Verificação crítica de React - antes de importar outros módulos
console.log('🔧 React check:', { React: typeof React, ReactUseEffect: typeof React?.useEffect });

if (!React || typeof React.useEffect !== 'function') {
  console.error('🚨 CRITICAL: React or React.useEffect not available!', { 
    React: typeof React, 
    ReactUseEffect: typeof React?.useEffect
  });
  // Não lançar erro aqui para permitir que o componente seja renderizado com fallback
}

// Import pages
import NotFound from "./pages/NotFound";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import Scanner from "./pages/Scanner";
import MLOrdersCompletas from "./pages/MLOrdersCompletas";
import Reclamacoes from "./pages/Reclamacoes";
import DevolucoesAnalise from "./pages/DevolucoesAnalise";
import DePara from "./pages/DePara";
import Alertas from "./pages/Alertas";
import IntegracoesPage from "./pages/configuracoes/IntegracoesPage";
import Historico from "./pages/Historico";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import ProductList from "./pages/ProductList";

import AddProduct from "./pages/AddProduct";
import ProductImport from "./pages/ProductImport";
import EditProduct from "./pages/EditProduct";
import Ecommerce from "./pages/Ecommerce";

import Calendar from "./pages/Calendar";
import Notes from "./pages/Notes";
import OMS from "./pages/OMS";
import DashboardInicialPage from "./pages/DashboardInicialPage";

import FAQ from "./pages/FAQ";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import AccountSettings from "./pages/AccountSettings";
import Cards from "./pages/Cards";
import Banners from "./pages/Banners";
import Charts from "./pages/Charts";
import SolarIcons from "./pages/SolarIcons";
import AdminPage from "./pages/AdminPage";
import AplicativosPage from "./pages/AplicativosPage";
import AcceptInvite from "./pages/AcceptInvite";
import ResetPassword from "./pages/ResetPassword";
import CategoryManager from "./pages/CategoryManager";
import ShopeeCallbackPage from "./pages/ShopeeCallbackPage";
import Compras from "./pages/Compras";

// Create QueryClient instance outside component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  console.log('🔧 App component rendering...');
  
  // Verificação crítica de React no início da função
  if (!React || typeof React.useEffect !== 'function') {
    console.error('🚨 React não está disponível no App component!');
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
          <h1>🚨 Erro Crítico do React</h1>
          <p>React ou React.useEffect não está disponível</p>
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
  
  console.log('🔧 React hooks available:', { useEffect: typeof React.useEffect });
  
  // Usar React.useEffect ao invés de useEffect destructurado
  try {
    React.useEffect(() => {
      console.log('🔧 App useEffect running...');
      // Simplificado para evitar problemas de inicialização
      if (typeof validateConfig === 'function') {
        try {
          const validation = validateConfig();
          if (!validation.valid) {
            console.error('❌ Configuration errors:', validation.errors);
          }
          console.log('✅ Configuration validation complete');
        } catch (error) {
          console.error('🚨 Error in configuration validation:', error);
        }
      }
    }, []);
  } catch (hookError) {
    console.error('🚨 Error setting up React.useEffect:', hookError);
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
          <h1>🚨 Erro no React.useEffect</h1>
          <p>{hookError?.toString()}</p>
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

  // Verificar modo de manutenção
  if (config.features.maintenanceMode) {
    return <MaintenanceMode />;
  }

  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="materialm-dark" storageKey="reistoq.theme">
          <TooltipProvider>
            <AuthProvider>
            <MobileProvider>
              <SidebarUIProvider>
                <InactivityTracker />
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Rota pública de autenticação */}
                  <Route path="/auth" element={<Auth />} />
                  {/* Rota pública para redefinição de senha */}
                  <Route path="/auth/reset-password" element={<ResetPassword />} />
                  {/* Rota pública para aceitar convites */}
                  <Route path="/convite/:token" element={<AcceptInvite />} />
                  {/* Rota pública para callback da Shopee */}
                  <Route path="/shopee-callback" element={<ShopeeCallbackPage />} />
                  
                  {/* Todas as outras rotas são protegidas com novo layout */}
                  <Route element={<ProtectedRoute><FullLayout /></ProtectedRoute>}>
                    <Route path="/dashboardinicial/*" element={
                      <PermissionRoute requiredPermissions={['dashboard:view']}>
                        <DashboardInicialPage />
                      </PermissionRoute>
                    } />
                    <Route path="/" element={<Navigate to="/dashboardinicial/visao-geral" replace />} />
                    <Route path="/oms/*" element={
                      <PermissionRoute requiredPermissions={['oms:view']}>
                        <OMS />
                      </PermissionRoute>
                     } />
                     <Route path="/compras/*" element={
                       <PermissionRoute requiredPermissions={['compras:view']}>
                         <Compras />
                       </PermissionRoute>
                     } />
                     
                     {/* eCommerce App Routes */}
                     <Route path="/apps/ecommerce/*" element={
                       <PermissionRoute requiredPermissions={['ecommerce:view']}>
                         <Ecommerce />
                       </PermissionRoute>
                     } />
                    
                    {/* Aplicativos Routes */}
                    <Route path="/aplicativos/*" element={
                      <PermissionRoute requiredPermissions={['dashboard:view']}>
                        <AplicativosPage />
                      </PermissionRoute>
                    } />
                    
                    {/* Legacy App Routes - redirect to new structure */}
                    <Route path="/apps/calendar" element={<Navigate to="/aplicativos/calendario" replace />} />
                    <Route path="/apps/notes" element={<Navigate to="/aplicativos/notas" replace />} />
                    
                     {/* Custom Business Routes */}
                     <Route path="/estoque/*" element={
                       <PermissionRoute requiredPermissions={['estoque:view']}>
                         <Estoque />
                       </PermissionRoute>
                     } />
                    <Route path="/category-manager" element={
                      <PermissionRoute requiredPermissions={['estoque:view']}>
                        <CategoryManager />
                      </PermissionRoute>
                    } />
                     <Route path="/pedidos" element={
                       <PermissionRoute requiredPermissions={['orders:read']}>
                         <OMS />
                       </PermissionRoute>
                     } />
                    <Route path="/ml-orders-completas" element={
                      <PermissionRoute requiredPermissions={['integrations:manage']}>
                        <MLOrdersCompletas />
                      </PermissionRoute>
                    } />
                    <Route path="/reclamacoes" element={
                      <PermissionRoute requiredPermissions={['integrations:manage']}>
                        <Reclamacoes />
                      </PermissionRoute>
                    } />
                    <Route path="/devolucoes-analise" element={
                      <PermissionRoute requiredPermissions={['integrations:manage']}>
                        <DevolucoesAnalise />
                      </PermissionRoute>
                    } />
                    <Route path="/scanner" element={
                      <PermissionRoute requiredPermissions={['scanner:use']}>
                        <Scanner />
                      </PermissionRoute>
                    } />
                    <Route path="/de-para" element={
                      <PermissionRoute requiredPermissions={['depara:view']}>
                        <DePara />
                      </PermissionRoute>
                    } />
                    <Route path="/alertas" element={
                      <PermissionRoute requiredPermissions={['alerts:view']}>
                        <Alertas />
                      </PermissionRoute>
                    } />
                    <Route path="/configuracoes" element={
                      <PermissionRoute requiredPermissions={['settings:view']}>
                        <IntegracoesPage />
                      </PermissionRoute>
                    } />
                    <Route path="/configuracoes/*" element={
                      <PermissionRoute requiredPermissions={['settings:view']}>
                        <IntegracoesPage />
                      </PermissionRoute>
                    } />
                    <Route path="/historico" element={
                      <PermissionRoute requiredPermissions={['historico:view']}>
                        <Historico />
                      </PermissionRoute>
                    } />
                    <Route path="/admin/*" element={
                      <PermissionRoute requiredAny={['users:read', 'roles:manage', 'invites:manage', 'system:audit']}>
                        <AdminPage />
                      </PermissionRoute>
                    } />

                    {/* Demo Routes (protected) */}
                    <Route path="/_demo/faq" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <FAQ />
                      </PermissionRoute>
                    } />
                    <Route path="/_demo/pricing" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <Pricing />
                      </PermissionRoute>
                    } />
                    <Route path="/_demo/account-settings" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <AccountSettings />
                      </PermissionRoute>
                    } />
                    <Route path="/_demo/cards" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <Cards />
                      </PermissionRoute>
                    } />
                    <Route path="/_demo/banners" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <Banners />
                      </PermissionRoute>
                    } />
                    <Route path="/_demo/charts" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <Charts />
                      </PermissionRoute>
                    } />
                    <Route path="/_demo/icons" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <SolarIcons />
                      </PermissionRoute>
                    } />

                    {/* Legacy redirects (protected) */}
                    <Route path="/dashboards/crm" element={
                      <PermissionRoute requiredPermissions={['oms:view']}>
                        <OMS />
                      </PermissionRoute>
                    } />
                    <Route path="/crm" element={
                      <PermissionRoute requiredPermissions={['oms:view']}>
                        <OMS />
                      </PermissionRoute>
                    } />
                    <Route path="/theme-pages/faq" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <FAQ />
                      </PermissionRoute>
                    } />
                    <Route path="/theme-pages/pricing" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <Pricing />
                      </PermissionRoute>
                    } />
                    <Route path="/theme-pages/account-settings" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <AccountSettings />
                      </PermissionRoute>
                    } />
                    <Route path="/widgets/cards" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <Cards />
                      </PermissionRoute>
                    } />
                    <Route path="/widgets/banners" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <Banners />
                      </PermissionRoute>
                    } />
                    <Route path="/widgets/charts" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <Charts />
                      </PermissionRoute>
                    } />
                    <Route path="/icons/solar" element={
                      <PermissionRoute requiredPermissions={['demo:access']}>
                        <SolarIcons />
                      </PermissionRoute>
                    } />
                  </Route>
                  
                  {/* Catch all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SidebarUIProvider>
            </MobileProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
  } catch (error) {
    console.error('App rendering error:', error);
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#1a1a1a', 
        color: '#ffffff',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <h1>⚠️ Erro no Sistema</h1>
        <p>Ocorreu um erro ao carregar o sistema principal.</p>
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
          Recarregar Sistema
        </button>
      </div>
    );
  }
}

export default App;