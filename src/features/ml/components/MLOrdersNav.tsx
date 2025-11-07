import { useNavigate, useLocation } from "react-router-dom";
import { Package, RefreshCcw, AlertCircle, ShoppingBag, Undo2 } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";

const subNavItems = [
  {
    path: "/pedidos",
    label: "Marketplace",
    icon: Package,
    preserveSearch: true,
  },
  {
    path: "/ml-orders-completas",
    label: "Devoluções de Vendas",
    icon: RefreshCcw,
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

  // Encontrar o índice ativo baseado na rota atual
  const activeIndex = subNavItems.findIndex(item => location.pathname === item.path);
  const defaultActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // Mapear para o formato do LimelightNav
  const limelightItems = subNavItems.map((item) => {
    const Icon = item.icon;
    return {
      id: item.path,
      icon: <Icon />,
      label: item.label,
      onClick: () => {
        if (item.preserveSearch && location.pathname === '/pedidos') {
          navigate({ pathname: item.path, search: location.search });
        } else {
          navigate(item.path);
        }
      },
    };
  });

  return (
    <LimelightNav
      items={limelightItems}
      defaultActiveIndex={defaultActiveIndex}
      onTabChange={(index) => {
        const item = subNavItems[index];
        if (item.preserveSearch && location.pathname === '/pedidos') {
          navigate({ pathname: item.path, search: location.search });
        } else {
          navigate(item.path);
        }
      }}
    />
  );
}
