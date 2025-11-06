// Enhanced Sidebar Components
export { EnhancedSidebar } from './components/EnhancedSidebar';
export { SidebarTooltip } from './components/SidebarTooltip';
export { SidebarFlyout } from './components/SidebarFlyout';
export { SidebarItemWithChildren } from './components/SidebarItemWithChildren';
export { AnimatedSidebarItem } from './components/AnimatedSidebarItem';
export { AnimatedSidebarSection } from './components/AnimatedSidebarSection';

// Hooks
export { useSidebarState } from './hooks/useSidebarState';
export { useActiveRoute } from './hooks/useActiveRoute';

// Context (mantido para compatibilidade mas não mais usado no FullLayout)
// Use SidebarUIProvider do App.tsx para controle global
export { SidebarProvider, useSidebar } from './SidebarContext';

// Types
export type {
  NavItem,
  NavSection,
  SidebarState,
  SidebarConfig,
  FlyoutPosition,
  SidebarContextValue
} from './types/sidebar.types';