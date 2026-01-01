import React, { createContext, useContext, useState, ReactNode } from "react";
import { LayoutMode } from "@/components/estoque/EstoqueLocationTabs";

interface EstoqueLayoutContextType {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
}

const EstoqueLayoutContext = createContext<EstoqueLayoutContextType | null>(null);

export function EstoqueLayoutProvider({ children }: { children: ReactNode }) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("list");
  
  return (
    <EstoqueLayoutContext.Provider value={{ layoutMode, setLayoutMode }}>
      {children}
    </EstoqueLayoutContext.Provider>
  );
}

export function useEstoqueLayout() {
  const context = useContext(EstoqueLayoutContext);
  if (!context) {
    throw new Error("useEstoqueLayout must be used within EstoqueLayoutProvider");
  }
  return context;
}
