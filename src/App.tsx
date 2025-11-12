import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SidebarUIProvider } from "@/context/SidebarUIContext";
import { MobileProvider } from "@/contexts/MobileContext";
import { InactivityTracker } from "@/components/auth/InactivityTracker";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import FullLayout from "@/layouts/full/FullLayout";
import { config, validateConfig } from '@/config/environment';
import { MaintenanceMode } from '@/components/MaintenanceMode';
import { useIsMobile } from "@/hooks/use-mobile";

// Import pages
import NotFound from "./pages/NotFound";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import VendasOnline from "./pages/VendasOnline";
import DevolucoesMercadoLivre from "./pages/DevolucoesMercadoLivre";
// DadosEnriquecidosQualidade removido temporariamente
import Scanner from "./pages/Scanner";

import Reclamacoes from "./pages/Reclamacoes";
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

function MobileRedirect() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (isMobile && user && (location.pathname === '/' || location.pathname === '/dashboardinicial/visao-geral')) {
      navigate('/estoque', { replace: true });
    }
  }, [isMobile, user, location.pathname, navigate]);

  return null;
}

function App() {
  useEffect(() => {
    const validation = validateConfig();
    if (!validation.valid) {
      console.error('❌ Configuration errors:', validation.errors);
    }
  }, []);

  // Verificar modo de manutenção
  if (config.features.maintenanceMode) {
    return <MaintenanceMode />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="materialm-dark" storageKey="reistoq.theme">
        <TooltipProvider>
          <AuthProvider>
          <MobileProvider>
            <SidebarUIProvider>
              <MobileRedirect />
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
                         <Pedidos />
                       </PermissionRoute>
                     } />
                     <Route path="/vendas-online" element={
                       <PermissionRoute requiredPermissions={['orders:read']}>
                         <VendasOnline />
                       </PermissionRoute>
                     } />
                      <Route path="/devolucoes-ml" element={
                        <PermissionRoute requiredPermissions={['orders:read']}>
                          <DevolucoesMercadoLivre />
                        </PermissionRoute>
                      } />
                      {/* Rota qualidade-dados removida temporariamente */}
                    <Route path="/reclamacoes" element={
                      <PermissionRoute requiredPermissions={['integrations:manage']}>
                        <Reclamacoes />
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
}

export default App;