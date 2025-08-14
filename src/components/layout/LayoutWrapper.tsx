import { DashboardLayout } from "./DashboardLayout";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  // Check if MaterialM layout should be used
  const useMaterialM = import.meta.env.VITE_USE_MATERIALM !== 'false';
  
  if (useMaterialM) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }
  
  // Return children without layout (for fallback to old layout)
  return <>{children}</>;
}