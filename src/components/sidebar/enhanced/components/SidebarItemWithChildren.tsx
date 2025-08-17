import React, { useRef, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavItem, FlyoutPosition } from '../types/sidebar.types';
import { SidebarFlyout } from './SidebarFlyout';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarItemWithChildrenProps {
  item: NavItem;
  isCollapsed: boolean;
  isMobile: boolean;
  isOpen: boolean;
  hasActiveChild: boolean;
  isActive: (path: string) => boolean;
  onToggle: () => void;
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
  isOpen,
  hasActiveChild,
  isActive,
  onToggle,
  pointerType,
  calculateFlyoutPosition
}: SidebarItemWithChildrenProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [flyoutPosition, setFlyoutPosition] = useState<FlyoutPosition>({ top: 0, left: 0, maxHeight: 300 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const Icon = getIconComponent(item.icon);

  const handleMouseEnter = useCallback(() => {
    if (!isCollapsed || isMobile || pointerType !== 'mouse') return;

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

    if (!isCollapsed) return;

    // Delay closing to allow mouse to move to flyout
    setTimeout(() => {
      setFlyoutOpen(false);
    }, 200);
  }, [isCollapsed]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isCollapsed && !isMobile) {
      if (pointerType === 'touch') {
        // First tap opens flyout, second tap would close it
        if (!flyoutOpen && buttonRef.current) {
          const position = calculateFlyoutPosition(buttonRef.current);
          setFlyoutPosition(position);
          setFlyoutOpen(!flyoutOpen);
        } else {
          setFlyoutOpen(false);
        }
      }
      // For mouse, hover handles opening
    } else {
      // Normal toggle behavior when expanded
      onToggle();
    }
  }, [isCollapsed, isMobile, pointerType, flyoutOpen, calculateFlyoutPosition, onToggle]);

  const handleFocus = useCallback(() => {
    if (isCollapsed && !isMobile && buttonRef.current) {
      const position = calculateFlyoutPosition(buttonRef.current);
      setFlyoutPosition(position);
      setFlyoutOpen(true);
    }
  }, [isCollapsed, isMobile, calculateFlyoutPosition]);

  const closeFlyout = useCallback(() => {
    setFlyoutOpen(false);
  }, []);

  const button = (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
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
            const childActive = child.path ? isActive(child.path) : false;

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
          isOpen={flyoutOpen}
          position={flyoutPosition}
          items={item.children}
          onClose={closeFlyout}
          isActive={isActive}
          pointerType={pointerType}
        />
      )}
    </div>
  );
}