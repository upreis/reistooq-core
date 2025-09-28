import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { THEMES, type ThemeName } from "./materialm/tokens";

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

export function SafeThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = "reistoq.theme",
  ...props
}: ThemeProviderProps) {
  // ✅ SAFE VERSION: More defensive useState initialization
  console.log('🎨 SafeThemeProvider: Initializing with React hooks validation');
  
  // Validate React hooks availability before using
  if (typeof useState === 'undefined' || useState === null) {
    console.error('❌ SafeThemeProvider: useState hook is not available');
    return <div style={{ padding: '20px', color: 'red' }}>
      Critical Error: React hooks not initialized. Please reload the page.
      <button onClick={() => window.location.reload()} style={{ marginLeft: '10px', padding: '5px 10px' }}>
        Reload
      </button>
    </div>;
  }

  const [theme, setTheme] = useState<ThemeName>(() => {
    // ✅ SAFE VERSION: More robust environment checks
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.log('🎨 SafeThemeProvider: Server-side rendering detected, using default theme');
        return defaultTheme;
      }
      
      if (!window.localStorage) {
        console.log('🎨 SafeThemeProvider: localStorage not available, using default theme');
        return defaultTheme;
      }
      
      const stored = window.localStorage.getItem(storageKey) as ThemeName;
      const validTheme = (stored && THEME_OPTIONS.includes(stored)) ? stored : defaultTheme;
      console.log('🎨 SafeThemeProvider: Theme loaded from storage:', validTheme);
      return validTheme;
    } catch (error) {
      console.warn('🎨 SafeThemeProvider: Error loading theme from storage:', error);
      return defaultTheme;
    }
  });

  useEffect(() => {
    // ✅ SAFE VERSION: More defensive DOM manipulation
    try {
      if (typeof document === 'undefined') {
        console.log('🎨 SafeThemeProvider: Document not available, skipping theme application');
        return;
      }
      
      const root = document.documentElement;
      if (!root) {
        console.warn('🎨 SafeThemeProvider: Document root not found');
        return;
      }
      
      // Remove all theme classes safely
      THEME_OPTIONS.forEach(t => {
        try {
          root.classList.remove(t);
        } catch (e) {
          console.warn('🎨 SafeThemeProvider: Error removing theme class:', t, e);
        }
      });
      
      // Apply theme data attribute and class
      root.setAttribute('data-theme', theme);
      root.classList.add(theme);

      // Apply CSS variables from theme tokens
      try {
        const themeTokens = THEMES[theme];
        if (themeTokens && typeof themeTokens === 'object') {
          Object.entries(themeTokens).forEach(([key, value]) => {
            try {
              root.style.setProperty(key, value);
            } catch (e) {
              console.warn('🎨 SafeThemeProvider: Error setting CSS property:', key, value, e);
            }
          });
        }
      } catch (error) {
        console.warn('🎨 SafeThemeProvider: Error applying theme tokens:', error);
      }

      console.log('🎨 SafeThemeProvider: Theme applied successfully:', theme);
    } catch (error) {
      console.error('🎨 SafeThemeProvider: Critical error in theme effect:', error);
    }
  }, [theme]);

  const handleSetTheme = (newTheme: ThemeName) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
      console.log('🎨 SafeThemeProvider: Theme changed to:', newTheme);
    } catch (error) {
      console.warn('🎨 SafeThemeProvider: Error saving theme:', error);
      // Still try to set the theme even if localStorage fails
      setTheme(newTheme);
    }
  };

  const toggleTheme = () => {
    try {
      const currentIndex = THEME_OPTIONS.indexOf(theme);
      const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
      handleSetTheme(THEME_OPTIONS[nextIndex]);
    } catch (error) {
      console.error('🎨 SafeThemeProvider: Error toggling theme:', error);
    }
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

  if (context === undefined) {
    console.warn("useTheme must be used within a ThemeProvider, returning default values");
    return {
      theme: DEFAULT_THEME,
      setTheme: () => {},
      toggleTheme: () => {}
    };
  }

  return context;
};

// Export the safe version as default for easy replacement
export { SafeThemeProvider as ThemeProvider };