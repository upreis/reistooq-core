import * as React from "react";
import { THEMES, type ThemeName } from "./materialm/tokens";

type ThemeProviderProps = {
  children: React.ReactNode;
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

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = "reistoq.theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<ThemeName>(() => {
    // Safe localStorage access for SSR/hydration
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    
    try {
      const stored = localStorage.getItem(storageKey) as ThemeName;
      return THEME_OPTIONS.includes(stored) ? stored : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  React.useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    THEME_OPTIONS.forEach(t => root.classList.remove(t));
    
    // Apply theme data attribute and CSS variables
    root.setAttribute('data-theme', theme);
    
    // Apply CSS variables
    const tokens = THEMES[theme];
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Log theme loading
    console.log('Theme loaded:', theme);
  }, [theme]);

  const handleSetTheme = (newTheme: ThemeName) => {
    try {
      localStorage.setItem(storageKey, newTheme);
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
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};