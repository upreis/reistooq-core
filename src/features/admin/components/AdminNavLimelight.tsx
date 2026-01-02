import { useNavigate, useLocation } from "react-router-dom";
import { Settings, Users, Shield, Bell, User, Link2 } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";

const navItems = [
  {
    path: "/admin",
    label: "Geral",
    icon: Settings,
  },
  {
    path: "/admin/usuarios",
    label: "Usuários",
    icon: Users,
  },
  {
    path: "/admin/alertas",
    label: "Alertas",
    icon: Bell,
  },
  {
    path: "/admin/seguranca",
    label: "Segurança",
    icon: Shield,
  },
  {
    path: "/admin/integracoes",
    label: "Integrações",
    icon: Link2,
  },
  {
    path: "/admin/perfil",
    label: "Perfil",
    icon: User,
  },
];

export function AdminNavLimelight() {
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
