import { useLocation, useNavigate } from "react-router-dom";
import { Store, Package, PlusSquare, Edit, Upload } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const navigation = [
  { name: "Loja", href: "/apps/ecommerce/shop", icon: Store },
  { name: "Lista de Produtos", href: "/apps/ecommerce/list", icon: Package },
  { name: "Adicionar Produto", href: "/apps/ecommerce/addproduct", icon: PlusSquare },
  { name: "Editar Produtos", href: "/apps/ecommerce/editproduct", icon: Edit },
  { name: "Importar Exportar", href: "/apps/ecommerce/import", icon: Upload },
];

export function EcommerceNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determina a tab ativa baseada na rota atual
  const activeTab = navigation.find(item => location.pathname === item.href)?.href || navigation[0].href;

  const handleTabChange = (value: string) => {
    navigate(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <ScrollArea>
        <TabsList className="mb-3 h-auto -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
          {navigation.map((item) => {
            const Icon = item.icon;
            
            return (
              <TabsTrigger
                key={item.name}
                value={item.href}
                className="relative overflow-hidden rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
              >
                <Icon
                  className="-ms-0.5 me-1.5 opacity-60"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {item.name}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
}