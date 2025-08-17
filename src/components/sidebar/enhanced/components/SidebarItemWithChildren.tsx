import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavItem, FlyoutPosition } from '../types/sidebar.types';
import { SidebarFlyout } from './SidebarFlyout';
import { SidebarTooltip } from './SidebarTooltip';
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
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [flyoutPosition, setFlyoutPosition] = useState<FlyoutPosition>({ top: 0, left: 0, maxHeight: 300 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  
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

  const handleMouseEnter = useCallback(() => {
    if (!isCollapsed || isMobile || pointerType !== 'mouse') return;
    if (!SIDEBAR_BEHAVIOR.collapsed.hoverOpensFlyout) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (buttonRef.current) {
        const position = calculateFlyoutPosition(buttonRef.current);
        setFlyoutPosition(position);
        setFlyoutOpen(true);
      }
    }, 120);
  }, [isCollapsed, isMobile, pointerType, calculateFlyoutPosition]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (!isCollapsed || isFlyoutPinned) return;

    // Delay closing to allow mouse to move to flyout
    setTimeout(() => {
      if (!isFlyoutPinned) {
        setFlyoutOpen(false);
      }
    }, 200);
  }, [isCollapsed, isFlyoutPinned]);

  const handleParentClick = useCallback((e: React.MouseEvent) => {
    // Only prevent default for items with children
    if (item.children && item.children.length > 0) {
      e.preventDefault();
    }
    
    if (isCollapsed && !isMobile) {
      if (SIDEBAR_BEHAVIOR.collapsed.clickOpensFlyout) {
        if (buttonRef.current) {
          const position = calculateFlyoutPosition(buttonRef.current);
          setFlyoutPosition(position);
          setFlyoutOpen(true);
          
          // Pin the flyout when clicked
          actions.openFlyout(item.id, { 
            pinned: true, 
            ttlMs: SIDEBAR_BEHAVIOR.collapsed.pinOnClickMs 
          });
        }
      }
      return;
    }

    // When expanded
    const firstChild = item.children?.[0];
    if (SIDEBAR_BEHAVIOR.groupClick === 'navigateFirst' && firstChild?.path) {
      navigate(firstChild.path);
      return;
    }
    
    // Default toggle behavior
    actions.toggleGroup(item.id);
  }, [isCollapsed, isMobile, item.children, item.id, calculateFlyoutPosition, actions, navigate]);

  const handleFocus = useCallback(() => {
    if (isCollapsed && !isMobile && buttonRef.current) {
      const position = calculateFlyoutPosition(buttonRef.current);
      setFlyoutPosition(position);
      setFlyoutOpen(true);
    }
  }, [isCollapsed, isMobile, calculateFlyoutPosition]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleParentClick(e as any);
    }
    if (e.key === 'ArrowRight' && !isCollapsed) {
      actions.openGroup(item.id);
    }
    if (e.key === 'ArrowLeft' && !isCollapsed) {
      actions.closeGroup(item.id);
    }
    if (e.key === 'Escape') {
      actions.closeFlyout(item.id);
      setFlyoutOpen(false);
    }
  }, [handleParentClick, isCollapsed, actions, item.id]);

  const closeFlyout = useCallback(() => {
    setFlyoutOpen(false);
    actions.closeFlyout(item.id);
  }, [actions, item.id]);

  const button = (
    <button
      ref={buttonRef}
      onClick={handleParentClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={cn(
        'group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
        hasActiveChild
          ? 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))] border-l-2 border-[hsl(var(--primary))]'
          : 'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
      )}
      aria-expanded={!isCollapsed ? isOpen : undefined}
      aria-haspopup="true"
      aria-controls={!isCollapsed ? `submenu-${item.id}` : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      
      {/* Label - hidden when collapsed */}
      <span className={cn(
        'truncate transition-opacity duration-200',
        !isMobile && isCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
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
      {/* Main button with tooltip when collapsed */}
      {!isMobile && isCollapsed ? (
        <SidebarTooltip content={item.label} disabled={!isCollapsed}>
          {button}
        </SidebarTooltip>
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
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))] border-l-2 border-[hsl(var(--primary))]'
                    : 'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
                )}
              >
                <ChildIcon className="h-4 w-4 shrink-0" />
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

      {/* Flyout portal when collapsed */}
      {isCollapsed && !isMobile && item.children && (
        <SidebarFlyout
          isOpen={flyoutOpen || isFlyoutPinned}
          position={flyoutPosition}
          items={item.children}
          onClose={closeFlyout}
          isActive={utils.isActive}
          pointerType={pointerType}
          isPinned={isFlyoutPinned}
        />
      )}
    </div>
  );
}