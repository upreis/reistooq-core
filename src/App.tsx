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
import CRM from "./pages/CRM";
import Chats from "./pages/Chats";
import FAQ from "./pages/FAQ";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import AccountSettings from "./pages/AccountSettings";
import Cards from "./pages/Cards";
import Banners from "./pages/Banners";
import Charts from "./pages/Charts";
import SolarIcons from "./pages/SolarIcons";
import MobileExperience from "./pages/MobileExperience";
import TesteAPI from "./pages/TesteAPI";

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
                  
                  {/* Todas as outras rotas são protegidas com novo layout */}
                  <Route element={<ProtectedRoute><FullLayout /></ProtectedRoute>}>
                   <Route path="/" element={<CRM />} />
                    <Route path="/analytics" element={<CRM />} />
                    <Route path="/crm" element={<CRM />} />
                    
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
                    <Route path="/apps/chats" element={<Chats />} />
                    
                    {/* Custom Business Routes */}
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/pedidos" element={<Pedidos />} />
                    <Route path="/scanner" element={<Scanner />} />
                    <Route path="/de-para" element={<DePara />} />
                    <Route path="/alertas" element={<Alertas />} />
                    <Route path="/configuracoes" element={<IntegracoesPage />} />
                    <Route path="/configuracoes/integracoes" element={<IntegracoesPage />} />
                    <Route path="/mobile-experience" element={<MobileExperience />} />
                    <Route path="/historico" element={<Historico />} />
                    <Route path="/teste-api" element={<TesteAPI />} />

                    {/* Demo Routes (protected) */}
                    <Route path="/_demo/faq" element={<FAQ />} />
                    <Route path="/_demo/pricing" element={<Pricing />} />
                    <Route path="/_demo/account-settings" element={<AccountSettings />} />
                    <Route path="/_demo/cards" element={<Cards />} />
                    <Route path="/_demo/banners" element={<Banners />} />
                    <Route path="/_demo/charts" element={<Charts />} />
                    <Route path="/_demo/icons" element={<SolarIcons />} />

                    {/* Legacy redirects (protected) */}
                    <Route path="/dashboards/crm" element={<CRM />} />
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
