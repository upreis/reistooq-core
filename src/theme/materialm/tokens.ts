// MaterialM Theme Tokens - Nova Paleta Navy & Amber
export const MATERIALM_DARK = {
  '--background': '210 40% 7%', // #0B1220
  '--foreground': '210 40% 90%', // #E5E7EB

  '--card': '220 40% 10%', // #0F172A
  '--card-foreground': '210 40% 90%', // #E5E7EB
  '--popover': '220 40% 10%', // #0F172A
  '--popover-foreground': '210 40% 90%', // #E5E7EB

  '--primary': '210 73% 15%', // Navy #0B1F3B
  '--primary-foreground': '0 0% 100%',

  '--secondary': '215 25% 17%', // #1F2937
  '--secondary-foreground': '210 40% 90%',

  '--muted': '215 25% 17%', // #1F2937
  '--muted-foreground': '215 25% 65%', // #94A3B8

  '--accent': '43 96% 56%', // Amber #F59E0B
  '--accent-foreground': '220 40% 10%',

  '--destructive': '0 84% 60%', // #EF4444
  '--destructive-foreground': '0 0% 100%',

  '--border': '215 25% 17%', // #1F2937
  '--input': '215 25% 17%',
  '--ring': '215 25% 20%',

  // Sidebar colors
  '--sidebar-background': '210 40% 7%',
  '--sidebar-foreground': '210 40% 90%',
  '--sidebar-accent': '215 25% 17%',
  '--sidebar-accent-foreground': '210 40% 90%',
  '--sidebar-border': '215 25% 17%',
  '--sidebar-ring': '43 96% 56%',

  // Status colors  
  '--info': '214 95% 60%', // #3B82F6
  '--success': '142 71% 45%', // #22C55E
  '--warning': '43 96% 56%', // #F59E0B
  '--danger': '0 84% 60%', // #EF4444

  '--radius': '12px',
} as const;

export const MATERIALM_LIGHT = {
  '--background': '210 40% 97%', // #F8FAFC  
  '--foreground': '220 13% 9%', // #0F172A

  '--card': '0 0% 100%', // #FFFFFF
  '--card-foreground': '220 13% 9%', // #0F172A
  '--popover': '0 0% 100%', // #FFFFFF
  '--popover-foreground': '220 13% 9%', // #0F172A

  '--primary': '210 73% 15%', // Navy #0B1F3B
  '--primary-foreground': '0 0% 100%',

  '--secondary': '220 13% 91%', // #E2E8F0
  '--secondary-foreground': '220 13% 9%',

  '--muted': '220 13% 91%', // #E2E8F0
  '--muted-foreground': '215 25% 65%', // #94A3B8

  '--accent': '43 96% 56%', // Amber #F59E0B
  '--accent-foreground': '210 73% 15%',

  '--destructive': '0 84% 60%', // #EF4444
  '--destructive-foreground': '0 0% 100%',

  '--border': '220 13% 91%', // #E2E8F0
  '--input': '220 13% 91%',
  '--ring': '220 13% 85%',

  // Sidebar colors
  '--sidebar-background': '0 0% 100%',
  '--sidebar-foreground': '220 13% 33%',
  '--sidebar-accent': '220 13% 96%',
  '--sidebar-accent-foreground': '220 13% 9%',
  '--sidebar-border': '220 13% 91%',
  '--sidebar-ring': '43 96% 56%',

  // Status colors
  '--info': '214 95% 60%', // #3B82F6
  '--success': '142 71% 45%', // #22C55E
  '--warning': '43 96% 56%', // #F59E0B
  '--danger': '0 84% 60%', // #EF4444

  '--radius': '12px',
} as const;

export type ThemeName = 'materialm-dark' | 'materialm-light';

export const THEMES = {
  'materialm-dark': MATERIALM_DARK,
  'materialm-light': MATERIALM_LIGHT,
} as const;