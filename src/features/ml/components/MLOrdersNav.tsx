import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Package, RefreshCcw, AlertCircle, ShoppingBag, Undo2 } from "lucide-react";

const subNavItems = [
  {
    path: "/pedidos",
    label: "Marketplace",
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
      {/* Sub-navegação */}
      <nav className="flex space-x-8 border-b border-border">
        {subNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          // ✅ CORREÇÃO: Se o item tem preserveSearch E estamos em /pedidos, preservar params
          // Isso mantém os filtros quando clicamos no link novamente
          const to = item.preserveSearch && location.pathname === '/pedidos'
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
