import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#1a1a1a', 
        color: '#ffffff',
        padding: '2rem',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <h1>Sistema Carregando...</h1>
        <p>Verificando compatibilidade React...</p>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="*" element={
            <div>
              <h2>Sistema Funcionando ✅</h2>
              <p>React hooks funcionando corretamente</p>
            </div>
          } />
        </Routes>
      </div>
    </QueryClientProvider>
  );
}

export default SimpleApp;