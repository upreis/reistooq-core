import { Link, useLocation } from "react-router-dom";
import { Store, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Orders", href: "/pedidos", icon: Store },
  { name: "Devoluções ML", href: "/pedidos/devolucoes", icon: RotateCcw },
];

export function PedidosNav() {
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
