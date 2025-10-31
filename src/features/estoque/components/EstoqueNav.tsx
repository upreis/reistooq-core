import { Link, useLocation } from "react-router-dom";
import { Package, Layers, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Controle de Estoque", href: "/estoque", icon: Package },
  { name: "Composições", href: "/estoque/composicoes", icon: Layers },
  { name: "Histórico", href: "/estoque/historico", icon: Clock },
];

export function EstoqueNav() {
  const location = useLocation();

  return (
    <nav className="flex space-x-8 border-b">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}