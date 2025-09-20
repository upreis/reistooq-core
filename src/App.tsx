import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarUIProvider } from "@/context/SidebarUIContext";
import { MobileProvider } from "@/contexts/MobileContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import FullLayout from "@/layouts/full/FullLayout";
import { config, validateConfig } from '@/config/environment';
import { MaintenanceMode } from '@/components/MaintenanceMode';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { LoadingPage } from '@/components/ui/loading-states';

// Import pages
import NotFound from "./pages/NotFound";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import Scanner from "./pages/Scanner";
import MLOrdersCompletas from "./pages/MLOrdersCompletas";
import DePara from "./pages/DePara";
import Alertas from "./pages/Alertas";
import IntegracoesPage from "./pages/configuracoes/IntegracoesPage";
import Historico from "./pages/Historico";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import ProductList from "./pages/ProductList";
import Checkout from "./pages/Checkout";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import UserProfile from "./pages/UserProfile";
import Calendar from "./pages/Calendar";
import Notes from "./pages/Notes";
import OMS from "./pages/OMS";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import FAQ from "./pages/FAQ";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import AccountSettings from "./pages/AccountSettings";
import Cards from "./pages/Cards";
import Banners from "./pages/Banners";
import Charts from "./pages/Charts";
import SolarIcons from "./pages/SolarIcons";
import AdminPage from "./pages/AdminPage";
import AcceptInvite from "./pages/AcceptInvite";
import ResetPassword from "./pages/ResetPassword";
import CategoryManager from "./pages/CategoryManager";
import ShopeeCallbackPage from "./pages/ShopeeCallbackPage";

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
  const { isRequired: onboardingRequired, loading: onboardingLoading } = useOnboarding();

  // Validar configuração na inicialização
  React.useEffect(() => {
    const validation = validateConfig();
    if (!validation.valid) {
      console.error('❌ Configuration errors:', validation.errors);
    }
  }, []);

  // Verificar modo de manutenção
  if (config.features.maintenanceMode) {
    return <MaintenanceMode />;
  }

  // Mostrar loading enquanto verifica onboarding
  if (onboardingLoading) {
    return <LoadingPage message="Verificando configuração..." />;
  }

  // Mostrar onboarding se necessário
  if (onboardingRequired) {
    return <OnboardingWizard />;
  }

  // Mostrar loading enquanto verifica onboarding
  if (onboardingLoading) {
    return <LoadingPage message="Verificando configuração..." />;
  }

  // Mostrar onboarding se necessário
  if (onboardingRequired) {
    return <OnboardingWizard />;
  }

  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="materialm-dark" storageKey="reistoq.theme">
          <TooltipProvider>
          <AuthProvider>
            <MobileProvider>
              <SidebarUIProvider>
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
                    <Route path="/" element={
                      <PermissionRoute requiredPermissions={['dashboard:view']}>
                        <Dashboard />
                      </PermissionRoute>
                    } />
                    <Route path="/analytics" element={
                      <PermissionRoute requiredPermissions={['analytics:view']}>
                        <Analytics />
                      </PermissionRoute>
                    } />
                    <Route path="/oms/*" element={
                      <PermissionRoute requiredPermissions={['oms:view']}>
                        <OMS />
                      </PermissionRoute>
                    } />
                    
                    {/* eCommerce App Routes */}
                    <Route path="/apps/ecommerce/shop" element={
                      <PermissionRoute requiredPermissions={['ecommerce:view']}>
                        <Shop />
                      </PermissionRoute>
                    } />
                    <Route path="/apps/ecommerce/detail/:id" element={
                      <PermissionRoute requiredPermissions={['ecommerce:view']}>
                        <ProductDetail />
                      </PermissionRoute>
                    } />
                    <Route path="/apps/ecommerce/list" element={
                      <PermissionRoute requiredPermissions={['ecommerce:view']}>
                        <ProductList />
                      </PermissionRoute>
                    } />
                    <Route path="/apps/ecommerce/checkout" element={
                      <PermissionRoute requiredPermissions={['ecommerce:view']}>
                        <Checkout />
                      </PermissionRoute>
                    } />
                    <Route path="/apps/ecommerce/addproduct" element={
                      <PermissionRoute requiredPermissions={['ecommerce:view']}>
                        <AddProduct />
                      </PermissionRoute>
                    } />
                    <Route path="/apps/ecommerce/editproduct" element={
                      <PermissionRoute requiredPermissions={['ecommerce:view']}>
                        <EditProduct />
                      </PermissionRoute>
                    } />
                    
                    {/* User Profile App Routes */}
                    <Route path="/apps/user-profile/profile" element={
                      <PermissionRoute requiredPermissions={['userprofile:view']}>
                        <UserProfile />
                      </PermissionRoute>
                    } />
                    <Route path="/apps/user-profile/followers" element={
                      <PermissionRoute requiredPermissions={['userprofile:view']}>
                        <UserProfile />
                      </PermissionRoute>
                    } />
                    <Route path="/apps/user-profile/friends" element={
                      <PermissionRoute requiredPermissions={['userprofile:view']}>
                        <UserProfile />
                      </PermissionRoute>
                    } />
                    <Route path="/apps/user-profile/gallery" element={
                      <PermissionRoute requiredPermissions={['userprofile:view']}>
                        <UserProfile />
                      </PermissionRoute>
                    } />
                    
                    {/* Other App Routes */}
                    <Route path="/apps/calendar" element={
                      <PermissionRoute requiredPermissions={['calendar:view']}>
                        <Calendar />
                      </PermissionRoute>
                    } />
                    <Route path="/apps/notes" element={
                      <PermissionRoute requiredPermissions={['notes:view']}>
                        <Notes />
                      </PermissionRoute>
                    } />
                    
                    {/* Custom Business Routes */}
                    <Route path="/estoque" element={
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
                    <Route path="/ml-orders-completas" element={
                      <PermissionRoute requiredPermissions={['integrations:manage']}>
                        <MLOrdersCompletas />
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
                    <Route path="/configuracoes/integracoes" element={
                      <PermissionRoute requiredPermissions={['settings:view']}>
                        <IntegracoesPage />
                      </PermissionRoute>
                    } />
                    <Route path="/historico" element={
                      <PermissionRoute requiredPermissions={['historico:view']}>
                        <Historico />
                      </PermissionRoute>
                    } />
                    <Route path="/admin" element={
                      <PermissionRoute requiredAny={['users:read', 'roles:manage', 'invites:manage', 'system:audit']}>
                        <AdminPage />
                      </PermissionRoute>
                    } />
                    <Route path="/system-admin" element={
                      <PermissionRoute requiredAny={['admin:access', 'system:admin']}>
                        <SystemAdmin />
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