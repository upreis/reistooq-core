// FALLBACK SIMPLES - Caso o ThemeProvider normal falhe
import { type ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
};

export function ThemeProviderSimple({ children }: ThemeProviderProps) {
  // Versão ultra-simples sem hooks - apenas aplica tema padrão
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'materialm-dark');
    root.classList.add('materialm-dark');
  }
  
  return <>{children}</>;
}
