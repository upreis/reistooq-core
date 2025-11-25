import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AddShortcutModal } from '@/components/dashboard/AddShortcutModal';
import { X, Plus, ShoppingCart, Warehouse, Store, Package, Users, LucideIcon } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = 'dashboard-quick-shortcuts';

interface Service {
  name: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  badge?: string;
}

const DEFAULT_SHORTCUTS: Service[] = [
  {
    name: 'Pedidos',
    icon: ShoppingCart,
    href: '/pedidos',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    name: 'Estoque',
    icon: Warehouse,
    href: '/estoque',
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600'
  },
  {
    name: 'Vendas Online',
    icon: Store,
    href: '/vendas-online',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  {
    name: 'Produtos',
    icon: Package,
    href: '/apps/ecommerce/list',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-600'
  },
  {
    name: 'Clientes',
    icon: Users,
    href: '/oms/clientes',
    gradient: 'bg-gradient-to-br from-pink-500 to-rose-600'
  }
];

interface DockIconProps {
  item: Service;
  mouseX: any;
  onRemove: () => void;
  onClick: () => void;
}

function DockIcon({ item, mouseX, onRemove, onClick }: DockIconProps) {
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

  // Garantir que sempre temos um ícone válido com debug
  console.log('[DockIcon] Item:', item.name, 'Icon type:', typeof item.icon, 'Icon:', item.icon);
  const IconComponent = (item.icon && typeof item.icon === 'function') ? item.icon : Package;
  console.log('[DockIcon] IconComponent final:', IconComponent);

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsClicked(true)}
      onMouseUp={() => setIsClicked(false)}
      onClick={onClick}
      className="aspect-square cursor-pointer flex items-center justify-center relative group z-50"
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
        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 z-10 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-destructive/90"
          aria-label="Remover atalho"
        >
          <X className="h-3 w-3" />
        </button>

        {/* Ícone do lucide-react com gradiente de fundo */}
        <div className={`w-full h-full rounded-2xl ${item.gradient} flex items-center justify-center`}>
          <IconComponent className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none"
          animate={{
            opacity: isHovered ? 0.3 : 0.1,
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* Badge de notificação */}
      {item.badge && (
        <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-semibold text-neutral-900 ring-1 ring-white/80 sm:h-5 sm:w-5 sm:text-[10px] z-10">
          {item.badge}
        </span>
      )}

      {/* Tooltip */}
      <span className="tooltip pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-foreground/70 whitespace-nowrap sm:text-[11px]">
        {item.name}
      </span>

      {/* Active indicator dot */}
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

function AddDockIcon({ mouseX, onClick }: { mouseX: any; onClick: () => void }) {
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
      className="aspect-square cursor-pointer flex items-center justify-center relative group z-50"
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-full h-full rounded-2xl shadow-lg flex items-center justify-center text-muted-foreground relative overflow-hidden bg-muted/50 border-2 border-muted"
        animate={{
          y: isClicked ? 2 : isHovered ? -8 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
      >
        <motion.div
          animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 17,
          }}
        >
          <Plus className="w-8 h-8" />
        </motion.div>
      </motion.div>

      {/* Tooltip */}
      <span className="tooltip pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-foreground/70 whitespace-nowrap sm:text-[11px]">
        Adicionar
      </span>
    </motion.div>
  );
}

export const QuickActionsWidget = () => {
  const [shortcuts, setShortcuts] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('[QuickActionsWidget] 🔍 Raw saved data:', saved);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[QuickActionsWidget] 📦 Parsed data:', parsed);
        
        // Verificar se a estrutura está desatualizada (usando imageUrl ao invés de icon)
        const hasOldStructure = parsed.some((item: any) => 'imageUrl' in item);
        if (hasOldStructure) {
          console.log('[QuickActionsWidget] 🔄 Old structure detected (imageUrl), clearing and using defaults');
          localStorage.removeItem(STORAGE_KEY);
          return DEFAULT_SHORTCUTS;
        }
        
        // Remapear ícones pois funções não são serializáveis em JSON
        const remapped = parsed.map((shortcut: any) => {
          // Tentar encontrar o ícone padrão pelo nome
          const defaultShortcut = DEFAULT_SHORTCUTS.find(d => d.name === shortcut.name);
          console.log(`[QuickActionsWidget] 🔄 Remapping "${shortcut.name}":`, {
            found: !!defaultShortcut,
            icon: defaultShortcut?.icon,
            iconType: typeof defaultShortcut?.icon
          });
          
          return {
            ...shortcut,
            icon: defaultShortcut?.icon || Package // fallback para Package
          };
        });
        
        console.log('[QuickActionsWidget] ✅ Final remapped shortcuts:', remapped);
        return Array.isArray(remapped) ? remapped : DEFAULT_SHORTCUTS;
      }
    } catch (error) {
      console.error('[QuickActionsWidget] ❌ Error loading shortcuts:', error);
    }
    console.log('[QuickActionsWidget] 📋 Using default shortcuts');
    return DEFAULT_SHORTCUTS;
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const navigate = useNavigate();
  const isFirstRenderRef = useRef(true);

  // Salva apenas quando shortcuts mudar (não na montagem inicial)
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
      console.log('[QuickActionsWidget] ✅ Shortcuts salvos:', shortcuts.length, shortcuts.map(s => s.name));
    } catch (error) {
      console.error('[QuickActionsWidget] ❌ Error saving shortcuts:', error);
    }
  }, [shortcuts]);

  const handleAddShortcut = (page: any) => {
    // Extrair o componente de ícone corretamente
    let iconComponent: LucideIcon = Package; // fallback padrão
    
    if (page.icon) {
      // Se page.icon já é um componente React válido
      if (typeof page.icon === 'function') {
        iconComponent = page.icon as LucideIcon;
      }
      // Se page.icon tem a propriedade type (componente React)
      else if (page.icon.type && typeof page.icon.type === 'function') {
        iconComponent = page.icon.type as LucideIcon;
      }
    }
    
    const newShortcut: Service = {
      name: page.label,
      icon: iconComponent,
      href: page.route,
      gradient: page.gradient || 'bg-gradient-to-br from-gray-500 to-gray-600',
      badge: page.badge
    };
    setShortcuts([...shortcuts, newShortcut]);
  };

  const handleRemoveShortcut = (index: number) => {
    console.log('[QuickActionsWidget] 🗑️ Removendo atalho:', shortcuts[index]?.name);
    const newShortcuts = shortcuts.filter((_, i) => i !== index);
    setShortcuts(newShortcuts);
  };

  const existingIds = shortcuts.map((s) => {
    const route = s.href;
    return route.replace(/\//g, '-').substring(1);
  });

  return (
    <>
      <style>{`
        .tooltip{opacity:0;transform:translateY(-6px);transition:opacity .2s, transform .2s}
        .group:hover .tooltip{opacity:1;transform:translateY(0)}
      `}</style>
      
      <section className="w-full overflow-visible">
        <div className="flex items-center justify-end overflow-visible">
          <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="flex h-24 items-center gap-0 rounded-3xl bg-background backdrop-blur-md border-2 border-border shadow-xl overflow-visible"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
          >
            {/* Seção de Título */}
            <div className="flex items-center justify-center px-6 h-full border-r-2 border-border my-3 min-w-[160px]">
              <div className="space-y-0.5">
                <h1 className="text-base font-bold whitespace-nowrap">
                  Acesso Rápido
                </h1>
                <p className="text-[11px] text-muted-foreground leading-tight whitespace-nowrap">
                  Acesse rapidamente
                  <br />
                  suas páginas favoritas
                </p>
              </div>
            </div>

            {/* Seção de Ícones */}
            <div className="flex items-center gap-4 px-6 pb-3 pt-3">
            {shortcuts.map((service, index) => (
              <DockIcon
                key={index}
                item={service}
                mouseX={mouseX}
                onRemove={() => handleRemoveShortcut(index)}
                onClick={() => navigate(service.href)}
              />
            ))}
            
            <AddDockIcon
              mouseX={mouseX}
              onClick={() => setIsModalOpen(true)}
            />
            </div>
          </motion.div>
        </div>
      </section>

      <AddShortcutModal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsModalOpen(false);
        }}
        onAddShortcut={handleAddShortcut}
        existingShortcutIds={existingIds}
      />
    </>
  );
};
