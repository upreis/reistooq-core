import { ReactNode } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { MaterialMLayout } from "@/layouts/MaterialMLayout";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  // Check for MaterialM flag - default to true for now to showcase the new layout
  const useMaterialM = import.meta.env.VITE_USE_MATERIALM !== 'false';
  
  if (useMaterialM) {
    return <MaterialMLayout>{children}</MaterialMLayout>;
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
}