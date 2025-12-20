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
    label: "Marketplace", 
    href: "/pedidos", 
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)", 
    iconColor: "group-hover:text-blue-500 dark:group-hover:text-blue-400",
    preserveSearch: true 
  },
  { 
    icon: <ShoppingCart className="h-5 w-5" />, 
    label: "Atacado", 
    href: "/oms/pedidos", 
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)", 
    iconColor: "group-hover:text-orange-500 dark:group-hover:text-orange-400" 
  },
  { 
    icon: <Users className="h-5 w-5" />, 
    label: "Cadastro", 
    href: "/oms/cadastro", 
    gradient: "radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(126,34,206,0.06) 50%, rgba(88,28,135,0) 100%)", 
    iconColor: "group-hover:text-purple-500 dark:group-hover:text-purple-400" 
  },
  { 
    icon: <Settings className="h-5 w-5" />, 
    label: "Configurações", 
    href: "/oms/configuracoes", 
    gradient: "radial-gradient(circle, rgba(161,98,7,0.15) 0%, rgba(133,77,14,0.06) 50%, rgba(100,62,8,0) 100%)", 
    iconColor: "group-hover:text-amber-600 dark:group-hover:text-amber-400" 
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
      bg-[hsl(30,25%,92%)]/95 border-[hsl(30,20%,80%)]/60
      dark:bg-[hsl(30,40%,18%)]/80 dark:border-[hsl(30,40%,12%)]/50
      backdrop-blur-lg border shadow-lg relative"
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
                    ? 'text-primary font-semibold' 
                    : 'text-muted-foreground group-hover:text-foreground'
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
                  <span className="font-bold">{item.label}</span>
                </motion.a>
                {/* Back-facing */}
                <motion.a
                  href={item.href}
                  onClick={handleNavigate(item)}
                  className={`flex flex-row items-center justify-center gap-2 
                  px-4 py-2 absolute inset-0 z-10 
                  bg-transparent transition-colors rounded-2xl text-sm
                  ${isActive 
                    ? 'text-primary font-semibold' 
                    : 'text-muted-foreground group-hover:text-foreground'
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
                  <span className="font-bold">{item.label}</span>
                </motion.a>
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
