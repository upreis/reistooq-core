import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavItem, FlyoutPosition } from '../types/sidebar.types';
import { SidebarFlyout } from './SidebarFlyout';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { SIDEBAR_BEHAVIOR } from '@/config/sidebar-behavior';

interface SidebarItemWithChildrenProps {
  item: NavItem;
  isCollapsed: boolean;
  isMobile: boolean;
  pointerType: 'mouse' | 'touch' | 'pen';
  calculateFlyoutPosition: (element: HTMLElement) => FlyoutPosition;
}

const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Package;
};

export function SidebarItemWithChildren({
  item,
  isCollapsed,
  isMobile,
  pointerType,
  calculateFlyoutPosition
}: SidebarItemWithChildrenProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleGroup, openGroup, closeGroup, isGroupOpen } = useSidebarUI();
  
  const Icon = getIconComponent(item.icon);
  
  // Check if this item has active children
  const hasActiveChild = useMemo(() => {
    if (!item.children) return false;
    return item.children.some(child => 
      child.path && matchPath({ path: child.path, end: false }, location.pathname)
    );
  }, [location.pathname, item.children]);

  // Check if this group is open
  const isOpen = isGroupOpen(item.id);
  
  // Auto-expand group when child is active
  useEffect(() => {
    if (!isCollapsed && hasActiveChild && !isOpen) {
      openGroup(item.id);
    }
  }, [hasActiveChild, isCollapsed, isOpen, item.id, openGroup]);

  // Remove flyout functionality temporarily as it's not used in the unified context
  const isFlyoutPinned = false;

  const handleParentClick = useCallback((e: React.MouseEvent) => {
    // Prevent navigation for items WITH children only
    const hasChildren = item.children && item.children.length > 0;
    if (hasChildren) {
      e.preventDefault();
    }
    
    if (isCollapsed && !isMobile) {
      // For now, just prevent default behavior when collapsed
      // Flyout functionality can be added back later if needed
      return;
    }

    // When expanded - only for items with children
    if (hasChildren) {
      const firstChild = item.children?.[0];
      if (SIDEBAR_BEHAVIOR.groupClick === 'navigateFirst' && firstChild?.path) {
        navigate(firstChild.path);
        return;
      }
      
      // Default toggle behavior
      toggleGroup(item.id);
    }
  }, [isCollapsed, isMobile, item.children, item.id, toggleGroup, navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleParentClick(e as any);
    }
    if (e.key === 'ArrowRight') {
      if (!isCollapsed) {
        // Open group when expanded
        openGroup(item.id);
      }
    }
    if (e.key === 'ArrowLeft') {
      if (!isCollapsed) {
        closeGroup(item.id);
      }
    }
  }, [handleParentClick, isCollapsed, openGroup, closeGroup, item.id]);

  const button = (
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

      {/* Chevron com animação suave */}
      <ChevronDown className={cn(
        'h-4 w-4 ml-auto transition-all duration-300 shrink-0',
        isOpen ? 'rotate-180 text-[hsl(var(--primary))]' : 'rotate-0',
        !isMobile && isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100',
        hasActiveChild ? 'text-[hsl(var(--brand-yellow-foreground))]' : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]'
      )} />

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

      {/* Indicador ativo melhorado */}
      {!isMobile && isCollapsed && hasActiveChild && (
        <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--primary))] shrink-0 animate-pulse" />
      )}
    </button>
  );

  return (
    <div>
      {/* For items with children, use HoverCard when collapsed instead of tooltip */}
      {!isMobile && isCollapsed ? (
        <div className="relative">
          <HoverCard openDelay={80} closeDelay={120}>
            <HoverCardTrigger asChild>
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
                <Icon className="h-5 w-5 text-current transition-transform duration-200 group-hover:scale-110" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent
              side="right"
              align="start"
              sideOffset={12}
              onPointerDownOutside={(e) => e.currentTarget?.dispatchEvent?.(new Event("mouseleave"))}
              className="w-72 p-0 z-[60] border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Header replaces tooltip */}
              <div className="px-4 py-3 text-sm font-medium bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))]">
                {item.label}
              </div>
              <div className="p-2 space-y-1">
                {item.children?.map((child) => {
                  const ChildIcon = getIconComponent(child.icon);
                   const childActive = child.path ? location.pathname.startsWith(child.path) : false;
                  
                  return (
                    <NavLink
                      key={child.id || child.path || child.label}
                      to={child.path || '#'}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
                        childActive
                          ? 'bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] [&_svg]:text-[hsl(var(--brand-yellow-foreground))]'
                          : 'hover:bg-[hsl(var(--interactive-hover))] hover:text-[hsl(var(--foreground))]'
                      )}
                    >
                      <ChildIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{child.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      ) : (
        button
      )}

      {/* Regular submenu when expanded */}
      {!isCollapsed && (
        <div
          id={`submenu-${item.id}`}
          className={cn(
            'mt-2 ml-4 pl-4 space-y-1 overflow-hidden transition-all duration-300 ease-out',
            'border-l-2 border-[hsl(var(--border))]/50',
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          {item.children?.map((child) => {
            const ChildIcon = getIconComponent(child.icon);
            const childActive = child.path ? location.pathname.startsWith(child.path) : false;

            return (
              <NavLink
                key={child.id || child.path || child.label}
                to={child.path || '#'}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 focus:bg-[hsl(var(--accent))]/50',
                  'hover:bg-gradient-to-r hover:from-[hsl(var(--accent))]/50 hover:to-[hsl(var(--accent))]/30',
                  'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
                  childActive
                    ? 'bg-gradient-to-r from-[hsl(var(--brand-yellow))] to-[hsl(var(--brand-yellow-glow))] text-[hsl(var(--brand-yellow-foreground))] shadow-lg shadow-[hsl(var(--brand-yellow))]/25'
                    : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                <ChildIcon className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-200", 
                  childActive ? "text-[hsl(var(--brand-yellow-foreground))] drop-shadow-sm" : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]"
                )} />
                <span className={cn(
                  "truncate font-medium transition-colors duration-200",
                  childActive ? "text-[hsl(var(--brand-yellow-foreground))] font-semibold" : "text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--foreground))]"
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
}