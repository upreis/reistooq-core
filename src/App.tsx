import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SidebarUIProvider } from "@/context/SidebarUIContext";
import { AIChatProvider } from "@/contexts/AIChatContext";
import { MobileProvider } from "@/contexts/MobileContext";
import { InactivityTracker } from "@/components/auth/InactivityTracker";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import FullLayout from "@/layouts/full/FullLayout";
import { AIChatBubble } from "@/components/ai-chat/AIChatBubble";
// 🔇 SessionRecordingProvider desabilitado temporariamente - erro rrweb node.matches
// import { SessionRecordingProvider } from "@/components/ai-chat/SessionRecordingProvider";
import { config, validateConfig } from '@/config/environment';
import { MaintenanceMode } from '@/components/MaintenanceMode';
import { useIsMobile } from "@/hooks/use-mobile";

// Import pages
import NotFound from "./pages/NotFound";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import PedidosV2 from "./pages/PedidosV2";
import VendasComEnvio from "./pages/VendasComEnvio";
import DevolucoesDeVenda from "./pages/DevolucoesDeVenda";
// DadosEnriquecidosQualidade removido temporariamente
import Scanner from "./pages/Scanner";

import Reclamacoes from "./pages/Reclamacoes";
import DePara from "./pages/DePara";

import IntegracoesPage from "./pages/configuracoes/IntegracoesPage";
import Historico from "./pages/Historico";
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
import AIInsights from "./pages/AIInsights";
import DebugVendasHoje from "./pages/DebugVendasHoje";

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
                <AIChatProvider>
                  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <MobileRedirect />
                    <InactivityTracker />
                    <AIChatBubble />
                    <Toaster />
                    <Sonner />
                  <Routes>
                  {/* Rota pública de autenticação */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Rotas públicas sem autenticação */}
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/pricing" element={<Pricing />} />
                  
                  {/* Callback de integração Shopee */}
                  <Route path="/shopee/callback" element={<ShopeeCallbackPage />} />

                  {/* Rotas protegidas com layout */}
                  {/* 🔇 SessionRecordingProvider desabilitado temporariamente - erro rrweb node.matches */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <FullLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="/dashboardinicial/visao-geral" replace />} />
                    
                    {/* Dashboard - todos autenticados podem ver */}
                    <Route path="dashboardinicial/*" element={
                      <PermissionRoute requiredAny={["dashboard:view"]}>
                        <DashboardInicialPage />
                      </PermissionRoute>
                    } />
                    
                    {/* Estoque */}
                    <Route path="estoque/*" element={
                      <PermissionRoute requiredAny={["estoque:view", "estoque:read"]}>
                        <Estoque />
                      </PermissionRoute>
                    } />
                    
                    {/* Vendas/Pedidos */}
                    <Route path="pedidos" element={
                      <PermissionRoute requiredAny={["vendas:read", "orders:read", "pedidos:view"]}>
                        <Pedidos />
                      </PermissionRoute>
                    } />
                    <Route path="pedidos-v2" element={
                      <PermissionRoute requiredAny={["vendas:read", "orders:read", "pedidos:view"]}>
                        <PedidosV2 />
                      </PermissionRoute>
                    } />
                    <Route path="scanner" element={<Navigate to="/aplicativos/scanner" replace />} />
                    
                    {/* Histórico */}
                    <Route path="historico" element={
                      <PermissionRoute requiredAny={["historico:view", "vendas:read"]}>
                        <Historico />
                      </PermissionRoute>
                    } />
                    
                    {/* Vendas com Envio */}
                    <Route path="vendas-com-envio" element={
                      <PermissionRoute requiredAny={["vendas:read", "orders:read"]}>
                        <VendasComEnvio />
                      </PermissionRoute>
                    } />
                    
                    {/* Devoluções */}
                    <Route path="devolucoesdevenda" element={
                      <PermissionRoute requiredAny={["vendas:read", "devolucoes:view"]}>
                        <DevolucoesDeVenda />
                      </PermissionRoute>
                    } />
                    
                    {/* Reclamações */}
                    <Route path="reclamacoes" element={
                      <PermissionRoute requiredAny={["vendas:read", "reclamacoes:view"]}>
                        <Reclamacoes />
                      </PermissionRoute>
                    } />
                    
                    {/* De-Para redirect */}
                    <Route path="de-para" element={<Navigate to="/estoque/de-para" replace />} />
                    
                    {/* Compras */}
                    <Route path="compras/*" element={
                      <PermissionRoute requiredAny={["compras:view", "compras:read"]}>
                        <Compras />
                      </PermissionRoute>
                    } />
                    
                    {/* Configurações */}
                    <Route path="configuracoes/*" element={
                      <PermissionRoute requiredAny={["configuracoes:view", "configuracoes:manage"]}>
                        <IntegracoesPage />
                      </PermissionRoute>
                    } />
                    
                    {/* Aplicativos */}
                    <Route path="aplicativos/*" element={
                      <PermissionRoute requiredAny={["aplicativos:view", "calendar:view", "notes:view", "scanner:use"]}>
                        <AplicativosPage />
                      </PermissionRoute>
                    } />
                    
                    {/* Admin */}
                    <Route path="admin/*" element={
                      <PermissionRoute requiredAny={["admin:access", "admin.access"]}>
                        <AdminPage />
                      </PermissionRoute>
                    } />
                    
                    {/* AI Insights */}
                    <Route path="ai-insights" element={
                      <PermissionRoute requiredAny={["admin:access", "ai:insights"]}>
                        <AIInsights />
                      </PermissionRoute>
                    } />
                    
                    {/* Debug - Vendas Hoje (apenas admin) */}
                    <Route path="debug-vendas-hoje" element={
                      <PermissionRoute requiredAny={["admin:access"]}>
                        <DebugVendasHoje />
                      </PermissionRoute>
                    } />
                    {/* Outros */}
                    <Route path="calendar" element={
                      <PermissionRoute requiredAny={["calendar:view"]}>
                        <Calendar />
                      </PermissionRoute>
                    } />
                    <Route path="notes" element={
                      <PermissionRoute requiredAny={["notes:view"]}>
                        <Notes />
                      </PermissionRoute>
                    } />
                    <Route path="oms/*" element={
                      <PermissionRoute requiredAny={["oms:view", "oms:pedidos", "oms:clientes", "oms:configuracoes"]}>
                        <OMS />
                      </PermissionRoute>
                    } />
                    <Route path="cards" element={<Cards />} />
                    <Route path="banners" element={<Banners />} />
                    <Route path="charts" element={<Charts />} />
                    <Route path="solar-icons" element={<SolarIcons />} />
                  </Route>
                  
                  {/* Rota 404 */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                  </BrowserRouter>
                </AIChatProvider>
              </SidebarUIProvider>
            </MobileProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;