import { Link, useLocation } from "react-router-dom";
import { Building2, FileText, TrendingUp, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Pedidos", href: "/compras/pedidos", icon: FileText },
  { name: "Cotações", href: "/compras/cotacoes", icon: TrendingUp },
  { name: "Fornecedores", href: "/compras/fornecedores", icon: Building2 },
  { name: "Importação", href: "/compras/importacao", icon: Upload },
];

export function ComprasNav() {
  const location = useLocation();

  return (
    <nav className="flex space-x-8 rounded-lg border bg-card text-card-foreground shadow-sm p-1">
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