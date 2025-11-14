import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Users, Settings, Store, UserCheck, PackageX, FileText } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";

const navItems = [
  {
    path: "/pedidos",
    label: "Marketplace",
    icon: Store,
    preserveSearch: true,
  },
  {
    path: "/oms/pedidos",
    label: "Atacado",
    icon: ShoppingCart,
  },
  {
    path: "/oms/clientes",
    label: "Clientes",
    icon: Users,
  },
  {
    path: "/oms/vendedores",
    label: "Vendedores",
    icon: UserCheck,
  },
  {
    path: "/devolucoes-ml",
    label: "Devoluções ML",
    icon: PackageX,
  },
  {
    path: "/devolucao2025",
    label: "Devoluções 2025",
    icon: FileText,
  },
  {
    path: "/oms/configuracoes",
    label: "Configurações",
    icon: Settings,
  },
];

export function OMSNavLimelight() {
  const navigate = useNavigate();
  const location = useLocation();

  // Encontrar o índice ativo baseado na rota atual
  const activeIndex = navItems.findIndex(item => location.pathname === item.path);
  const defaultActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // Mapear para o formato do LimelightNav
  const limelightItems = navItems.map((item) => {
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
        const item = navItems[index];
        if (item.preserveSearch && location.pathname === '/pedidos') {
          navigate({ pathname: item.path, search: location.search });
        } else {
          navigate(item.path);
        }
      }}
    />
  );
}
