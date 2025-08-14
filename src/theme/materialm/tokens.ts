// MaterialM Theme Tokens - Main (Dark) Variant
// Based on MaterialM React Tailwind Template

export const materialMTokens = {
  fonts: {
    primary: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  colors: {
    // Main background and surfaces
    background: {
      primary: 'hsl(220, 16%, 8%)', // Main dark background #131318
      secondary: 'hsl(218, 17%, 11%)', // Card backgrounds #1c1e26
      tertiary: 'hsl(220, 16%, 13%)', // Elevated surfaces
    },
    
    // Text colors
    text: {
      primary: 'hsl(210, 20%, 98%)', // Main text color
      secondary: 'hsl(215, 20%, 65%)', // Muted text
      tertiary: 'hsl(215, 15%, 45%)', // Disabled text
    },
    
    // Primary brand colors
    primary: {
      DEFAULT: 'hsl(215, 100%, 59%)', // Blue #478EF0
      hover: 'hsl(215, 100%, 54%)',
      active: 'hsl(215, 100%, 49%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    
    // Sidebar specific colors
    sidebar: {
      background: 'hsl(220, 16%, 8%)', // Same as main background
      foreground: 'hsl(210, 20%, 98%)',
      border: 'hsl(218, 17%, 15%)',
      accent: 'hsl(218, 17%, 11%)',
      'accent-foreground': 'hsl(210, 20%, 98%)',
    },
    
    // Border and dividers
    border: {
      DEFAULT: 'hsl(218, 17%, 15%)', // Subtle borders
      muted: 'hsl(218, 17%, 12%)', // Very subtle borders
    },
    
    // Status colors
    success: {
      DEFAULT: 'hsl(142, 76%, 36%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    warning: {
      DEFAULT: 'hsl(38, 92%, 50%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    error: {
      DEFAULT: 'hsl(0, 84%, 60%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    info: {
      DEFAULT: 'hsl(215, 100%, 59%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
  },
  
  spacing: {
    sidebar: {
      width: '280px',
      collapsedWidth: '70px',
    },
    topbar: {
      height: '70px',
    },
    container: {
      padding: '24px',
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },
} as const;

// Console logging for verification
console.log('Theme: MaterialM(main) loaded');
console.log('Font: Plus Jakarta Sans');

export type MaterialMTokens = typeof materialMTokens;