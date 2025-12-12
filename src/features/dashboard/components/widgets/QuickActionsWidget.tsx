import { useState, useRef, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AddShortcutModal } from '@/components/dashboard/AddShortcutModal';
import { X, Plus } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useUserPreferences } from '@/hooks/useUserPreferences';
import pedidosNewIcon from "@/assets/icons/pedidos-marketplace-new-icon.png";
import estoqueNewIcon from "@/assets/estoque-icon-v2.png";
import canceladasComEnvioIcon from "@/assets/icons/canceladas-com-envio-icon.png";
import listaProdutosIcon from "@/assets/lista_produtos.png";
import clientesNewIcon from "@/assets/oms-clientes-icon-v2.png";
import reclamacoesIcon from "@/assets/icons/reclamacoes-icon.png";
import devolucoesIcon from "@/assets/icons/devolucoes-venda-icon.png";

const STORAGE_KEY = 'dashboard-quick-shortcuts';

// Mapeamento de rotas para ícones locais - fallback para URLs externas quebradas
const ROUTE_TO_ICON: Record<string, string> = {
  '/pedidos': pedidosNewIcon,
  '/estoque': estoqueNewIcon,
  '/vendas-com-envio': canceladasComEnvioIcon,
  '/apps/ecommerce/list': listaProdutosIcon,
  '/oms/clientes': clientesNewIcon,
  '/reclamacoes': reclamacoesIcon,
  '/devolucoesdevenda': devolucoesIcon,
};

// Função para obter ícone válido - SEMPRE prioriza mapeamento por rota
function getValidIconUrl(shortcut: Service): string {
  // PRIMEIRO: tentar mapear pela rota (sempre funciona com assets bundled)
  const localIcon = ROUTE_TO_ICON[shortcut.href];
  if (localIcon) {
    return localIcon;
  }
  
  // SEGUNDO: se imageUrl é um asset bundled válido (começa com /assets/ em produção)
  if (shortcut.imageUrl && shortcut.imageUrl.startsWith('/assets/')) {
    return shortcut.imageUrl;
  }
  
  // TERCEIRO: fallback para URL original (pode não funcionar)
  return shortcut.imageUrl || '';
}

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
    imageUrl: pedidosNewIcon,
    href: '/pedidos',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    name: 'Estoque',
    imageUrl: estoqueNewIcon,
    href: '/estoque',
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600'
  },
  {
    name: 'Canceladas com Envio',
    imageUrl: canceladasComEnvioIcon,
    href: '/vendas-com-envio',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  {
    name: 'Produtos',
    imageUrl: listaProdutosIcon,
    href: '/apps/ecommerce/list',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-600'
  },
  {
    name: 'Clientes',
    imageUrl: clientesNewIcon,
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
  const BASE_SIZE = 69;
  
  const distance = useTransform(mouseX, (val: number) => {
    // Quando mouseX é Infinity (estado inicial/sem hover), retornar valor alto
    // para que o transform calcule o tamanho base corretamente
    if (!isFinite(val)) return 1000;
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [BASE_SIZE, 104, BASE_SIZE]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const heightSync = useTransform(distance, [-150, 0, 150], [BASE_SIZE, 104, BASE_SIZE]);
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

        <img
          src={getValidIconUrl(item)}
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
  const BASE_SIZE = 69;
  
  const distance = useTransform(mouseX, (val: number) => {
    // Quando mouseX é Infinity (estado inicial/sem hover), retornar valor alto
    if (!isFinite(val)) return 1000;
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [BASE_SIZE, 104, BASE_SIZE]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const heightSync = useTransform(distance, [-150, 0, 150], [BASE_SIZE, 104, BASE_SIZE]);
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
  // Hook de sincronização automática com Supabase
  const { value: shortcuts, setValue: setShortcuts, isLoading } = useUserPreferences<Service[]>({
    preferenceKey: 'quick-shortcuts',
    defaultValue: DEFAULT_SHORTCUTS,
    localStorageKey: STORAGE_KEY // Compatibilidade com localStorage anterior
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const navigate = useNavigate();

  const handleAddShortcut = async (page: any) => {
    const newShortcut: Service = {
      name: page.label,
      imageUrl: page.imageUrl || 'https://img.icons8.com/fluency/96/documents.png',
      href: page.route,
      gradient: page.gradient,
      badge: page.badge
    };
    await setShortcuts([...shortcuts, newShortcut]);
    console.log('[QuickActionsWidget] ✅ Atalho adicionado:', newShortcut.name, 'imageUrl:', newShortcut.imageUrl);
  };

  const handleRemoveShortcut = async (index: number) => {
    console.log('[QuickActionsWidget] 🗑️ Removendo atalho:', shortcuts[index]?.name);
    const newShortcuts = shortcuts.filter((_, i) => i !== index);
    await setShortcuts(newShortcuts);
  };

  const existingIds = shortcuts.map((s) => {
    const route = s.href;
    return route.replace(/\//g, '-').substring(1);
  });

  // Exibir loading enquanto carrega preferências
  if (isLoading) {
    return (
      <section className="w-full overflow-visible">
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

  return (
    <>
      <style>{`
        .tooltip{opacity:0;transform:translateY(-6px);transition:opacity .2s, transform .2s}
        .group:hover .tooltip{opacity:1;transform:translateY(0)}
      `}</style>
      
      <section className="w-full overflow-visible">
        <div className="flex items-center justify-start overflow-visible">
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
            {/* Seção de Título - SEMPRE completo */}
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
