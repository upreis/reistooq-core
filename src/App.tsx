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
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
      refetchOnWindowFocus: false,
      refetchOnMount: true
    },
    mutations: {
      retry: 1
    }
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="materialm-dark" storageKey="reistoq.theme">
          <TooltipProvider delayDuration={0}>
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
                      <Route path="/shop" element={
                        <PermissionRoute requiredPermissions={['shop:view']}>
                          <Shop />
                        </PermissionRoute>
                      } />
                      <Route path="/product/:id" element={
                        <PermissionRoute requiredPermissions={['shop:view']}>
                          <ProductDetail />
                        </PermissionRoute>
                      } />
                      <Route path="/products" element={
                        <PermissionRoute requiredPermissions={['shop:view']}>
                          <ProductList />
                        </PermissionRoute>
                      } />
                      <Route path="/checkout" element={
                        <PermissionRoute requiredPermissions={['shop:view']}>
                          <Checkout />
                        </PermissionRoute>
                      } />
                      <Route path="/add-product" element={
                        <PermissionRoute requiredPermissions={['products:create']}>
                          <AddProduct />
                        </PermissionRoute>
                      } />
                      <Route path="/edit-product/:id" element={
                        <PermissionRoute requiredPermissions={['products:edit']}>
                          <EditProduct />
                        </PermissionRoute>
                      } />
                      
                      <Route path="/profile" element={
                        <PermissionRoute requiredPermissions={['profile:view']}>
                          <UserProfile />
                        </PermissionRoute>
                      } />
                      <Route path="/calendar" element={
                        <PermissionRoute requiredPermissions={['calendar:view']}>
                          <Calendar />
                        </PermissionRoute>
                      } />
                      <Route path="/notes" element={
                        <PermissionRoute requiredPermissions={['notes:view']}>
                          <Notes />
                        </PermissionRoute>
                      } />
                      
                      {/* Módulos de negócio personalizados */}
                      <Route path="/estoque" element={
                        <PermissionRoute requiredPermissions={['inventory:view']}>
                          <Estoque />
                        </PermissionRoute>
                      } />
                      <Route path="/pedidos" element={
                        <PermissionRoute requiredPermissions={['orders:view']}>
                          <Pedidos />
                        </PermissionRoute>
                      } />
                      <Route path="/scanner" element={
                        <PermissionRoute requiredPermissions={['scanner:view']}>
                          <Scanner />
                        </PermissionRoute>
                      } />
                      <Route path="/ml-orders" element={
                        <PermissionRoute requiredPermissions={['ml_orders:view']}>
                          <MLOrdersCompletas />
                        </PermissionRoute>
                      } />
                      <Route path="/de-para" element={
                        <PermissionRoute requiredPermissions={['mapping:view']}>
                          <DePara />
                        </PermissionRoute>
                      } />
                      <Route path="/alertas" element={
                        <PermissionRoute requiredPermissions={['alerts:view']}>
                          <Alertas />
                        </PermissionRoute>
                      } />
                      <Route path="/configuracoes/integracoes" element={
                        <PermissionRoute requiredPermissions={['integrations:view']}>
                          <IntegracoesPage />
                        </PermissionRoute>
                      } />
                      <Route path="/historico" element={
                        <PermissionRoute requiredPermissions={['history:view']}>
                          <Historico />
                        </PermissionRoute>
                      } />
                      <Route path="/account-settings" element={
                        <PermissionRoute requiredPermissions={['account:edit']}>
                          <AccountSettings />
                        </PermissionRoute>
                      } />
                      <Route path="/categories" element={
                        <PermissionRoute requiredPermissions={['categories:view']}>
                          <CategoryManager />
                        </PermissionRoute>
                      } />
                      
                      {/* Demo routes */}
                      <Route path="/demo/faq" element={
                        <PermissionRoute requiredPermissions={['demo:view']}>
                          <FAQ />
                        </PermissionRoute>
                      } />
                      <Route path="/demo/pricing" element={
                        <PermissionRoute requiredPermissions={['demo:view']}>
                          <Pricing />
                        </PermissionRoute>
                      } />
                      <Route path="/demo/cards" element={
                        <PermissionRoute requiredPermissions={['demo:view']}>
                          <Cards />
                        </PermissionRoute>
                      } />
                      <Route path="/demo/banners" element={
                        <PermissionRoute requiredPermissions={['demo:view']}>
                          <Banners />
                        </PermissionRoute>
                      } />
                      <Route path="/demo/charts" element={
                        <PermissionRoute requiredPermissions={['demo:view']}>
                          <Charts />
                        </PermissionRoute>
                      } />
                      <Route path="/demo/solar-icons" element={
                        <PermissionRoute requiredPermissions={['demo:view']}>
                          <SolarIcons />
                        </PermissionRoute>
                      } />
                      <Route path="/admin" element={
                        <PermissionRoute requiredPermissions={['admin:view']}>
                          <AdminPage />
                        </PermissionRoute>
                      } />
                      
                      {/* Redirects legados */}
                      <Route path="/dashboard" element={
                        <PermissionRoute requiredPermissions={['dashboard:view']}>
                          <Dashboard />
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
    </ErrorBoundary>
  );
}

export default App;