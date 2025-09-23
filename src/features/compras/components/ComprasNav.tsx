import { Link, useLocation } from "react-router-dom";
import { Building2, FileText, TrendingUp, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ComprasNavProps {
  fornecedoresCount?: number;
  pedidosCount?: number;
  cotacoesCount?: number;
}

const navigation = [
  { name: "Fornecedores", href: "/compras/fornecedores", icon: Building2 },
  { name: "Pedidos", href: "/compras/pedidos", icon: FileText },
  { name: "Cotações", href: "/compras/cotacoes", icon: TrendingUp },
  { name: "Importação", href: "/compras/importacao", icon: Upload },
];

export function ComprasNav({ fornecedoresCount = 0, pedidosCount = 0, cotacoesCount = 0 }: ComprasNavProps) {
  const location = useLocation();

  const getCount = (href: string) => {
    if (href.includes("fornecedores")) return fornecedoresCount;
    if (href.includes("pedidos")) return pedidosCount;
    if (href.includes("cotacoes")) return cotacoesCount;
    return 0;
  };

  return (
    <nav className="flex space-x-8 border-b">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        const count = getCount(item.href);
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-2",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
            {count > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {count}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}