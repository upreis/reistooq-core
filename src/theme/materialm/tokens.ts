// MaterialM Theme Tokens
export const MATERIALM_DARK = {
  '--background': '220 13% 8%',
  '--foreground': '220 9% 91%',

  '--card': '220 13% 11%',
  '--card-foreground': '220 9% 91%',
  '--popover': '220 13% 11%',
  '--popover-foreground': '220 9% 91%',

  '--primary': '21 89% 64%', // MaterialM orange #FF7A45
  '--primary-foreground': '0 0% 100%',

  '--secondary': '220 13% 16%',
  '--secondary-foreground': '220 9% 91%',

  '--muted': '220 13% 14%',
  '--muted-foreground': '220 9% 62%',

  '--accent': '220 13% 14%',
  '--accent-foreground': '220 9% 91%',

  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 100%',

  '--border': '220 13% 16%',
  '--input': '220 13% 16%',
  '--ring': '220 13% 20%',

  // Sidebar colors
  '--sidebar-background': '224 71% 4%',
  '--sidebar-foreground': '220 9% 66%',
  '--sidebar-accent': '220 13% 15%',
  '--sidebar-accent-foreground': '220 9% 91%',
  '--sidebar-border': '220 13% 16%',
  '--sidebar-ring': '21 89% 64%',

  // Status colors
  '--info': '217 91% 60%',
  '--success': '142 76% 36%',
  '--warning': '43 96% 56%',
  '--danger': '0 84% 60%',

  '--radius': '12px',
} as const;

export const MATERIALM_LIGHT = {
  '--background': '0 0% 98%',
  '--foreground': '220 13% 9%',

  '--card': '0 0% 100%',
  '--card-foreground': '220 13% 9%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '220 13% 9%',

  '--primary': '21 89% 64%', // MaterialM orange #FF7A45
  '--primary-foreground': '0 0% 100%',

  '--secondary': '220 13% 95%',
  '--secondary-foreground': '220 13% 9%',

  '--muted': '220 13% 95%',
  '--muted-foreground': '220 9% 46%',

  '--accent': '220 13% 95%',
  '--accent-foreground': '220 13% 9%',

  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 100%',

  '--border': '220 13% 91%',
  '--input': '220 13% 91%',
  '--ring': '220 13% 85%',

  // Sidebar colors
  '--sidebar-background': '0 0% 100%',
  '--sidebar-foreground': '220 13% 33%',
  '--sidebar-accent': '220 13% 96%',
  '--sidebar-accent-foreground': '220 13% 9%',
  '--sidebar-border': '220 13% 91%',
  '--sidebar-ring': '21 89% 64%',

  // Status colors
  '--info': '217 91% 60%',
  '--success': '142 70% 45%',
  '--warning': '43 96% 56%',
  '--danger': '0 84% 60%',

  '--radius': '12px',
} as const;

export type ThemeName = 'materialm-dark' | 'materialm-light';

export const THEMES = {
  'materialm-dark': MATERIALM_DARK,
  'materialm-light': MATERIALM_LIGHT,
} as const;