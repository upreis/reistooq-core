import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Users, Settings, UserCheck, PackageX, FileText } from "lucide-react";
import { LimelightNav } from "@/components/ui/limelight-nav";
import mercadoLivreLogo from "@/assets/mercado-livre-logo.png";

const navItems = [
  {
    path: "/pedidos",
    label: "Mercado Livre",
    icon: null,
    customIcon: mercadoLivreLogo,
    preserveSearch: true,
  },
  {
    path: "/oms/pedidos",
    label: "Atacado",
    icon: ShoppingCart,
  },
  {
    path: "/oms/cadastro",
    label: "Cadastro",
    icon: Users,
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
      icon: item.customIcon ? (
        <img src={item.customIcon} alt={item.label} className="w-[30px] h-[30px] object-contain mt-1 -mb-1" />
      ) : (
        <Icon />
      ),
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
