import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarState } from '../hooks/useSidebarState';
import { useActiveRoute } from '../hooks/useActiveRoute';
import { SidebarItemWithChildren } from './SidebarItemWithChildren';
import { /* Tooltip, TooltipContent, TooltipTrigger, */ TooltipProvider } from '@/components/ui/tooltip';
import { NavSection, NavItem } from '../types/sidebar.types';
import { Logo } from '@/components/ui/Logo';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface EnhancedSidebarProps {
  navItems: NavSection[];
  isMobile?: boolean;
  onMobileClose?: () => void;
  isCollapsed?: boolean; // Allow external control from SidebarUIProvider
}

const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Package;
};

// Memoized single item component
const SidebarSingleItem = memo(({ 
  item, 
  isCollapsed, 
  isMobile, 
  isActive 
}: { 
  item: NavItem; 
  isCollapsed: boolean; 
  isMobile: boolean; 
  isActive: (path: string) => boolean;
}) => {
  const Icon = getIconComponent(item.icon);
  const itemActive = item.path ? isActive(item.path) : false;
  
  // Debug log para single items
  if (itemActive) {
    console.log(`🎯 Single item "${item.label}" está ativo na rota: ${item.path}`);
  }

  const link = (
    <NavLink
      to={item.path || '#'}
      className={cn(
        'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 focus:bg-[hsl(var(--accent))]/50',
        'hover:bg-gradient-to-r hover:from-[hsl(var(--accent))]/50 hover:to-[hsl(var(--accent))]/30',
        'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
        itemActive
          ? 'bg-gradient-to-r from-[hsl(var(--brand-yellow))] to-[hsl(var(--brand-yellow-glow))] text-[hsl(var(--brand-yellow-foreground))] shadow-lg shadow-[hsl(var(--brand-yellow))]/25'
          : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--foreground))]'
      )}
    >
      <Icon className={cn(
        "shrink-0 transition-all duration-200",
        !isMobile && isCollapsed ? "h-5 w-5" : "h-5 w-5",
        itemActive 
          ? "text-[hsl(var(--brand-yellow-foreground))] drop-shadow-sm" 
          : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]"
      )} />
      <span className={cn(
        'truncate transition-opacity duration-200',
        !isMobile && isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100',
        itemActive && 'text-[hsl(var(--brand-yellow-foreground))]'
      )}>
        {item.label}
      </span>
      
      {/* Badge */}
      {item.badge && (
        <span className={cn(
          'ml-auto px-1.5 py-0.5 text-xs rounded-full shrink-0',
          !isMobile && isCollapsed ? 'absolute -top-1 -right-1 ml-0' : '',
          {
            'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]': item.badge.variant === 'default',
            'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]': item.badge.variant === 'destructive',
            'bg-yellow-500 text-yellow-50': item.badge.variant === 'warning',
            'bg-green-500 text-green-50': item.badge.variant === 'success'
          }
        )}>
          {item.badge.content}
        </span>
      )}

      {/* Active indicator when collapsed */}
      {!isMobile && isCollapsed && itemActive && (
        <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--primary))] shrink-0" />
      )}
    </NavLink>
  );

  // For solo items (no children), create consistent sizing when collapsed
  return !isMobile && isCollapsed ? (
    <div title={item.label} className="flex justify-center">
      <NavLink 
        to={item.path || '#'}
        className={cn(
          "relative h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/10",
          itemActive 
            ? "bg-gradient-to-br from-[hsl(var(--brand-yellow))] to-[hsl(var(--brand-yellow-glow))] text-[hsl(var(--brand-yellow-foreground))] shadow-lg shadow-[hsl(var(--brand-yellow))]/30"
            : "bg-transparent hover:border-[hsl(var(--primary))] hover:border-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] shadow-sm"
        )}
      >
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-colors duration-200",
          itemActive ? "text-[hsl(var(--brand-yellow-foreground))]" : "text-current"
        )} />
        {/* Active indicator when collapsed - mais visível */}
        {itemActive && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[hsl(var(--primary))] animate-pulse border-2 border-[hsl(var(--background))]" />
        )}
        {/* Badge for collapsed single items */}
        {item.badge && (
          <span className={cn(
            'absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium rounded-full',
            {
              'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]': item.badge.variant === 'default',
              'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]': item.badge.variant === 'destructive',
              'bg-yellow-500 text-yellow-50': item.badge.variant === 'warning',
              'bg-green-500 text-green-50': item.badge.variant === 'success'
            }
          )}>
            {item.badge.content}
          </span>
        )}
      </NavLink>
    </div>
  ) : (
    link
  );
});

SidebarSingleItem.displayName = 'SidebarSingleItem';

// Memoized section component
const SidebarSection = memo(({ 
  section, 
  isCollapsed, 
  isMobile, 
  sidebarState, 
  actions, 
  utils 
}: {
  section: NavSection;
  isCollapsed: boolean;
  isMobile: boolean;
  sidebarState: any;
  actions: any;
  utils: any;
}) => {
  const { hasActiveChild, isActive } = useActiveRoute([section]);

  return (
    <div key={section.id}>
      {/* Section Label */}
      <div className={cn(
        'transition-opacity duration-200 mb-3',
        !isMobile && isCollapsed ? 'opacity-0 pointer-events-none h-0' : 'opacity-100'
      )}>
        <h2 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
          {section.group}
        </h2>
      </div>

      {/* Section Items */}
      <div className="space-y-1">
        {section.items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            return (
              <SidebarItemWithChildren
                key={item.id || item.label}
                item={item}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
                pointerType={utils.getPointerType()}
                calculateFlyoutPosition={utils.calculateFlyoutPosition}
              />
            );
          }

          return (
            <SidebarSingleItem
              key={item.id || item.path || item.label}
              item={item}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              isActive={isActive}
            />
          );
        })}
      </div>
    </div>
  );
});

SidebarSection.displayName = 'SidebarSection';

// Main sidebar content component
const SidebarContent = memo(({ 
  navItems, 
  isMobile = false, 
  onMobileClose,
  externalIsCollapsed 
}: { 
  navItems: NavSection[]; 
  isMobile?: boolean; 
  onMobileClose?: () => void;
  externalIsCollapsed?: boolean;
}) => {
  const { state, actions, utils } = useSidebarState();
  const { hasPermission } = useUserPermissions();
  // Use external collapsed state if provided (from SidebarUIProvider)
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : (!isMobile && state.expanded === false);

  // Map route paths to permission keys
  const getPermissionForPath = (path?: string): string | null => {
    if (!path) return null;
    
    // Dashboard permissions
    if (path === '/' || path.startsWith('/dashboardinicial')) return 'dashboard:view';
    if (path.startsWith('/dashboard/vendas')) return 'vendas:read';
    if (path.startsWith('/dashboard/estoque')) return 'estoque:view';
    if (path.startsWith('/dashboard/financeiro')) return 'vendas:view_pii';
    
    // OMS/Vendas permissions - mapeamento atualizado
    if (path.startsWith('/pedidos')) return 'pedidos:marketplace';
    if (path.startsWith('/oms/pedidos')) return 'oms:pedidos';
    if (path.startsWith('/oms/clientes')) return 'oms:clientes';
    if (path.startsWith('/oms/configuracoes')) return 'oms:configuracoes';
    
    // Compras permissions
    if (path.startsWith('/compras/pedidos')) return 'compras:view';
    if (path.startsWith('/compras/cotacoes')) return 'compras:view';
    if (path.startsWith('/compras/fornecedores')) return 'compras:view';
    if (path.startsWith('/compras/importacao')) return 'compras:view';
    
    // Aplicações permissions
    if (path.startsWith('/apps/ecommerce')) return 'ecommerce:view';
    if (path.startsWith('/aplicativos/calendario')) return 'calendar:view';
    if (path.startsWith('/aplicativos/notas')) return 'notes:view';
    if (path.startsWith('/estoque')) return 'estoque:view';
    if (path.startsWith('/scanner')) return 'scanner:use';
    if (path.startsWith('/de-para')) return 'depara:view';
    if (path.startsWith('/alertas')) return 'alerts:view';
    if (path.startsWith('/historico')) return 'historico:view';
    
    // Configurações permissions
    if (path.startsWith('/configuracoes/integracoes')) return 'integrations:read';
    if (path.startsWith('/configuracoes/anuncios')) return 'system:announce';
    if (path.startsWith('/configuracoes/administracao')) return 'admin:access';
    if (path.startsWith('/ml-orders-completas')) return 'integrations:manage';
    
    // Admin permissions
    if (path.startsWith('/admin')) return 'admin:access';
    
    // Demo permissions
    if (path.startsWith('/_demo') || path.startsWith('/theme-pages') || path.startsWith('/widgets') || path.startsWith('/icons')) return 'demo:access';
    
    return null;
  };

  // Recursively filter items by permission
  const filterItems = (items: NavItem[]): NavItem[] => {
    const result: NavItem[] = [];
    for (const item of items) {
      const children = item.children ? filterItems(item.children) : undefined;
      const required = getPermissionForPath(item.path);
      const visible = required ? hasPermission(required) : true;
      if (children && children.length > 0) {
        result.push({ ...item, children });
      } else if (visible) {
        result.push({ ...item, children: undefined });
      }
    }
    return result;
  };

  const filteredNav = navItems
    .map((section) => ({
      ...section,
      items: filterItems(section.items)
    }))
    .filter((section) => section.items.length > 0);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            {/* Logo sempre do mesmo tamanho, independente do estado collapsed */}
            <div className="flex-shrink-0">
              <Logo size="md" />
            </div>
            <div className={cn(
              'transition-opacity duration-200',
              !isMobile && isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
            )}>
              <h1 className="text-lg font-bold text-[hsl(var(--foreground))] truncate">REISTOQ</h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">Admin Dashboard</p>
            </div>
            
            {/* Mobile close button */}
            {isMobile && onMobileClose && (
              <button
                onClick={onMobileClose}
                className="ml-auto p-1.5 rounded-md hover:bg-[hsl(var(--accent))] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                aria-label="Fechar menu"
              >
                <LucideIcons.X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav 
          className="p-4 space-y-6 flex-1 overflow-y-auto"
          role="navigation"
          aria-label="Navegação principal"
        >
          {filteredNav.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              sidebarState={state}
              actions={actions}
              utils={utils}
            />
          ))}
        </nav>
      </div>
    </TooltipProvider>
  );
});

SidebarContent.displayName = 'SidebarContent';

export const EnhancedSidebar = memo(({ navItems, isMobile, onMobileClose, isCollapsed: externalIsCollapsed }: EnhancedSidebarProps) => {
  const { state } = useSidebarState();
  
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-[hsl(var(--background))] overflow-y-auto">
        <SidebarContent 
          navItems={navItems} 
          isMobile={true} 
          onMobileClose={onMobileClose} 
        />
      </div>
    );
  }

  // Use external collapsed state if provided, otherwise use internal state
  const collapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : !state.expanded;
  const desktopWidth = collapsed ? "md:w-[72px]" : "md:w-72";

  return (
    <aside className={cn(
      "fixed top-0 left-0 h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] z-40",
      "transition-[width] duration-200 overflow-y-auto", 
      desktopWidth
    )}>
      <SidebarContent navItems={navItems} isMobile={false} externalIsCollapsed={externalIsCollapsed} />
    </aside>
  );
});

EnhancedSidebar.displayName = 'EnhancedSidebar';