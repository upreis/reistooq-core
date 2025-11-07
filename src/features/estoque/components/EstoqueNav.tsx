import { useNavigate, useLocation } from "react-router-dom";
import { Package, Layers, Clock } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";

const navItems = [
  {
    path: "/estoque",
    label: "Estoque",
    icon: Package,
  },
  {
    path: "/estoque/composicoes",
    label: "Composições",
    icon: Layers,
  },
  {
    path: "/estoque/historico",
    label: "Histórico",
    icon: Clock,
  },
];

export function EstoqueNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Encontrar o índice ativo baseado na rota atual
  const activeIndex = navItems.findIndex(item => location.pathname === item.path);
  const defaultActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // Mapear para o formato do LimelightNav
  const limelightItems = navItems.map((item, index) => {
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