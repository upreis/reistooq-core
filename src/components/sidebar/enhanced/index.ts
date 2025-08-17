// Enhanced Sidebar Components
export { EnhancedSidebar } from './components/EnhancedSidebar';
export { SidebarTooltip } from './components/SidebarTooltip';
export { SidebarFlyout } from './components/SidebarFlyout';
export { SidebarItemWithChildren } from './components/SidebarItemWithChildren';

// Hooks
export { useSidebarState } from './hooks/useSidebarState';
export { useActiveRoute } from './hooks/useActiveRoute';

// Context
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