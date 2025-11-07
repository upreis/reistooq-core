import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Users, Settings, Store, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const navigation = [
  { name: "Vendas Marketplace", href: "/pedidos", icon: Store, preserveSearch: true },
  { name: "Vendas Direta/Atacado", href: "/oms/pedidos", icon: ShoppingCart },
  { name: "Clientes", href: "/oms/clientes", icon: Users },
  { name: "Vendedores", href: "/oms/vendedores", icon: UserCheck },
  { name: "Configurações", href: "/oms/configuracoes", icon: Settings },
];

export function OMSNav() {
  const location = useLocation();

  return (
    <ScrollArea>
      <nav className="mb-3 flex h-auto -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          
          // ✅ CORREÇÃO: Se o item tem preserveSearch E estamos em /pedidos, preservar params
          // Isso mantém os filtros quando clicamos no link novamente
          const to = item.preserveSearch && location.pathname === '/pedidos'
            ? { pathname: item.href, search: location.search }
            : item.href;
          
          return (
            <Link
              key={item.name}
              to={to}
              className={cn(
                "relative overflow-hidden rounded-none border border-border py-2 px-4 flex items-center text-sm font-medium transition-colors",
                "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
                "first:rounded-s last:rounded-e hover:text-primary",
                isActive
                  ? "bg-muted after:bg-primary text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
