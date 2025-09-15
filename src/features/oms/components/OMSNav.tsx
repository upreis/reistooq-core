import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Pedidos", href: "/oms/pedidos", icon: ShoppingCart },
  { name: "Clientes", href: "/oms/clientes", icon: Users },
  { name: "Configurações", href: "/oms/configuracoes", icon: Settings },
];

export function OMSNav() {
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