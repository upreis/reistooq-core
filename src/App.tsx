import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
import { AIChatBubble } from "@/components/ai-chat/AIChatBubble";
import { SessionRecordingProvider } from "@/components/ai-chat/SessionRecordingProvider";
import { config, validateConfig } from '@/config/environment';
import { MaintenanceMode } from '@/components/MaintenanceMode';
import { useIsMobile } from "@/hooks/use-mobile";

// Import pages
import NotFound from "./pages/NotFound";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import PedidosV2 from "./pages/PedidosV2";
import VendasOnline from "./pages/VendasOnline";
import DevolucoesDeVenda from "./pages/DevolucoesDeVenda";
// DadosEnriquecidosQualidade removido temporariamente
import Scanner from "./pages/Scanner";

import Reclamacoes from "./pages/Reclamacoes";
import DePara from "./pages/DePara";
import Alertas from "./pages/Alertas";
import IntegracoesPage from "./pages/configuracoes/IntegracoesPage";
import Historico from "./pages/Historico";
import Shop from "./pages/Shop";
import ProductList from "./pages/ProductList";

import AddProduct from "./pages/AddProduct";
import ProductImport from "./pages/ProductImport";
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
import AIInsights from "./pages/AIInsights";

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
                <BrowserRouter>
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
                    
                    {/* Dashboard */}
                    <Route path="dashboardinicial/*" element={<DashboardInicialPage />} />
                    
                    {/* Páginas principais */}
                    <Route path="estoque/*" element={<Estoque />} />
                    <Route path="pedidos" element={<Pedidos />} />
                    <Route path="pedidos-v2" element={<PedidosV2 />} />
                    <Route path="scanner" element={<Scanner />} />
                    <Route path="historico" element={<Historico />} />
                    
                    {/* Vendas Canceladas */}
                    <Route path="vendas-canceladas" element={<VendasOnline />} />
                    
                    {/* Devoluções */}
                    <Route path="devolucoesdevenda" element={<DevolucoesDeVenda />} />
                    
                    {/* Reclamações */}
                    <Route path="reclamacoes" element={<Reclamacoes />} />
                    
                    {/* De-Para e Alertas */}
                    <Route path="de-para" element={<DePara />} />
                    <Route path="alertas" element={<Alertas />} />
                    
                    {/* Compras */}
                    <Route path="compras/*" element={<Compras />} />
                    
                    {/* Configurações */}
                    <Route path="configuracoes/*" element={<IntegracoesPage />} />
                    <Route path="aplicativos/*" element={<AplicativosPage />} />
                    
                    {/* Admin */}
                    <Route path="admin/*" element={
                      <PermissionRoute requiredPermissions={["admin.access"]}>
                        <AdminPage />
                      </PermissionRoute>
                    } />
                    
                    {/* AI Insights */}
                    <Route path="ai-insights" element={<AIInsights />} />
                    
                    {/* E-commerce */}
                    <Route path="shop" element={<Shop />} />
                    <Route path="apps/ecommerce/*" element={<Ecommerce />} />
                    <Route path="product-list" element={<ProductList />} />
                    <Route path="add-product" element={<AddProduct />} />
                    <Route path="product-import" element={<ProductImport />} />
                    
                    {/* Outros */}
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="notes" element={<Notes />} />
                    <Route path="oms/*" element={<OMS />} />
                    <Route path="cards" element={<Cards />} />
                    <Route path="banners" element={<Banners />} />
                    <Route path="charts" element={<Charts />} />
                    <Route path="solar-icons" element={<SolarIcons />} />
                  </Route>
                  
                  {/* Rota 404 */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </SidebarUIProvider>
            </MobileProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;