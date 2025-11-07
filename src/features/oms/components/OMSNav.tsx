import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Users, Settings, Store, UserCheck } from "lucide-react";
import { RadioGroupNav } from "@/components/ui/radio-group-nav";

const navigation = [
  { name: "Marketplace", href: "/pedidos", icon: Store, preserveSearch: true },
  { name: "Atacado", href: "/oms/pedidos", icon: ShoppingCart },
  { name: "Clientes", href: "/oms/clientes", icon: Users },
  { name: "Vendedores", href: "/oms/vendedores", icon: UserCheck },
  { name: "Configurações", href: "/oms/configuracoes", icon: Settings },
];

export function OMSNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const options = navigation.map((item) => ({
    value: item.href,
    label: item.name,
    icon: item.icon,
  }));

  const handleChange = (value: string) => {
    const selectedItem = navigation.find((item) => item.href === value);
    
    if (selectedItem?.preserveSearch && location.pathname === '/pedidos') {
      navigate({ pathname: value, search: location.search });
    } else {
      navigate(value);
    }
  };

  return (
    <RadioGroupNav
      options={options}
      value={location.pathname}
      onChange={handleChange}
      gap="12px"
      padding="0 24px"
    />
  );
}
