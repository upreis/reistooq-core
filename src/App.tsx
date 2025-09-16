import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";

// Simple minimal setup to fix React context issues
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">REISTOQ</h1>
                <p className="text-muted-foreground">Sistema em manutenção...</p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </QueryClientProvider>
  );
}

export default App;
