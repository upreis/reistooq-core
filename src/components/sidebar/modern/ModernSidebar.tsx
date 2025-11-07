"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuGroup } from "./MenuGroup";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  ShoppingCart,
  Grid3X3,
  Scan,
  ArrowLeftRight,
  Bell,
  History,
  Settings,
  Shield,
  Home,
  Store,
  Users,
  UserCheck,
  Calculator,
  Building2,
  Upload,
  Layers,
  Clock,
  Calendar,
  Notebook,
  Zap,
  Megaphone,
  User,
  Mail,
  Lock,
  FileSearch,
  HelpCircle,
  ChevronDown,
  DollarSign
} from "lucide-react";

// Mapeamento de ícones
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Home,
  TrendingUp,
  Package,
  DollarSign,
  Store,
  ShoppingCart,
  Users,
  UserCheck,
  Settings,
  ShoppingBag,
  Calculator,
  Building2,
  Upload,
  Layers,
  Clock,
  Grid3X3,
  Calendar,
  Notebook,
  Scan,
  ArrowLeftRight,
  Bell,
  History,
  Shield,
  Zap,
  Megaphone,
  User,
  Mail,
  Lock,
  FileSearch
};

type MenuItem = { 
  name: string; 
  path: string; 
  icon?: string;
};

type MenuGroup = {
  name: string;
  icon: string;
  items: MenuItem[];
};

export const ModernSidebar = () => {
  const location = useLocation();

  // Navegação principal com grupos
  const navigationGroups: (MenuItem | MenuGroup)[] = [
    {
      name: "Dashboard",
      icon: "LayoutDashboard",
      items: [
        { name: "Visão Geral", path: "/dashboardinicial/visao-geral", icon: "Home" },
        { name: "Dashboard Vendas", path: "/dashboardinicial/vendas", icon: "TrendingUp" },
        { name: "Dashboard Estoque", path: "/dashboardinicial/estoque", icon: "Package" },
        { name: "Análises", path: "/dashboardinicial/analises", icon: "DollarSign" }
      ]
    },
    {
      name: "Vendas",
      icon: "TrendingUp",
      items: [
        { name: "Marketplace", path: "/pedidos", icon: "Store" },
        { name: "Atacado", path: "/oms/pedidos", icon: "ShoppingCart" },
        { name: "Clientes", path: "/oms/clientes", icon: "Users" },
        { name: "Vendedores", path: "/oms/vendedores", icon: "UserCheck" },
        { name: "Configurações OMS", path: "/oms/configuracoes", icon: "Settings" }
      ]
    },
    {
      name: "Compras",
      icon: "ShoppingBag",
      items: [
        { name: "Pedidos", path: "/compras/pedidos", icon: "ShoppingCart" },
        { name: "Cotações", path: "/compras/cotacoes", icon: "Calculator" },
        { name: "Fornecedores", path: "/compras/fornecedores", icon: "Building2" },
        { name: "Importação", path: "/compras/importacao", icon: "Upload" }
      ]
    },
    {
      name: "Estoque",
      icon: "Package",
      items: [
        { name: "Estoque", path: "/estoque", icon: "Package" },
        { name: "Composições", path: "/estoque/composicoes", icon: "Layers" },
        { name: "Histórico", path: "/estoque/historico", icon: "Clock" }
      ]
    },
    { 
      name: "eCommerce", 
      path: "/apps/ecommerce/shop", 
      icon: "ShoppingCart" 
    },
    {
      name: "Aplicativos",
      icon: "Grid3X3",
      items: [
        { name: "Calendário Logístico", path: "/aplicativos/calendario", icon: "Calendar" },
        { name: "Notas", path: "/aplicativos/notas", icon: "Notebook" }
      ]
    },
    { 
      name: "Scanner", 
      path: "/scanner", 
      icon: "Scan" 
    },
    { 
      name: "De-Para", 
      path: "/de-para", 
      icon: "ArrowLeftRight" 
    },
    { 
      name: "Alertas", 
      path: "/alertas", 
      icon: "Bell" 
    },
    { 
      name: "Histórico", 
      path: "/historico", 
      icon: "History" 
    }
  ];

  const navigationFooter: (MenuItem | MenuGroup)[] = [
    {
      name: "Configurações",
      icon: "Settings",
      items: [
        { name: "Integrações", path: "/configuracoes/integracoes", icon: "Zap" },
        { name: "Avisos", path: "/configuracoes/anuncios", icon: "Megaphone" }
      ]
    },
    {
      name: "Administração",
      icon: "Shield",
      items: [
        { name: "Visão Geral", path: "/admin", icon: "LayoutDashboard" },
        { name: "Usuários", path: "/admin/usuarios", icon: "Users" },
        { name: "Cargos", path: "/admin/cargos", icon: "UserCheck" },
        { name: "Convites", path: "/admin/convites", icon: "Mail" },
        { name: "Alertas", path: "/admin/alertas", icon: "Bell" },
        { name: "Segurança", path: "/admin/seguranca", icon: "Lock" },
        { name: "Auditoria", path: "/admin/auditoria", icon: "FileSearch" },
        { name: "Perfil", path: "/admin/perfil", icon: "User" }
      ]
    }
  ];

  const profileRef = useRef<HTMLButtonElement | null>(null);
  const [isProfileActive, setIsProfileActive] = useState(false);

  useEffect(() => {
    const handleProfile = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileActive(false);
      }
    };
    document.addEventListener("click", handleProfile);
    return () => document.removeEventListener("click", handleProfile);
  }, []);

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  const renderNavItem = (item: MenuItem) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          className={cn(
            "flex items-center gap-x-2 p-2 rounded-lg duration-150",
            isActive 
              ? "bg-primary text-primary-foreground font-medium" 
              : "text-muted-foreground hover:bg-muted active:bg-muted/80"
          )}
        >
          <div>{renderIcon(item.icon)}</div>
          {item.name}
        </Link>
      </li>
    );
  };

  const renderNavGroup = (group: MenuGroup, idx: number) => {
    return (
      <li key={`group-${idx}`}>
        <MenuGroup items={group.items} groupName={group.name}>
          {renderIcon(group.icon)}
          {group.name}
        </MenuGroup>
      </li>
    );
  };

  const renderNavigation = (items: (MenuItem | MenuGroup)[]) => {
    return items.map((item, idx) => {
      if ('items' in item) {
        return renderNavGroup(item as MenuGroup, idx);
      }
      return renderNavItem(item as MenuItem);
    });
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-full border-r bg-background space-y-8 sm:w-80 z-50">
      <div className="flex flex-col h-full px-4">
        {/* Header com perfil */}
        <div className="h-20 flex items-center pl-2">
          <div className="w-full flex items-center gap-x-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="block text-foreground text-sm font-semibold">Usuário</span>
              <span className="block mt-px text-muted-foreground text-xs">Plano Ativo</span>
            </div>

            <div className="relative flex-1 text-right">
              <button
                ref={profileRef}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted active:bg-muted/80"
                onClick={() => setIsProfileActive((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isProfileActive}
                aria-controls="profile-menu"
              >
                <ChevronDown className="w-5 h-5" aria-hidden="true" />
              </button>

              {isProfileActive && (
                <div
                  id="profile-menu"
                  role="menu"
                  className="absolute z-10 top-12 right-0 w-64 rounded-lg bg-popover shadow-md border text-sm text-popover-foreground"
                >
                  <div className="p-2 text-left">
                    <span className="block text-muted-foreground p-2">usuario@email.com</span>
                    <Link
                      to="/admin/perfil"
                      className="block w-full p-2 text-left rounded-md hover:bg-muted active:bg-muted/80 duration-150"
                      role="menuitem"
                    >
                      Ver Perfil
                    </Link>
                    <Link
                      to="/configuracoes"
                      className="block w-full p-2 text-left rounded-md hover:bg-muted active:bg-muted/80 duration-150"
                      role="menuitem"
                    >
                      Configurações
                    </Link>
                    <button className="block w-full p-2 text-left rounded-md hover:bg-muted active:bg-muted/80 duration-150">
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navegação principal */}
        <div className="overflow-auto flex-1">
          <ul className="text-sm font-medium space-y-1">
            {renderNavigation(navigationGroups)}
          </ul>

          {/* Navegação do rodapé */}
          <div className="pt-2 mt-2 border-t">
            <ul className="text-sm font-medium space-y-1">
              {renderNavigation(navigationFooter)}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};
