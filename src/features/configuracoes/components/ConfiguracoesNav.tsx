import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  {
    path: "/configuracoes/integracoes",
    label: "Integrações",
  },
  {
    path: "/configuracoes/anuncios", 
    label: "Anúncios",
  },
  {
    path: "/configuracoes/administracao",
    label: "Administração",
  },
];

export function ConfiguracoesNav() {
  const location = useLocation();

  return (
    <nav className="flex space-x-8 border-b border-border">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "pb-4 px-1 text-sm font-medium transition-colors hover:text-primary",
              isActive
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground border-b-2 border-transparent"
            )}
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}