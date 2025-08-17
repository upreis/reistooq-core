export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: string;
  children?: NavItem[];
  roles?: string[];
  feature?: string;
  badge?: {
    content: string | number;
    variant: 'default' | 'destructive' | 'warning' | 'success';
  };
}

export interface NavSection {
  id: string;
  group: string;
  items: NavItem[];
}

export interface SidebarState {
  expanded: boolean;
  openGroups: Record<string, boolean>;
  hoveredItem: string | null;
  activeRoute: string;
  searchQuery: string;
}

export interface FlyoutPosition {
  top: number;
  left: number;
  maxHeight: number;
}

export interface SidebarConfig {
  expandedWidth: number;
  collapsedWidth: number;
  hoverOpenDelay: number;
  hoverCloseDelay: number;
  zIndexFlyout: number;
  persistKey: string;
  animationDuration: number;
}

export interface KeyboardShortcuts {
  toggle: string;
  search: string;
  escape: string;
}

export interface A11yConfig {
  ariaRole: string;
  keyboard: boolean;
  escapeClosesFlyout: boolean;
  announcements: boolean;
}

export interface SidebarBehaviors {
  flyoutPortal: boolean;
  openOnHover: boolean;
  touchTapToExpand: boolean;
  closeOnRouteChange: boolean;
  autoCollapseOnMobile: boolean;
}

export type PointerType = 'mouse' | 'touch' | 'pen';

export interface SidebarContextValue {
  state: SidebarState;
  config: SidebarConfig;
  actions: {
    toggleExpanded: () => void;
    setExpanded: (expanded: boolean) => void;
    toggleGroup: (groupId: string) => void;
    setHoveredItem: (itemId: string | null) => void;
    setSearchQuery: (query: string) => void;
  };
  utils: {
    isActive: (path: string) => boolean;
    getPointerType: () => PointerType;
    calculateFlyoutPosition: (element: HTMLElement) => FlyoutPosition;
  };
}