import { useNavigate, useLocation } from "react-router-dom";
import { Building2, FileText, TrendingUp, Upload } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";

const navItems = [
  {
    path: "/compras/pedidos",
    label: "Pedidos",
    icon: FileText,
  },
  {
    path: "/compras/cotacoes",
    label: "Cotações",
    icon: TrendingUp,
  },
  {
    path: "/compras/fornecedores",
    label: "Fornecedores",
    icon: Building2,
  },
  {
    path: "/compras/importacao",
    label: "Importação",
    icon: Upload,
  },
];

export function ComprasNavLimelight() {
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
