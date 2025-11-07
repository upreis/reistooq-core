import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";
import { useEffect, useState } from "react";

const navItems = [
  {
    path: "/dashboardinicial/visao-geral",
    label: "Visão Geral",
    icon: BarChart3,
  },
  {
    path: "/dashboardinicial/vendas", 
    label: "Vendas",
    icon: ShoppingCart,
  },
  {
    path: "/dashboardinicial/estoque",
    label: "Estoque", 
    icon: Package,
  },
  {
    path: "/dashboardinicial/analises",
    label: "Análises",
    icon: TrendingUp,
  },
];

export function DashboardInicialNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Encontrar o índice ativo baseado na rota atual
  const activeIndex = navItems.findIndex(item => location.pathname === item.path);
  const defaultActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // State para forçar re-render quando a rota muda
  const [key, setKey] = useState(0);

  // Atualizar quando a location mudar
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [location.pathname]);

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
      key={key}
      items={limelightItems}
      defaultActiveIndex={defaultActiveIndex}
      onTabChange={(index) => navigate(navItems[index].path)}
    />
  );
}