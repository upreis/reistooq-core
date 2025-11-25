import React, { memo, useRef, useCallback, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavItem } from '../types/sidebar.types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { getIconComponent, isRouteActive } from '../utils/sidebar-utils';

interface SidebarItemWithChildrenProps {
  item: NavItem;
  isCollapsed: boolean;
  isMobile: boolean;
}

export const SidebarItemWithChildren = memo(({
  item,
  isCollapsed,
  isMobile
}: SidebarItemWithChildrenProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleGroup, openGroup, isGroupOpen, openGroups } = useSidebarUI();
  
  const Icon = getIconComponent(item.icon);
  
  // Check if this item has active children
  const hasActiveChild = item.children?.some(child => 
    child.path && isRouteActive(location.pathname, child.path)
  ) ?? false;

  // Check if this group is open
  const isOpen = isGroupOpen(item.id);
  
  // Auto-expand group when child is active
  useEffect(() => {
    if (hasActiveChild && !isOpen) {
      openGroup(item.id);
    }
  }, [hasActiveChild, isOpen, item.id, openGroup]);

  const handleParentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const firstChild = item.children?.[0];
    if (firstChild?.path) {
      navigate(firstChild.path);
    }
  }, [item.children, navigate]);

  const handleChevronClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleGroup(item.id);
  }, [item.id, toggleGroup]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleParentClick(e as any);
    }
    if (e.key === 'ArrowRight' && !isCollapsed && !isOpen) {
      openGroup(item.id);
    }
  }, [handleParentClick, isCollapsed, isOpen, openGroup, item.id]);

  const button = (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleParentClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className={cn(
          'group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 focus:bg-[hsl(var(--accent))]/50',
          'hover:bg-gradient-to-r hover:from-[hsl(var(--accent))]/50 hover:to-[hsl(var(--accent))]/30',
          'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
          hasActiveChild
            ? 'bg-gradient-to-r from-[hsl(var(--brand-yellow))] to-[hsl(var(--brand-yellow-glow))] text-[hsl(var(--brand-yellow-foreground))] shadow-lg shadow-[hsl(var(--brand-yellow))]/25'
            : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--foreground))]'
        )}
        aria-expanded={!isCollapsed ? isOpen : undefined}
        aria-haspopup="true"
        aria-controls={!isCollapsed ? `submenu-${item.id}` : undefined}
      >
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-all duration-200", 
          hasActiveChild ? "text-[hsl(var(--brand-yellow-foreground))] drop-shadow-sm" : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]"
        )} />
        
        {/* Label com tipografia melhorada */}
        <span className={cn(
          'font-medium truncate transition-all duration-200',
          !isMobile && isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100',
          hasActiveChild ? 'text-[hsl(var(--brand-yellow-foreground))] font-semibold' : 'text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--foreground))]'
        )}>
          {item.label}
        </span>

        {/* Badge melhorado */}
        {item.badge && (
          <span className={cn(
            'ml-auto px-2 py-1 text-xs font-semibold rounded-full shrink-0 shadow-sm',
            !isMobile && isCollapsed ? 'absolute -top-1 -right-1 ml-0' : '',
            {
              'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]': item.badge.variant === 'default',
              'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]': item.badge.variant === 'destructive',
              'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]': item.badge.variant === 'warning',
              'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]': item.badge.variant === 'success'
            }
          )}>
            {item.badge.content}
          </span>
        )}

        {/* Indicador ativo melhorado - sempre visível quando collapsed e tem filho ativo */}
        {!isMobile && isCollapsed && hasActiveChild && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[hsl(var(--primary))] shrink-0 animate-pulse border-2 border-[hsl(var(--background))]" />
        )}
      </button>
      
      {/* Chevron separado - fora do botão principal */}
      {!isCollapsed && (
        <div
          onClick={handleChevronClick}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[hsl(var(--accent))] transition-all cursor-pointer'
          )}
          aria-label={isOpen ? 'Recolher' : 'Expandir'}
        >
          <ChevronDown className={cn(
            'h-4 w-4 transition-all duration-300',
            isOpen ? 'rotate-180 text-[hsl(var(--primary))]' : 'rotate-0',
            hasActiveChild ? 'text-[hsl(var(--brand-yellow-foreground))]' : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]'
          )} />
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Collapsed: Use Tooltip instead of HoverCard */}
      {!isMobile && isCollapsed ? (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                ref={buttonRef}
                onClick={handleParentClick}
                onKeyDown={handleKeyDown}
                type="button"
                className={cn(
                  'h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 p-1',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20',
                  'hover:shadow-lg hover:scale-105 active:scale-95',
                  'backdrop-blur-sm border border-white/10',
                  hasActiveChild 
                    ? 'bg-gradient-to-br from-[hsl(var(--brand-yellow))] to-[hsl(var(--brand-yellow-glow))] text-[hsl(var(--brand-yellow-foreground))] shadow-lg shadow-[hsl(var(--brand-yellow))]/30'
                    : 'bg-transparent hover:border-[hsl(var(--primary))] hover:border-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] shadow-sm'
                )}
                aria-haspopup="menu"
                aria-label={item.label}
              >
                <Icon className="h-5 w-5 text-current transition-transform duration-200 hover:scale-110" />
                {hasActiveChild && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[hsl(var(--primary))] animate-pulse border-2 border-[hsl(var(--background))]" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="z-[60]">
              <p className="font-medium">{item.label}</p>
              {item.children && item.children.length > 0 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {item.children.length} {item.children.length === 1 ? 'item' : 'itens'}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}

      {!isCollapsed && isOpen && (
        <div
          id={`submenu-${item.id}`}
          className={cn(
            'mt-2 ml-4 pl-4 space-y-1 overflow-hidden transition-all duration-300 ease-out',
            'border-l-2 border-[hsl(var(--border))]/50',
            'max-h-96 opacity-100'
          )}
        >
          {item.children?.map((child) => {
            const ChildIcon = getIconComponent(child.icon);
            const childActive = child.path ? isRouteActive(location.pathname, child.path) : false;

            return (
              <NavLink
                key={child.id || child.path || child.label}
                to={child.path || '#'}
                className={cn(
                  'group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 focus:bg-[hsl(var(--accent))]/50',
                  'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
                  childActive
                    ? 'bg-gradient-to-r from-[hsl(var(--brand-yellow))] to-[hsl(var(--brand-yellow-glow))] text-[hsl(var(--brand-yellow-foreground))] shadow-lg shadow-[hsl(var(--brand-yellow))]/30 font-semibold border-l-4 border-[hsl(var(--brand-yellow-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-gradient-to-r hover:from-[hsl(var(--accent))]/50 hover:to-[hsl(var(--accent))]/30 hover:text-[hsl(var(--foreground))] border-l-4 border-transparent'
                )}
              >
                <ChildIcon className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-200", 
                  childActive ? "text-[hsl(var(--brand-yellow-foreground))] drop-shadow-sm" : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]"
                )} />
                <span className={cn(
                  "truncate font-medium transition-colors duration-200 relative",
                  childActive ? "text-[hsl(var(--brand-yellow-foreground))]" : ""
                )}>
                  {child.label}
                  {/* Linha inferior para item ativo */}
                  {childActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[hsl(var(--brand-yellow-foreground))]/60 rounded-full" />
                  )}
                </span>
                {child.badge && (
                  <span className={cn(
                    'ml-auto px-1.5 py-0.5 text-xs font-medium rounded-full shrink-0',
                    {
                      'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]': child.badge.variant === 'default',
                      'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]': child.badge.variant === 'destructive',
                      'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]': child.badge.variant === 'warning',
                      'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]': child.badge.variant === 'success'
                    }
                  )}>
                    {child.badge.content}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      )}

    </div>
  );
});

SidebarItemWithChildren.displayName = 'SidebarItemWithChildren';