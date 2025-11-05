import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Package, RefreshCcw, AlertCircle, ShoppingBag, Undo2 } from "lucide-react";

const subNavItems = [
  {
    path: "/pedidos",
    label: "Vendas",
    icon: Package,
    preserveSearch: true, // ✅ Preservar filtros na URL
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
  {
    path: "/vendas-online",
    label: "Vendas Online",
    icon: ShoppingBag,
  },
  {
    path: "/devolucoes-ml",
    label: "Devoluções ML",
    icon: Undo2,
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
          
          // ✅ Preservar query params para rotas específicas (ex: /pedidos)
          const to = item.preserveSearch && location.pathname === item.path
            ? { pathname: item.path, search: location.search }
            : item.path;
          
          return (
            <NavLink
              key={item.path}
              to={to}
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
