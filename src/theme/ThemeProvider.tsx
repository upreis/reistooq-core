// ✅ SAFETY CHECK: Importar React primeiro para garantir que está carregado
import React from "react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { THEMES, type ThemeName } from "./materialm/tokens";

// ✅ CRITICAL FIX: Verificar se React hooks estão disponíveis
if (!React || typeof useState !== 'function') {
  console.error('❌ CRITICAL: React or React hooks not loaded properly!');
  throw new Error('React initialization error - hooks not available');
}

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const THEME_OPTIONS: ThemeName[] = ['materialm-dark', 'materialm-light'];
const DEFAULT_THEME: ThemeName = 'materialm-dark';

const initialState: ThemeProviderState = {
  theme: DEFAULT_THEME,
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = "reistoq.theme",
  ...props
}: ThemeProviderProps) {
  // ✅ SAFETY CHECK: Fallback se useState não estiver disponível
  let theme: ThemeName;
  let setTheme: (theme: ThemeName) => void;
  
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return defaultTheme;
    }
    
      try {
        const stored = window.localStorage?.getItem?.(storageKey) as ThemeName;
        return (stored && THEME_OPTIONS.includes(stored)) ? stored : defaultTheme;
      } catch (error) {
        console.warn('Theme localStorage error:', error);
        return defaultTheme;
      }
    });
  } catch (error) {
    console.error('❌ CRITICAL: useState failed in ThemeProvider!', error);
    // Fallback to default values
    theme = defaultTheme;
    setTheme = () => {
      console.warn('setTheme called but useState is not available');
    };
  }

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    if (!root) return;
    
    // Remove all theme classes
    THEME_OPTIONS.forEach(t => root.classList.remove(t));
    
    // Apply theme data attribute and class
    root.setAttribute('data-theme', theme);
    root.classList.add(theme);
    
    // Add/remove 'dark' class for Tailwind dark: variants
    if (theme === 'materialm-dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply CSS variables from theme tokens
    try {
      const themeTokens = THEMES[theme];
      if (themeTokens) {
        Object.entries(themeTokens).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      }
    } catch (error) {
      console.warn('Theme tokens error:', error);
    }

    // Log theme loading
    console.log('🎨 Theme loaded:', theme);
  }, [theme]);

  const handleSetTheme = (newTheme: ThemeName) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(storageKey, newTheme);
      }
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    const currentIndex = THEME_OPTIONS.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    handleSetTheme(THEME_OPTIONS[nextIndex]);
  };

  const value = {
    theme,
    setTheme: handleSetTheme,
    toggleTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};