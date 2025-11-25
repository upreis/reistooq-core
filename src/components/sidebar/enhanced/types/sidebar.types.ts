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
  activeRoute: string;
}