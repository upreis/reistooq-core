import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'dark' | 'light'
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'light'
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'reistoq-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      setActualTheme(systemTheme)
      
      // Apply semantic tokens for system theme
      applySemanticTokens(systemTheme)
      return
    }

    root.classList.add(theme)
    setActualTheme(theme)
    
    // Apply semantic tokens for selected theme
    applySemanticTokens(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    actualTheme
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

// Apply semantic tokens based on theme
function applySemanticTokens(theme: 'dark' | 'light') {
  const root = document.documentElement

  // Status colors with better contrast for each theme
  if (theme === 'dark') {
    root.style.setProperty('--status-success', 'hsl(142 76% 46%)')
    root.style.setProperty('--status-success-bg', 'hsl(142 76% 46% / 0.15)')
    root.style.setProperty('--status-warning', 'hsl(43 96% 66%)')
    root.style.setProperty('--status-warning-bg', 'hsl(43 96% 66% / 0.15)')
    root.style.setProperty('--status-error', 'hsl(0 84% 70%)')
    root.style.setProperty('--status-error-bg', 'hsl(0 84% 70% / 0.15)')
    root.style.setProperty('--status-info', 'hsl(217 78% 61%)')
    root.style.setProperty('--status-info-bg', 'hsl(217 78% 61% / 0.15)')
    
    // Table specific for dark theme
    root.style.setProperty('--table-header-bg', 'hsl(var(--muted) / 0.2)')
    root.style.setProperty('--table-row-hover', 'hsl(var(--accent) / 0.1)')
    root.style.setProperty('--table-row-selected', 'hsl(var(--primary) / 0.15)')
    root.style.setProperty('--table-border', 'hsl(var(--border) / 0.8)')
  } else {
    root.style.setProperty('--status-success', 'hsl(142 76% 36%)')
    root.style.setProperty('--status-success-bg', 'hsl(142 76% 36% / 0.1)')
    root.style.setProperty('--status-warning', 'hsl(43 96% 56%)')
    root.style.setProperty('--status-warning-bg', 'hsl(43 96% 56% / 0.1)')
    root.style.setProperty('--status-error', 'hsl(0 84% 60%)')
    root.style.setProperty('--status-error-bg', 'hsl(0 84% 60% / 0.1)')
    root.style.setProperty('--status-info', 'hsl(217 78% 51%)')
    root.style.setProperty('--status-info-bg', 'hsl(217 78% 51% / 0.1)')
    
    // Table specific for light theme
    root.style.setProperty('--table-header-bg', 'hsl(var(--muted) / 0.3)')
    root.style.setProperty('--table-row-hover', 'hsl(var(--accent) / 0.05)')
    root.style.setProperty('--table-row-selected', 'hsl(var(--primary) / 0.1)')
    root.style.setProperty('--table-border', 'hsl(var(--border))')
  }

  // Interactive states (theme independent)
  root.style.setProperty('--interactive-hover', 'hsl(var(--primary) / 0.8)')
  root.style.setProperty('--interactive-active', 'hsl(var(--primary) / 0.9)')
  root.style.setProperty('--interactive-disabled', 'hsl(var(--muted) / 0.5)')
  root.style.setProperty('--interactive-focus', 'hsl(var(--primary) / 0.2)')
}