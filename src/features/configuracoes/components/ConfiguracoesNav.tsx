import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Zap, Megaphone } from "lucide-react";

const navItems = [
  {
    path: "/configuracoes/integracoes",
    label: "Integrações",
    icon: Zap,
  },
  {
    path: "/configuracoes/anuncios", 
    label: "Avisos",
    icon: Megaphone,
  },
];

export function ConfiguracoesNav() {
  const location = useLocation();

  return (
    <nav className="flex space-x-8 border-b border-border">
      {navItems.map((item) => {
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
  );
}