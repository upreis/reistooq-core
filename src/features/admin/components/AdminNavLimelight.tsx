import { useNavigate, useLocation } from "react-router-dom";
import { Settings, Users, Shield, Mail, Bell, History, User } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";

const navItems = [
  {
    path: "/admin",
    label: "Visão Geral",
    icon: Settings,
  },
  {
    path: "/admin/usuarios",
    label: "Usuários",
    icon: Users,
  },
  {
    path: "/admin/cargos",
    label: "Cargos",
    icon: Shield,
  },
  {
    path: "/admin/convites",
    label: "Convites",
    icon: Mail,
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
    path: "/admin/auditoria",
    label: "Auditoria",
    icon: History,
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
