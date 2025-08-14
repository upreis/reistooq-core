import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Analytics from "./pages/Analytics";
import ECommerce from "./pages/ECommerce";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import Scanner from "./pages/Scanner";
import DePara from "./pages/DePara";
import Alertas from "./pages/Alertas";
import Configuracoes from "./pages/Configuracoes";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="materialm-dark" storageKey="reistoq.theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota pública de autenticação */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Todas as outras rotas são protegidas */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/ecommerce" element={<ProtectedRoute><ECommerce /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
            
            {/* eCommerce App Routes */}
            <Route path="/apps/ecommerce/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
            <Route path="/apps/ecommerce/detail/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/apps/ecommerce/list" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
            <Route path="/apps/ecommerce/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/apps/ecommerce/addproduct" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
            <Route path="/apps/ecommerce/editproduct" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
            
            {/* User Profile App Routes */}
            <Route path="/apps/user-profile/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/apps/user-profile/followers" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/apps/user-profile/friends" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/apps/user-profile/gallery" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            
            {/* Other App Routes */}
            <Route path="/apps/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/apps/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/apps/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
            
            {/* Custom Business Routes */}
            <Route path="/estoque" element={<ProtectedRoute><Estoque /></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
            <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
            <Route path="/de-para" element={<ProtectedRoute><DePara /></ProtectedRoute>} />
            <Route path="/alertas" element={<ProtectedRoute><Alertas /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />

            {/* Demo Routes (protected) */}
            <Route path="/_demo/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
            <Route path="/_demo/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/_demo/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
            <Route path="/_demo/cards" element={<ProtectedRoute><Cards /></ProtectedRoute>} />
            <Route path="/_demo/banners" element={<ProtectedRoute><Banners /></ProtectedRoute>} />
            <Route path="/_demo/charts" element={<ProtectedRoute><Charts /></ProtectedRoute>} />
            <Route path="/_demo/icons" element={<ProtectedRoute><SolarIcons /></ProtectedRoute>} />

            {/* Legacy redirects (protected) */}
            <Route path="/dashboards/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
            <Route path="/theme-pages/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
            <Route path="/theme-pages/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/theme-pages/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
            <Route path="/widgets/cards" element={<ProtectedRoute><Cards /></ProtectedRoute>} />
            <Route path="/widgets/banners" element={<ProtectedRoute><Banners /></ProtectedRoute>} />
            <Route path="/widgets/charts" element={<ProtectedRoute><Charts /></ProtectedRoute>} />
            <Route path="/icons/solar" element={<ProtectedRoute><SolarIcons /></ProtectedRoute>} />
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
