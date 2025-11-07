export interface MenuItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

export interface MenuGroup {
  name: string;
  icon: React.ReactNode;
  items: MenuItem[];
}
