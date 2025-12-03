import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STORAGE_KEY = 'dashboard-quick-shortcuts';

interface Service {
  name: string;
  imageUrl: string;
  href: string;
  gradient: string;
  badge?: string;
}

const DEFAULT_SHORTCUTS: Service[] = [
  {
    name: 'Pedidos',
    imageUrl: 'https://img.icons8.com/fluency/96/shopping-cart.png',
    href: '/pedidos',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    name: 'Estoque',
    imageUrl: 'https://img.icons8.com/fluency/96/warehouse.png',
    href: '/estoque',
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600'
  },
  {
    name: 'Vendas Canceladas',
    imageUrl: 'https://img.icons8.com/fluency/96/online-store.png',
    href: '/vendas-canceladas',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  {
    name: 'Produtos',
    imageUrl: 'https://img.icons8.com/fluency/96/product.png',
    href: '/apps/ecommerce/list',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-600'
  },
  {
    name: 'Clientes',
    imageUrl: 'https://img.icons8.com/fluency/96/customer.png',
    href: '/oms/clientes',
    gradient: 'bg-gradient-to-br from-pink-500 to-rose-600'
  }
];

interface DockIconProps {
  item: Service;
  mouseX: any;
  onClick: () => void;
}

function DockIcon({ item, mouseX, onClick }: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [69, 104, 69]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const heightSync = useTransform(distance, [-150, 0, 150], [69, 104, 69]);
  const height = useSpring(heightSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsClicked(true)}
      onMouseUp={() => setIsClicked(false)}
      onClick={onClick}
      className="aspect-square cursor-pointer flex items-center justify-center relative group"
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-full h-full relative"
        animate={{
          y: isClicked ? 2 : isHovered ? -8 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-contain rounded-2xl"
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none"
          animate={{
            opacity: isHovered ? 0.3 : 0.1,
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* Badge */}
      {item.badge && (
        <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-semibold text-neutral-900 ring-1 ring-white/80 z-10">
          {item.badge}
        </span>
      )}

      {/* Tooltip */}
      <span className="tooltip pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-foreground/70 whitespace-nowrap sm:text-[11px]">
        {item.name}
      </span>

      {/* Active indicator */}
      <motion.div
        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white/80 rounded-full"
        animate={{
          scale: isClicked ? 1.5 : 1,
          opacity: isClicked ? 1 : 0.7,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      />
    </motion.div>
  );
}


interface FloatingQuickAccessDockProps {
  isSidebarCollapsed: boolean;
}

export function FloatingQuickAccessDock({ isSidebarCollapsed }: FloatingQuickAccessDockProps) {
  const [active, setActive] = useState(false);
  const [shortcuts, setShortcuts] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('[FloatingQuickAccessDock] Error loading shortcuts:', error);
    }
    return DEFAULT_SHORTCUTS;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const navigate = useNavigate();

  // Sync with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setShortcuts(JSON.parse(saved));
        }
      } catch (error) {
        console.error('[FloatingQuickAccessDock] Error syncing shortcuts:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event from the modal
    const handleShortcutsUpdate = (e: any) => {
      if (e.detail) {
        setShortcuts(e.detail);
      }
    };
    window.addEventListener('shortcuts-updated', handleShortcutsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('shortcuts-updated', handleShortcutsUpdate);
    };
  }, []);

  const handleRemoveShortcut = (index: number) => {
    const newShortcuts = shortcuts.filter((_, i) => i !== index);
    setShortcuts(newShortcuts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newShortcuts));
    } catch (error) {
      console.error('[FloatingQuickAccessDock] Error saving shortcuts:', error);
    }
  };

  return (
    <>
      <style>{`
        .tooltip{opacity:0;transform:translateY(-6px);transition:opacity .2s, transform .2s}
        .group:hover .tooltip{opacity:1;transform:translateY(0)}
      `}</style>
      
      <motion.div
        className={cn(
          "fixed bottom-6 z-50",
          "transition-all duration-300"
        )}
        animate={{
          left: isSidebarCollapsed ? '8px' : '20px'
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        <div className="flex items-center justify-center relative">
          {/* Dock container - expande quando ativo */}
          <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={cn(
              "flex h-24 rounded-3xl bg-card backdrop-blur-md border-2 border-border shadow-xl overflow-visible",
              active ? "items-end gap-4 px-6 pb-4" : "items-center justify-center gap-0"
            )}
            animate={{
              width: active ? "auto" : 80,
              paddingLeft: active ? "1.5rem" : 0,
              paddingRight: active ? "1.5rem" : 0,
              paddingBottom: active ? "1rem" : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
          >
            {/* Ícones dos atalhos - apenas visíveis quando expandido */}
            {shortcuts.map((service, index) => (
              <motion.div
                key={index}
                className="relative z-50"
                animate={{
                  filter: active ? "blur(0px)" : "blur(2px)",
                  scale: active ? 1 : 0.9,
                  rotate: active ? 0 : 45,
                  opacity: active ? 1 : 0,
                  width: active ? "auto" : 0,
                }}
                transition={{
                  type: "tween",
                  ease: "easeIn",
                  duration: 0.4,
                }}
                style={{
                  display: active ? "block" : "none"
                }}
              >
                <DockIcon
                  item={service}
                  mouseX={mouseX}
                  onClick={() => {
                    navigate(service.href);
                    setActive(false);
                  }}
                />
              </motion.div>
            ))}

            {/* Botão toggle - sempre visível, muda entre + e X */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className={cn(
                      "size-16 rounded-full flex items-center justify-center flex-shrink-0",
                      "bg-primary hover:bg-primary/90 transition-colors shadow-xl"
                    )}
                    onClick={() => setActive(!active)}
                    animate={{ 
                      rotate: active ? 180 : 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={{
                        rotate: active ? 0 : 0,
                      }}
                    >
                      {active ? (
                        <X 
                          size={24} 
                          strokeWidth={3} 
                          className="text-primary-foreground" 
                        />
                      ) : (
                        <Plus 
                          size={24} 
                          strokeWidth={3} 
                          className="text-primary-foreground" 
                        />
                      )}
                    </motion.div>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right" className="z-[60]">
                  <p>Acesso Rápido</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
