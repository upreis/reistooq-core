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
import { useSystemValidator } from "@/utils/SystemValidator";
import FullLayout from "@/layouts/full/FullLayout";

// Import pages
import NotFound from "./pages/NotFound";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import Scanner from "./pages/Scanner";
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

const queryClient = new QueryClient();

function App() {
  // 🛡️ Sistema de validação automática
  const validator = useSystemValidator();
  
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
                  {/* Rota pública para aceitar convites */}
                  <Route path="/convite/:token" element={<AcceptInvite />} />
                  
                  {/* Todas as outras rotas são protegidas com novo layout */}
                  <Route element={<ProtectedRoute><FullLayout /></ProtectedRoute>}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/oms/*" element={<OMS />} />
                    
                    {/* eCommerce App Routes */}
                    <Route path="/apps/ecommerce/shop" element={<Shop />} />
                    <Route path="/apps/ecommerce/detail/:id" element={<ProductDetail />} />
                    <Route path="/apps/ecommerce/list" element={<ProductList />} />
                    <Route path="/apps/ecommerce/checkout" element={<Checkout />} />
                    <Route path="/apps/ecommerce/addproduct" element={<AddProduct />} />
                    <Route path="/apps/ecommerce/editproduct" element={<EditProduct />} />
                    
                    {/* User Profile App Routes */}
                    <Route path="/apps/user-profile/profile" element={<UserProfile />} />
                    <Route path="/apps/user-profile/followers" element={<UserProfile />} />
                    <Route path="/apps/user-profile/friends" element={<UserProfile />} />
                    <Route path="/apps/user-profile/gallery" element={<UserProfile />} />
                    
                    {/* Other App Routes */}
                    <Route path="/apps/calendar" element={<Calendar />} />
                    <Route path="/apps/notes" element={<Notes />} />
                    
                    
                    {/* Custom Business Routes */}
                    <Route path="/estoque" element={
                      <PermissionRoute requiredPermissions={['estoque:view']}>
                        <Estoque />
                      </PermissionRoute>
                    } />
                    <Route path="/pedidos" element={
                      <PermissionRoute requiredPermissions={['orders:read']}>
                        <Pedidos />
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
                    <Route path="/alertas" element={<Alertas />} />
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

                    {/* Demo Routes (protected) */}
                    <Route path="/_demo/faq" element={<FAQ />} />
                    <Route path="/_demo/pricing" element={<Pricing />} />
                    <Route path="/_demo/account-settings" element={<AccountSettings />} />
                    <Route path="/_demo/cards" element={<Cards />} />
                    <Route path="/_demo/banners" element={<Banners />} />
                    <Route path="/_demo/charts" element={<Charts />} />
                    <Route path="/_demo/icons" element={<SolarIcons />} />

                    {/* Legacy redirects (protected) */}
                    <Route path="/dashboards/crm" element={<OMS />} />
                    <Route path="/crm" element={<OMS />} />
                    <Route path="/theme-pages/faq" element={<FAQ />} />
                    <Route path="/theme-pages/pricing" element={<Pricing />} />
                    <Route path="/theme-pages/account-settings" element={<AccountSettings />} />
                    <Route path="/widgets/cards" element={<Cards />} />
                    <Route path="/widgets/banners" element={<Banners />} />
                    <Route path="/widgets/charts" element={<Charts />} />
                    <Route path="/icons/solar" element={<SolarIcons />} />
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
