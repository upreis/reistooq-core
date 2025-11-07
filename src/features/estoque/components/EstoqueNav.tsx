import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Package, Layers, Clock } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const navItems = [
  {
    path: "/estoque",
    label: "Controle de Estoque",
    icon: Package,
  },
  {
    path: "/estoque/composicoes",
    label: "Composições",
    icon: Layers,
  },
  {
    path: "/estoque/historico",
    label: "Histórico",
    icon: Clock,
  },
];

export function EstoqueNav() {
  const location = useLocation();

  return (
    <ScrollArea>
      <nav className="mb-3 flex h-auto -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "relative overflow-hidden rounded-none border border-border py-2 px-4 flex items-center gap-2 text-sm font-medium transition-colors",
                "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
                "first:rounded-s last:rounded-e hover:text-primary",
                isActive
                  ? "bg-muted after:bg-primary text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}