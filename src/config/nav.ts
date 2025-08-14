import { 
  Home, TrendingUp, ShoppingCart, Package, Scan, 
  ArrowLeftRight, AlertTriangle, History 
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: any;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_ITEMS: NavSection[] = [
  {
    title: "Dashboards",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "Analytics", url: "/analytics", icon: TrendingUp },
      { title: "eCommerce", url: "/ecommerce", icon: ShoppingCart },
    ]
  },
  {
    title: "Apps",
    items: [
      { title: "Gestão de Estoque", url: "/estoque", icon: Package },
      { title: "Pedidos", url: "/pedidos", icon: ShoppingCart },
      { title: "Scanner", url: "/scanner", icon: Scan },
      { title: "De-Para", url: "/de-para", icon: ArrowLeftRight },
      { title: "Alertas", url: "/alertas", icon: AlertTriangle },
      { title: "Histórico", url: "/historico", icon: History },
    ]
  }
];