import { useNavigate, useLocation } from "react-router-dom";
import { Package, RefreshCcw, AlertCircle, ShoppingBag, Undo2 } from "lucide-react";
import { MagneticTabs } from "@/components/ui/magnetic-tabs";

const subNavItems = [
  {
    path: "/pedidos",
    label: "Marketplace",
    icon: Package,
    preserveSearch: true,
  },
  {
    path: "/reclamacoes",
    label: "Reclamações",
    icon: AlertCircle,
  },
  {
    path: "/vendas-online",
    label: "Vendas Online",
    icon: ShoppingBag,
  },
  {
    path: "/devolucoes-ml",
    label: "Devoluções ML",
    icon: Undo2,
  },
];

export function MLOrdersNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Encontrar a aba ativa baseada na rota atual
  const activeItem = subNavItems.find(item => location.pathname === item.path);
  const activeValue = activeItem ? activeItem.path : "/pedidos";

  // Mapear para o formato do MagneticTabs
  const magneticItems = subNavItems.map((item) => {
    const Icon = item.icon;
    return {
      id: item.path,
      label: item.label,
      icon: <Icon className="w-5 h-5" />,
    };
  });

  const handleValueChange = (tabId: string) => {
    const item = subNavItems.find(i => i.path === tabId);
    if (item) {
      if (item.preserveSearch && location.pathname === '/pedidos') {
        navigate({ pathname: item.path, search: location.search });
      } else {
        navigate(item.path);
      }
    }
  };

  return (
    <MagneticTabs
      items={magneticItems}
      activeValue={activeValue}
      onValueChange={handleValueChange}
    />
  );
}
