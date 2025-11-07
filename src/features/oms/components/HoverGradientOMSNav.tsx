import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Users, Settings, Store, UserCheck } from "lucide-react";

interface HoverGradientMenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
  preserveSearch?: boolean;
}

const menuItems: HoverGradientMenuItem[] = [
  { 
    icon: <Store className="h-5 w-5" />, 
    label: "Vendas Marketplace", 
    href: "/pedidos", 
    gradient: "radial-gradient(circle, hsl(210,73%,35%,0.15) 0%, hsl(210,73%,25%,0.06) 50%, hsl(210,73%,15%,0) 100%)", 
    iconColor: "group-hover:text-[hsl(210,73%,55%)]",
    preserveSearch: true 
  },
  { 
    icon: <ShoppingCart className="h-5 w-5" />, 
    label: "Vendas Direta/Atacado", 
    href: "/oms/pedidos", 
    gradient: "radial-gradient(circle, hsl(210,73%,35%,0.15) 0%, hsl(210,73%,25%,0.06) 50%, hsl(210,73%,15%,0) 100%)", 
    iconColor: "group-hover:text-[hsl(210,73%,55%)]" 
  },
  { 
    icon: <Users className="h-5 w-5" />, 
    label: "Clientes", 
    href: "/oms/clientes", 
    gradient: "radial-gradient(circle, hsl(210,73%,35%,0.15) 0%, hsl(210,73%,25%,0.06) 50%, hsl(210,73%,15%,0) 100%)", 
    iconColor: "group-hover:text-[hsl(210,73%,55%)]" 
  },
  { 
    icon: <UserCheck className="h-5 w-5" />, 
    label: "Vendedores", 
    href: "/oms/vendedores", 
    gradient: "radial-gradient(circle, hsl(210,73%,35%,0.15) 0%, hsl(210,73%,25%,0.06) 50%, hsl(210,73%,15%,0) 100%)", 
    iconColor: "group-hover:text-[hsl(210,73%,55%)]" 
  },
  { 
    icon: <Settings className="h-5 w-5" />, 
    label: "Configurações", 
    href: "/oms/configuracoes", 
    gradient: "radial-gradient(circle, hsl(210,73%,35%,0.15) 0%, hsl(210,73%,25%,0.06) 50%, hsl(210,73%,15%,0) 100%)", 
    iconColor: "group-hover:text-[hsl(210,73%,55%)]" 
  },
];

// Animation variants
const itemVariants: Variants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants: Variants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
};

const sharedTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

export function HoverGradientOMSNav(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (item: HoverGradientMenuItem) => (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (item.preserveSearch && location.pathname === '/pedidos') {
      navigate({ pathname: item.href, search: location.search });
    } else {
      navigate(item.href);
    }
  };

  return (
    <motion.nav
      className="w-fit mx-auto px-4 py-2 rounded-3xl 
      bg-[hsl(210,73%,15%)]/90 dark:bg-[hsl(210,73%,15%)]/80 backdrop-blur-lg 
      border border-[hsl(210,73%,25%)]/50 
      shadow-lg relative"
      initial="initial"
      whileHover="hover"
    >
      <ul className="flex items-center justify-center gap-3 relative z-10">
        {menuItems.map((item: HoverGradientMenuItem) => {
          const isActive = location.pathname === item.href;
          
          return (
            <motion.li key={item.label} className="relative">
              <motion.div
                className="block rounded-2xl overflow-visible group relative"
                style={{ perspective: "600px" }}
                whileHover="hover"
                initial="initial"
              >
                {/* Per-item glow */}
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none rounded-2xl"
                  variants={glowVariants}
                  style={{
                    background: item.gradient,
                    opacity: 0,
                  }}
                />
                {/* Front-facing */}
                <motion.a
                  href={item.href}
                  onClick={handleNavigate(item)}
                  className={`flex flex-row items-center justify-center gap-2 
                  px-4 py-2 relative z-10 
                  bg-transparent transition-colors rounded-2xl text-sm
                  ${isActive 
                    ? 'text-white font-semibold' 
                    : 'text-gray-400 group-hover:text-white'
                  }`}
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center bottom"
                  }}
                >
                  <span className={`transition-colors duration-300 ${isActive ? '' : item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </motion.a>
                {/* Back-facing */}
                <motion.a
                  href={item.href}
                  onClick={handleNavigate(item)}
                  className={`flex flex-row items-center justify-center gap-2 
                  px-4 py-2 absolute inset-0 z-10 
                  bg-transparent transition-colors rounded-2xl text-sm
                  ${isActive 
                    ? 'text-white font-semibold' 
                    : 'text-gray-400 group-hover:text-white'
                  }`}
                  variants={backVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center top",
                    transform: "rotateX(90deg)"
                  }}
                >
                  <span className={`transition-colors duration-300 ${isActive ? '' : item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </motion.a>
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
