import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavItem, FlyoutPosition } from '../types/sidebar.types';
import { SidebarFlyout } from './SidebarFlyout';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useSidebar } from '../SidebarContext';
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
  const { actions, utils } = useSidebar();
  
  const Icon = getIconComponent(item.icon);
  
  // Check if this item has active children
  const hasActiveChild = useMemo(() => {
    if (!item.children) return false;
    return item.children.some(child => 
      child.path && matchPath({ path: child.path, end: false }, location.pathname)
    );
  }, [location.pathname, item.children]);

  // Check if this group is open
  const isOpen = actions.isGroupOpen(item.id);
  
  // Auto-expand group when child is active
  useEffect(() => {
    if (!isCollapsed && hasActiveChild && !isOpen) {
      actions.openGroup(item.id);
    }
  }, [hasActiveChild, isCollapsed, isOpen, item.id, actions]);

  // Check if flyout is pinned
  const isFlyoutPinned = actions.isFlyoutOpen(item.id);

  const handleParentClick = useCallback((e: React.MouseEvent) => {
    // Prevent navigation for items WITH children only
    const hasChildren = item.children && item.children.length > 0;
    if (hasChildren) {
      e.preventDefault();
    }
    
    if (isCollapsed && !isMobile) {
      if (SIDEBAR_BEHAVIOR.collapsed.clickOpensFlyout && hasChildren) {
        // Pin the flyout when clicked
        actions.openFlyout(item.id, { 
          pinned: true, 
          ttlMs: SIDEBAR_BEHAVIOR.pinOnClickMs 
        });
      }
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
      actions.toggleGroup(item.id);
    }
  }, [isCollapsed, isMobile, item.children, item.id, actions, navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleParentClick(e as any);
    }
    if (e.key === 'ArrowRight') {
      if (!isCollapsed) {
        // Open group when expanded
        actions.openGroup(item.id);
      }
    }
    if (e.key === 'ArrowLeft') {
      if (!isCollapsed) {
        actions.closeGroup(item.id);
      }
    }
  }, [handleParentClick, isCollapsed, actions, item.id]);

  const button = (
    <button
      ref={buttonRef}
      onClick={handleParentClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={cn(
        'group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
        hasActiveChild
          ? 'bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] [&_svg]:text-[hsl(var(--brand-yellow-foreground))]'
          : 'hover:bg-[hsl(var(--interactive-hover))] hover:text-[hsl(var(--foreground))]'
      )}
      aria-expanded={!isCollapsed ? isOpen : undefined}
      aria-haspopup="true"
      aria-controls={!isCollapsed ? `submenu-${item.id}` : undefined}
    >
      <Icon className={cn("h-5 w-5 shrink-0", hasActiveChild && "text-[hsl(var(--brand-yellow-foreground))]")} />
      
      {/* Label - hidden when collapsed */}
      <span className={cn(
        'truncate transition-opacity duration-200',
        !isMobile && isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100',
        hasActiveChild && 'text-[hsl(var(--brand-yellow-foreground))]'
      )}>
        {item.label}
      </span>

      {/* Chevron - hidden when collapsed */}
      <ChevronDown className={cn(
        'h-4 w-4 ml-auto transition-transform shrink-0',
        isOpen ? 'rotate-180' : '',
        !isMobile && isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
      )} />

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
      {!isMobile && isCollapsed && hasActiveChild && (
        <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--primary))] shrink-0" />
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
                  'h-11 w-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
                  hasActiveChild 
                    ? 'bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))]'
                    : 'hover:bg-[hsl(var(--interactive-hover))] bg-transparent'
                )}
                aria-haspopup="menu"
                aria-label={item.label}
              >
                <Icon className="h-5 w-5 text-current" />
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
                  const childActive = child.path ? utils.isActive(child.path) : false;
                  
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
                      <ChildIcon className="h-5 w-5 shrink-0" />
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
            'mt-1 pl-6 space-y-1 overflow-hidden transition-all duration-200',
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          {item.children?.map((child) => {
            const ChildIcon = getIconComponent(child.icon);
            const childActive = child.path ? utils.isActive(child.path) : false;

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
                <ChildIcon className={cn("h-5 w-5 shrink-0", childActive && "text-[hsl(var(--brand-yellow-foreground))]")} />
                <span className="truncate">{child.label}</span>
                {child.badge && (
                  <span className={cn(
                    'ml-auto px-1.5 py-0.5 text-xs rounded-full shrink-0',
                    {
                      'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]': child.badge.variant === 'default',
                      'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]': child.badge.variant === 'destructive',
                      'bg-yellow-500 text-yellow-50': child.badge.variant === 'warning',
                      'bg-green-500 text-green-50': child.badge.variant === 'success'
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