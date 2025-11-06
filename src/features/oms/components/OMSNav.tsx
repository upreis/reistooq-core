import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Users, Settings, Store, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Vendas Marketplace", href: "/pedidos", icon: Store, preserveSearch: true },
  { name: "Vendas Direta/Atacado", href: "/oms/pedidos", icon: ShoppingCart },
  { name: "Clientes", href: "/oms/clientes", icon: Users },
  { name: "Vendedores", href: "/oms/vendedores", icon: UserCheck },
  { name: "Configurações", href: "/oms/configuracoes", icon: Settings },
];

export function OMSNav() {
  const location = useLocation();
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const containerRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Encontrar o índice ativo
  const activeIndex = navigation.findIndex(item => location.pathname === item.href);

  // Atualizar posição do indicador quando muda de página ou redimensiona
  useEffect(() => {
    const updateIndicator = () => {
      if (activeIndex !== -1 && linkRefs.current[activeIndex] && containerRef.current) {
        const link = linkRefs.current[activeIndex];
        const container = containerRef.current;
        if (!link) return;
        const linkRect = link.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setIndicatorStyle({
          width: linkRect.width,
          left: linkRect.left - containerRect.left,
        });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeIndex]);

  return (
    <nav ref={containerRef} className="relative flex space-x-8 border-b">
      {navigation.map((item, index) => {
        const isActive = location.pathname === item.href;
        
        const to = item.preserveSearch && location.pathname === '/pedidos'
          ? { pathname: item.href, search: location.search }
          : item.href;
        
        return (
          <Link
            key={item.name}
            ref={(el) => (linkRefs.current[index] = el)}
            to={to}
            className={cn(
              "relative flex items-center px-1 pt-1 pb-3 text-sm font-medium transition-colors z-10",
              isActive
                ? "text-[hsl(var(--brand-yellow))]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
      
      {/* Indicador deslizante animado */}
      {activeIndex !== -1 && (
        <motion.div
          animate={indicatorStyle}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute bottom-0 h-0.5 bg-[hsl(var(--brand-yellow))] rounded-full"
        />
      )}
    </nav>
  );
}