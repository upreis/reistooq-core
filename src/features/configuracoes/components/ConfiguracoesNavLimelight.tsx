import { useNavigate, useLocation } from "react-router-dom";
import { Zap, Megaphone, Bell } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";

const navItems = [
  {
    path: "/configuracoes/integracoes",
    label: "Integrações",
    icon: Zap,
  },
  {
    path: "/configuracoes/anuncios",
    label: "Avisos",
    icon: Megaphone,
  },
  {
    path: "/configuracoes/alertas",
    label: "Alertas",
    icon: Bell,
  },
];

export function ConfiguracoesNavLimelight() {
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
