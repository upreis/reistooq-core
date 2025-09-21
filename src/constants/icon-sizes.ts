// Constantes padronizadas para tamanhos de ícones
export const ICON_SIZES = {
  xs: 'w-3 h-3',    // Indicadores muito pequenos
  sm: 'w-4 h-4',    // Botões pequenos, ações secundárias  
  md: 'w-5 h-5',    // Sidebar expandido, navegação principal
  lg: 'w-6 h-6',    // Sidebar colapsado, headers, destaques
  xl: 'w-8 h-8',    // Logos, elementos principais
} as const;

export type IconSizeKey = keyof typeof ICON_SIZES;

export const getIconSize = (size: IconSizeKey): string => ICON_SIZES[size];

// Helpers específicos para o sidebar
export const getSidebarIconSize = (isCollapsed: boolean): string => 
  isCollapsed ? ICON_SIZES.lg : ICON_SIZES.md;