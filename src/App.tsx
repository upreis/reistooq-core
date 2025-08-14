import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
// Core pages (real business routes)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Analytics from "./pages/Analytics";
import ECommerce from "./pages/ECommerce";
import Estoque from "./pages/Estoque";
import Pedidos from "./pages/Pedidos";
import Scanner from "./pages/Scanner";
import DePara from "./pages/DePara";
import Alertas from "./pages/Alertas";
import Historico from "./pages/Historico";

// Demo pages (moved to _demo for reference only - not in navigation)
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
import Login from "./pages/Login";
import AccountSettings from "./pages/AccountSettings";
import Cards from "./pages/Cards";
import Banners from "./pages/Banners";
import Charts from "./pages/Charts";
import SolarIcons from "./pages/SolarIcons";

const queryClient = new QueryClient();

const App = () => {
  // Load theme tokens
  import("@/theme/materialm/tokens").then(() => {
    console.log('Theme: MaterialM(main) loaded');
    console.log('Font: Plus Jakarta Sans');
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="materialm-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LayoutWrapper>
              <Routes>
                {/* REAL BUSINESS ROUTES - Only these appear in sidebar */}
                <Route path="/" element={<Index />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/ecommerce" element={<ECommerce />} />
                <Route path="/estoque" element={<Estoque />} />
                <Route path="/pedidos" element={<Pedidos />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/de-para" element={<DePara />} />
                <Route path="/alertas" element={<Alertas />} />
                <Route path="/historico" element={<Historico />} />
                
                {/* DEMO ROUTES - For UI reference only, not in sidebar */}
                <Route path="/_demo/shop" element={<Shop />} />
                <Route path="/_demo/detail/:id" element={<ProductDetail />} />
                <Route path="/_demo/list" element={<ProductList />} />
                <Route path="/_demo/checkout" element={<Checkout />} />
                <Route path="/_demo/addproduct" element={<AddProduct />} />
                <Route path="/_demo/editproduct" element={<EditProduct />} />
                <Route path="/_demo/user-profile" element={<UserProfile />} />
                <Route path="/_demo/calendar" element={<Calendar />} />
                <Route path="/_demo/notes" element={<Notes />} />
                <Route path="/_demo/crm" element={<CRM />} />
                <Route path="/_demo/chats" element={<Chats />} />
                <Route path="/_demo/faq" element={<FAQ />} />
                <Route path="/_demo/pricing" element={<Pricing />} />
                <Route path="/_demo/login" element={<Login />} />
                <Route path="/_demo/account-settings" element={<AccountSettings />} />
                <Route path="/_demo/cards" element={<Cards />} />
                <Route path="/_demo/banners" element={<Banners />} />
                <Route path="/_demo/charts" element={<Charts />} />
                <Route path="/_demo/icons" element={<SolarIcons />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LayoutWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
