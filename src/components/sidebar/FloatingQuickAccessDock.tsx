import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Importar assets locais para garantir que sempre funcionem
import pedidosNewIcon from "@/assets/icons/pedidos-marketplace-new-icon.png";
import estoqueNewIcon from "@/assets/estoque-icon-v2.png";
import canceladasComEnvioIcon from "@/assets/icons/canceladas-com-envio-icon.png";
import clientesNewIcon from "@/assets/oms-clientes-icon-v2.png";
import reclamacoesIcon from "@/assets/icons/reclamacoes-new-icon.png";
import devolucoesIcon from "@/assets/icons/devolucoes-venda-icon-new.png";
import visaoGeralIcon from "@/assets/icons/visao-geral-icon.png";
import dashboardVendasIcon from "@/assets/dashboard_vendas.png";
import dashboardEstoqueIcon from "@/assets/dashboard_estoque.png";
import dashboardAnalisesIcon from "@/assets/dashboard_analises.png";
import pedidosOmsNewIcon from "@/assets/oms-pedidos-icon-v2.png";
import vendedoresNewIcon from "@/assets/oms-vendedores-icon-v2.png";
import configuracoesOmsNewIcon from "@/assets/oms-configuracoes-icon-v2.png";
import composicoesIcon from "@/assets/composicoes.png";
import estoqueHistoricoNewIcon from "@/assets/historico-estoque-icon-v2.png";
import pedidosCompraNewIcon from "@/assets/pedidos-compra-icon-v2.png";
import cotacoesIcon from "@/assets/cotacoes.png";
import fornecedoresNewIcon from "@/assets/fornecedores-new-icon.png";
import importacaoIcon from "@/assets/icons/compras-importacao-new-icon.png";
import calendarioIcon from "@/assets/calendario.png";
import notasIcon from "@/assets/notas.png";
import scannerIcon from "@/assets/icons/scanner-icon.png";
import integracoesIcon from "@/assets/integracoes.png";
import anunciosIcon from "@/assets/anuncios.png";
import adminIcon from "@/assets/admin.png";
import usuariosIcon from "@/assets/usuarios.png";
import cargosIcon from "@/assets/cargos.png";
import convitesIcon from "@/assets/convites.png";
import alertasIcon from "@/assets/alertas.png";
import segurancaIcon from "@/assets/seguranca.png";
import auditoriaIcon from "@/assets/auditoria.png";
import perfilAdminIcon from "@/assets/perfil_admin.png";
import deParaIcon from "@/assets/de_para.png";
import historicoIcon from "@/assets/historico.png";

const STORAGE_KEY = 'dashboard-quick-shortcuts';

// Mapeamento de rotas para ícones locais
const ROUTE_TO_ICON: Record<string, string> = {
  '/dashboardinicial/visao-geral': visaoGeralIcon,
  '/dashboardinicial/vendas': dashboardVendasIcon,
  '/dashboardinicial/estoque': dashboardEstoqueIcon,
  '/dashboardinicial/analises': dashboardAnalisesIcon,
  '/pedidos': pedidosNewIcon,
  '/vendas-com-envio': canceladasComEnvioIcon,
  '/oms/pedidos': pedidosOmsNewIcon,
  '/oms/clientes': clientesNewIcon,
  '/oms/vendedores': vendedoresNewIcon,
  '/oms/configuracoes': configuracoesOmsNewIcon,
  '/estoque': estoqueNewIcon,
  '/estoque/composicoes': composicoesIcon,
  '/estoque/historico': estoqueHistoricoNewIcon,
  '/estoque/de-para': deParaIcon,
  '/devolucoesdevenda': devolucoesIcon,
  '/reclamacoes': reclamacoesIcon,
  '/compras/pedidos': pedidosCompraNewIcon,
  '/compras/cotacoes': cotacoesIcon,
  '/compras/fornecedores': fornecedoresNewIcon,
  '/compras/importacao': importacaoIcon,
  '/aplicativos/calendario': calendarioIcon,
  '/aplicativos/notas': notasIcon,
  '/aplicativos/scanner': scannerIcon,
  '/configuracoes/integracoes': integracoesIcon,
  '/configuracoes/anuncios': anunciosIcon,
  '/admin': adminIcon,
  '/admin/usuarios': usuariosIcon,
  '/admin/cargos': cargosIcon,
  '/admin/convites': convitesIcon,
  '/admin/alertas': alertasIcon,
  '/admin/seguranca': segurancaIcon,
  '/admin/perfil': perfilAdminIcon,
  '/historico': historicoIcon,
};

// Função para obter o ícone correto com fallback
function getValidIconUrl(shortcut: Service): string {
  // Primeiro: tentar mapear pela rota (sempre funciona com assets locais)
  const localIcon = ROUTE_TO_ICON[shortcut.href];
  if (localIcon) {
    return localIcon;
  }
  
  // Segundo: usar imageUrl se for um asset local válido (começa com /)
  if (shortcut.imageUrl && shortcut.imageUrl.startsWith('/')) {
    return shortcut.imageUrl;
  }
  
  // Terceiro: fallback para ícone genérico
  return visaoGeralIcon;
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
    name: 'Clientes',
    imageUrl: clientesNewIcon,
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

  // Glow effect state
  const id = useId().replace(/:/g, '');
  const [isHovered, setIsHovered] = useState(false);
  
  const filters = {
    unopaq: `unopaq-dock-${id}`,
    unopaq2: `unopaq2-dock-${id}`,
    unopaq3: `unopaq3-dock-${id}`,
  };

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
              "flex h-16 rounded-2xl bg-card backdrop-blur-md border-2 border-border shadow-xl overflow-visible",
              active ? "items-end gap-3 px-4 pb-3" : "items-center justify-center gap-0"
            )}
            animate={{
              width: active ? "auto" : 56,
              paddingLeft: active ? "1rem" : 0,
              paddingRight: active ? "1rem" : 0,
              paddingBottom: active ? "0.75rem" : 0,
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

            {/* Botão toggle com efeito glow rotativo */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="relative inline-block"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    {/* SVG Filters */}
                    <svg className="absolute w-0 h-0">
                      <filter id={filters.unopaq}>
                        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 3 0" />
                      </filter>
                      <filter id={filters.unopaq2}>
                        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 9 0" />
                      </filter>
                      <filter id={filters.unopaq3}>
                        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 0" />
                      </filter>
                    </svg>

                    {/* Backdrop */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        inset: '-1px',
                        background: 'hsl(var(--background))',
                      }}
                    />

                    {/* Button Container */}
                    <motion.div
                      className="relative w-10 h-10 flex items-center justify-center cursor-pointer"
                      style={{
                        filter: isHovered ? `url(#${filters.unopaq})` : 'none',
                      }}
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
                      {/* Outer Glow Layer */}
                      <div
                        className={cn(
                          "absolute inset-0 rounded-full overflow-hidden transition-opacity duration-300",
                          isHovered ? "opacity-100" : "opacity-0"
                        )}
                        style={{
                          filter: 'blur(4px)',
                        }}
                      >
                        <div
                          className="absolute rounded-full"
                          style={{
                            inset: '-100%',
                            background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary)/0.6), hsl(var(--primary)), hsl(var(--primary)/0.6), hsl(var(--primary)))',
                            animation: isHovered ? 'speen 4s linear infinite' : 'none',
                          }}
                        />
                      </div>

                      {/* Middle Glow Layer */}
                      <div
                        className={cn(
                          "absolute rounded-full overflow-hidden transition-opacity duration-300",
                          isHovered ? "opacity-100" : "opacity-0"
                        )}
                        style={{
                          inset: '1px',
                          filter: `blur(1.5px) url(#${filters.unopaq2})`,
                        }}
                      >
                        <div
                          className="absolute rounded-full"
                          style={{
                            inset: '-100%',
                            background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary)/0.4), hsl(var(--primary)), hsl(var(--primary)/0.4), hsl(var(--primary)))',
                            animation: isHovered ? 'speen 4s linear infinite' : 'none',
                          }}
                        />
                      </div>

                      {/* Button Border */}
                      <div
                        className="absolute rounded-full overflow-hidden"
                        style={{
                          inset: '2px',
                          filter: isHovered ? `url(#${filters.unopaq3})` : 'none',
                        }}
                      >
                        <div
                          className="absolute inset-0 rounded-full overflow-hidden"
                          style={{
                            background: 'hsl(var(--background))',
                          }}
                        >
                          {/* Inner Glow Layer */}
                          <div
                            className={cn(
                              "absolute rounded-full overflow-hidden transition-opacity duration-300",
                              isHovered ? "opacity-50" : "opacity-0"
                            )}
                            style={{
                              inset: '-1px',
                              filter: 'blur(6px)',
                            }}
                          >
                            <div
                              className="absolute rounded-full"
                              style={{
                                inset: '-100%',
                                background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary)/0.3), hsl(var(--primary)), hsl(var(--primary)/0.3), hsl(var(--primary)))',
                                animation: isHovered ? 'speen 4s linear infinite' : 'none',
                              }}
                            />
                          </div>

                          {/* Button Surface */}
                          <div
                            className="absolute inset-[3px] rounded-full flex items-center justify-center text-primary-foreground transition-all duration-300"
                            style={{
                              background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.85) 100%)',
                              boxShadow: isHovered 
                                ? 'inset 0 1px 2px hsl(var(--primary)/0.3), 0 2px 8px hsl(var(--primary)/0.4)'
                                : 'inset 0 1px 2px hsl(var(--primary)/0.2), 0 2px 4px hsl(var(--primary)/0.2)',
                            }}
                          >
                            {active ? (
                              <X 
                                size={24} 
                                strokeWidth={3} 
                              />
                            ) : (
                              <Plus 
                                size={24} 
                                strokeWidth={3} 
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <style>{`
                      @keyframes speen {
                        0% { transform: rotate(10deg); }
                        50% { transform: rotate(190deg); }
                        100% { transform: rotate(370deg); }
                      }
                    `}</style>
                  </div>
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
