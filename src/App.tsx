import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="materialm-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ecommerce" element={<ECommerce />} />
            <Route path="/apps/ecommerce/shop" element={<Shop />} />
            <Route path="/apps/ecommerce/detail/:id" element={<ProductDetail />} />
            <Route path="/apps/ecommerce/list" element={<ProductList />} />
            <Route path="/apps/ecommerce/checkout" element={<Checkout />} />
            <Route path="/apps/ecommerce/addproduct" element={<AddProduct />} />
            <Route path="/apps/ecommerce/editproduct" element={<EditProduct />} />
            <Route path="/apps/user-profile/profile" element={<UserProfile />} />
            <Route path="/apps/user-profile/followers" element={<UserProfile />} />
            <Route path="/apps/user-profile/friends" element={<UserProfile />} />
            <Route path="/apps/user-profile/gallery" element={<UserProfile />} />
            <Route path="/apps/calendar" element={<Calendar />} />
            <Route path="/apps/notes" element={<Notes />} />
            <Route path="/apps/chats" element={<Chats />} />
            <Route path="/dashboards/crm" element={<CRM />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/de-para" element={<DePara />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/historico" element={<Historico />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
