import { Link, useLocation } from "react-router-dom";
import { Store, FileText, Package, PlusSquare, Edit, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Loja", href: "/apps/ecommerce/shop", icon: Store },
  { name: "Detalhes", href: "/apps/ecommerce/detail/1", icon: FileText },
  { name: "Lista de Produtos", href: "/apps/ecommerce/list", icon: Package },
  { name: "Adicionar Produto", href: "/apps/ecommerce/addproduct", icon: PlusSquare },
  { name: "Editar Produtos", href: "/apps/ecommerce/editproduct", icon: Edit },
  { name: "Importar Exportar", href: "/apps/ecommerce/import", icon: Upload },
];

export function EcommerceNav() {
  const location = useLocation();

  return (
    <nav className="flex space-x-8 border-b">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href || 
          (item.href === "/apps/ecommerce/detail/1" && location.pathname.startsWith("/apps/ecommerce/detail/"));
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