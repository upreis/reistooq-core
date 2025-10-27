import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Package, RefreshCcw, AlertCircle } from "lucide-react";

const subNavItems = [
  {
    path: "/pedidos",
    label: "Vendas",
    icon: Package,
  },
  {
    path: "/ml-orders-completas",
    label: "Devoluções de Vendas",
    icon: RefreshCcw,
  },
  {
    path: "/reclamacoes",
    label: "Reclamações",
    icon: AlertCircle,
  },
];

export function MLOrdersNav() {
  const location = useLocation();

  return (
    <div className="space-y-4">
      {/* Breadcrumb secundário */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>📦</span>
        <span>/</span>
        <span>Pedidos</span>
      </div>

      {/* Sub-navegação */}
      <nav className="flex space-x-8 border-b border-border">
        {subNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "pb-4 px-1 text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                isActive
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground border-b-2 border-transparent"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
