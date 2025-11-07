import { NavLink, useLocation } from "react-router-dom";
import { motion, Variants } from 'framer-motion';
import { Package, RefreshCcw, AlertCircle, ShoppingBag, Undo2 } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Package;
  preserveSearch?: boolean;
  gradient: string;
  iconColor: string;
}

const subNavItems: NavItem[] = [
  {
    path: "/pedidos",
    label: "Vendas",
    icon: Package,
    preserveSearch: true,
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "group-hover:text-blue-500 dark:group-hover:text-blue-400",
  },
  {
    path: "/ml-orders-completas",
    label: "Devoluções de Vendas",
    icon: RefreshCcw,
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "group-hover:text-orange-500 dark:group-hover:text-orange-400",
  },
  {
    path: "/reclamacoes",
    label: "Reclamações",
    icon: AlertCircle,
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "group-hover:text-red-500 dark:group-hover:text-red-400",
  },
  {
    path: "/vendas-online",
    label: "Vendas Online",
    icon: ShoppingBag,
    gradient: "radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(126,34,206,0.06) 50%, rgba(88,28,135,0) 100%)",
    iconColor: "group-hover:text-purple-500 dark:group-hover:text-purple-400",
  },
  {
    path: "/devolucoes-ml",
    label: "Devoluções ML",
    icon: Undo2,
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "group-hover:text-green-500 dark:group-hover:text-green-400",
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

export function MLOrdersNav() {
  const location = useLocation();

  return (
    <div className="w-full">
      <motion.nav
        className="w-full mx-auto px-4 py-3 rounded-2xl 
        bg-background/90 backdrop-blur-lg 
        border border-border/80 
        shadow-lg relative"
        initial="initial"
        whileHover="hover"
      >
        <ul className="flex items-center justify-center gap-3 relative z-10">
          {subNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const to = item.preserveSearch && location.pathname === '/pedidos'
              ? { pathname: item.path, search: location.search }
              : item.path;

            return (
              <motion.li key={item.path} className="relative">
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
                  <motion.div
                    variants={itemVariants}
                    transition={sharedTransition}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "center bottom"
                    }}
                  >
                    <NavLink
                      to={to}
                      className={`flex items-center justify-center gap-2 
                      px-4 py-2 relative z-10 
                      bg-transparent transition-colors rounded-2xl text-sm font-medium
                      ${isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      <span className={`transition-colors duration-300 ${item.iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  </motion.div>
                  {/* Back-facing */}
                  <motion.div
                    className="absolute inset-0 z-10"
                    variants={backVariants}
                    transition={sharedTransition}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "center top",
                      transform: "rotateX(90deg)"
                    }}
                  >
                    <NavLink
                      to={to}
                      className={`flex items-center justify-center gap-2 
                      px-4 py-2 
                      bg-transparent transition-colors rounded-2xl text-sm font-medium
                      ${isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      <span className={`transition-colors duration-300 ${item.iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  </motion.div>
                </motion.div>
              </motion.li>
            );
          })}
        </ul>
      </motion.nav>
    </div>
  );
}
