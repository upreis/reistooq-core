import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarState } from '../hooks/useSidebarState';
import { useActiveRoute } from '../hooks/useActiveRoute';
import { SidebarItemWithChildren } from './SidebarItemWithChildren';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { NavSection, NavItem } from '../types/sidebar.types';
import { Logo } from '@/components/ui/Logo';

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

  const link = (
    <NavLink
      to={item.path || '#'}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
        itemActive
          ? 'bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] [&_svg]:text-[hsl(var(--brand-yellow-foreground))]'
          : 'hover:bg-[hsl(var(--interactive-hover))] hover:text-[hsl(var(--foreground))]'
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", itemActive && "text-[hsl(var(--brand-yellow-foreground))]")} />
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

  // For solo items (no children), use Tooltip when collapsed
  return !isMobile && isCollapsed ? (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        {link}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {item.label}
      </TooltipContent>
    </Tooltip>
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
  // Use external collapsed state if provided (from SidebarUIProvider)
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : (!isMobile && state.expanded === false);

  return (
    <TooltipProvider delayDuration={150} disableHoverableContent>
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
          {navItems.map((section) => (
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
      "hidden md:flex md:flex-col md:shrink-0 bg-[hsl(var(--background))] border-r border-[hsl(var(--border))]",
      "transition-[width] duration-200 overflow-visible", // changed from overflow-y-auto to overflow-visible
      desktopWidth
    )}>
      <SidebarContent navItems={navItems} isMobile={false} externalIsCollapsed={externalIsCollapsed} />
    </aside>
  );
});

EnhancedSidebar.displayName = 'EnhancedSidebar';