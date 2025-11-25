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
          'group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border-l-2',
          'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20',
          'hover:bg-[hsl(var(--accent))] active:bg-[hsl(var(--accent))]/80',
          hasActiveChild
            ? 'bg-[hsl(var(--accent))] border-[hsl(var(--primary))] font-medium'
            : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]'
        )}
        aria-expanded={!isCollapsed ? isOpen : undefined}
        aria-haspopup="true"
        aria-controls={!isCollapsed ? `submenu-${item.id}` : undefined}
      >
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-colors duration-200", 
          hasActiveChild ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]"
        )} />
        
        {/* Label */}
        <span className={cn(
          'truncate transition-all duration-200 text-sm',
          !isMobile && isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100',
          hasActiveChild ? 'text-[hsl(var(--foreground))] font-medium' : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]'
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

        {/* Indicador ativo */}
        {!isMobile && isCollapsed && hasActiveChild && (
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[hsl(var(--primary))] shrink-0 border border-[hsl(var(--background))]" />
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
            'h-4 w-4 transition-all duration-200',
            isOpen ? 'rotate-180' : 'rotate-0',
            hasActiveChild ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'
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
                  'h-11 w-11 rounded-lg flex items-center justify-center transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20',
                  'hover:bg-[hsl(var(--accent))]',
                  hasActiveChild 
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))] border-2 border-[hsl(var(--primary))]'
                    : 'bg-transparent border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]'
                )}
                aria-haspopup="menu"
                aria-label={item.label}
              >
                <Icon className="h-5 w-5 text-current" />
                {hasActiveChild && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[hsl(var(--primary))] border border-[hsl(var(--background))]" />
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
            'mt-1 ml-2 pl-6 space-y-0.5 overflow-hidden',
            'border-l border-[hsl(var(--border))]'
          )}
        >
          {item.children?.map((child) => {
            const childActive = child.path ? isRouteActive(location.pathname, child.path) : false;

            return (
              <NavLink
                key={child.id || child.path || child.label}
                to={child.path || '#'}
                className={cn(
                  'group relative flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-md text-sm transition-all duration-200',
                  'focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]',
                  'hover:bg-[hsl(var(--accent))]/50',
                  childActive
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                <span className={cn(
                  "truncate transition-colors duration-200",
                  childActive ? "text-[hsl(var(--foreground))]" : ""
                )}>
                  {child.label}
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