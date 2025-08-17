import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavItem, FlyoutPosition } from '../types/sidebar.types';

interface SidebarFlyoutProps {
  isOpen: boolean;
  position: FlyoutPosition;
  items: NavItem[];
  onClose: () => void;
  isActive: (path: string) => boolean;
  pointerType: 'mouse' | 'touch' | 'pen';
  isPinned?: boolean;
}

const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Package;
};

export function SidebarFlyout({ 
  isOpen, 
  position, 
  items, 
  onClose, 
  isActive,
  pointerType,
  isPinned = false
}: SidebarFlyoutProps) {
  const flyoutRef = useRef<HTMLDivElement>(null);
  const [isMouseInside, setIsMouseInside] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle mouse events for hover behavior
  useEffect(() => {
    if (pointerType !== 'mouse') return;

    const handleMouseEnter = () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      setIsMouseInside(true);
    };

    const handleMouseLeave = () => {
      if (isPinned) return; // Don't close on mouse leave if pinned
      
      setIsMouseInside(false);
      closeTimeoutRef.current = setTimeout(() => {
        if (!isMouseInside && !isPinned) {
          onClose();
        }
      }, 200);
    };

    const flyout = flyoutRef.current;
    if (flyout && isOpen) {
      flyout.addEventListener('mouseenter', handleMouseEnter);
      flyout.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        flyout.removeEventListener('mouseenter', handleMouseEnter);
        flyout.removeEventListener('mouseleave', handleMouseLeave);
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    }
  }, [isOpen, isMouseInside, onClose, pointerType]);

  // Handle click outside and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      
      // Arrow key navigation within flyout
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const focusableElements = flyoutRef.current?.querySelectorAll('a[href]');
        if (!focusableElements) return;
        
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
        let nextIndex;
        
        if (event.key === 'ArrowDown') {
          nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        }
        
        (focusableElements[nextIndex] as HTMLElement).focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Auto-focus first item when opened
  useEffect(() => {
    if (isOpen && flyoutRef.current) {
      const firstLink = flyoutRef.current.querySelector('a[href]') as HTMLElement;
      if (firstLink) {
        // Small delay to ensure smooth animation
        setTimeout(() => firstLink.focus(), 50);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const flyout = (
    <div
      ref={flyoutRef}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        'fixed bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-lg shadow-lg',
        'min-w-[200px] py-2 animate-in fade-in-0 zoom-in-95 slide-in-from-left-2 duration-200',
        'z-[80] focus:outline-none',
        isPinned && 'ring-2 ring-[hsl(var(--primary))] ring-opacity-50'
      )}
      style={{
        top: position.top,
        left: position.left,
        maxHeight: position.maxHeight,
        overflowY: 'auto'
      }}
    >
      {items.map((item) => {
        const Icon = getIconComponent(item.icon);
        const itemActive = item.path ? isActive(item.path) : false;
        
        return (
          <NavLink
            key={item.id || item.path || item.label}
            to={item.path || '#'}
            role="menuitem"
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
              'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
              'focus:bg-[hsl(var(--accent))] focus:text-[hsl(var(--accent-foreground))] focus:outline-none',
              itemActive && 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))] font-medium'
            )}
            onClick={() => {
              // Close flyout on navigation (especially important for touch)
              if (pointerType === 'touch') {
                onClose();
              }
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className={cn(
                'ml-auto px-1.5 py-0.5 text-xs rounded-full shrink-0',
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
        );
      })}
    </div>
  );

  const portalRoot = document.getElementById('portal-root') || document.body;
  return createPortal(flyout, portalRoot);
}