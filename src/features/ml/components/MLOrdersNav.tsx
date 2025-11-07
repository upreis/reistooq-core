import { useLocation, useNavigate } from "react-router-dom";
import { Package, RefreshCcw, AlertCircle, ShoppingBag, Undo2 } from "lucide-react";
import { RadioGroupNav } from "@/components/ui/radio-group-nav";

const subNavItems = [
  {
    path: "/pedidos",
    label: "Vendas",
    icon: Package,
    preserveSearch: true,
  },
  {
    path: "/ml-orders-completas",
    label: "Devoluções de Vendas",
    icon: RefreshCcw,
  },
  {
    path: "/reclamacoes",
    label: "Reclamações",
    icon: AlertCircle,
  },
  {
    path: "/vendas-online",
    label: "Vendas Online",
    icon: ShoppingBag,
  },
  {
    path: "/devolucoes-ml",
    label: "Devoluções ML",
    icon: Undo2,
  },
];

export function MLOrdersNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleChange = (value: string) => {
    const item = subNavItems.find(i => i.path === value);
    if (item?.preserveSearch && location.pathname === '/pedidos') {
      navigate({ pathname: value, search: location.search });
    } else {
      navigate(value);
    }
  };

  return (
    <RadioGroupNav
      options={subNavItems.map(item => ({
        value: item.path,
        label: item.label,
        icon: item.icon,
      }))}
      value={location.pathname}
      onChange={handleChange}
    />
  );
}
