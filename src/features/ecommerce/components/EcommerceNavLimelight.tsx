import { useNavigate, useLocation } from "react-router-dom";
import { Store, Package, PlusSquare } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";

const navItems = [
  {
    path: "/apps/ecommerce/shop",
    label: "Loja",
    icon: Store,
  },
  {
    path: "/apps/ecommerce/list",
    label: "Produtos",
    icon: Package,
  },
  {
    path: "/apps/ecommerce/addproduct",
    label: "Adicionar",
    icon: PlusSquare,
  },
];

export function EcommerceNavLimelight() {
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
      onClick: () => navigate(item.path),
    };
  });

  return (
    <LimelightNav
      items={limelightItems}
      defaultActiveIndex={defaultActiveIndex}
      onTabChange={(index) => navigate(navItems[index].path)}
    />
  );
}
