import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NavItem } from '../types/sidebar.types';

interface SimpleSidebarItemsProps {
  items: NavItem[];
  isCollapsed: boolean;
  isMobile: boolean;
  isActive: (path: string) => boolean;
}

const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Package;
};

export const SimpleSidebarItems = memo(({ 
  items, 
  isCollapsed, 
  isMobile, 
  isActive 
}: SimpleSidebarItemsProps) => {
  // Filter only single items (no children)
  const singleItems = items.filter(item => !item.children || item.children.length === 0);

  if (singleItems.length === 0) return null;

  return (
    <div 
      className={cn(
        "relative rounded-lg p-1",
        "bg-[hsl(var(--muted))]/30",
        "after:content-[''] after:absolute after:inset-0",
        "after:bg-gradient-to-br after:from-white/5 after:to-transparent",
        "after:rounded-lg after:border after:border-white/5 after:pointer-events-none"
      )}
    >
      <menu className="relative space-y-0.5">
        {singleItems.map((item) => {
          const Icon = getIconComponent(item.icon);
          const itemActive = item.path ? isActive(item.path) : false;

          // Collapsed view - icon only with native title tooltip
          if (!isMobile && isCollapsed) {
            return (
              <li key={item.id || item.path || item.label}>
                <NavLink 
                  to={item.path || '#'}
                  title={item.label}
                  className={cn(
                    "group relative h-11 w-11 rounded-lg flex items-center justify-center",
                    "transition-all duration-150",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                    "hover:scale-105 active:scale-95",
                    itemActive 
                      ? "text-[hsl(var(--brand-yellow-foreground))]"
                      : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]/50"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-200",
                    "group-hover:scale-110",
                    itemActive && "text-[hsl(var(--brand-yellow-foreground))]",
                    !itemActive && "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]"
                  )} />
                  
                  {itemActive && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[hsl(var(--brand-yellow))] border border-[hsl(var(--background))]" />
                  )}
                  
                  {item.badge && (
                    <span className={cn(
                      'absolute -top-0.5 -right-0.5 px-1 py-0.5 text-[10px] font-medium rounded-md',
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
                </NavLink>
              </li>
            );
          }

          // Expanded view - full item with label
          return (
            <li key={item.id || item.path || item.label}>
              <NavLink
                to={item.path || '#'}
                className={cn(
                  'group relative flex items-center gap-2.5 h-[38px] px-3 py-2 rounded-lg',
                  'transition-all duration-150',
                  'text-sm font-medium select-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
                  'hover:bg-[hsl(var(--accent))]/50 active:bg-[hsl(var(--accent))]/60',
                  itemActive
                    ? 'text-[hsl(var(--brand-yellow-foreground))]'
                    : 'text-[hsl(var(--foreground))]/90 hover:text-[hsl(var(--foreground))]'
                )}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-200",
                    "group-hover:scale-110",
                    itemActive && "text-[hsl(var(--brand-yellow-foreground))]",
                    !itemActive && "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]"
                  )} 
                />
                
                <span className="truncate">
                  {item.label}
                </span>

                {/* Badge */}
                {item.badge && (
                  <span className={cn(
                    'ml-auto text-xs shrink-0 px-1.5 py-0.5 rounded-md',
                    itemActive 
                      ? 'text-[hsl(var(--brand-yellow-foreground))]/70' 
                      : 'text-[hsl(var(--muted-foreground))]',
                    {
                      'bg-[hsl(var(--primary))]/20': item.badge.variant === 'default',
                      'bg-[hsl(var(--destructive))]/20': item.badge.variant === 'destructive',
                      'bg-[hsl(var(--warning))]/20': item.badge.variant === 'warning',
                      'bg-[hsl(var(--success))]/20': item.badge.variant === 'success'
                    }
                  )}>
                    {item.badge.content}
                  </span>
                )}

                {/* Active indicator when collapsed */}
                {itemActive && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[hsl(var(--brand-yellow))] shrink-0 border border-[hsl(var(--background))]" />
                )}
              </NavLink>
            </li>
          );
        })}
      </menu>
    </div>
  );
});

SimpleSidebarItems.displayName = 'SimpleSidebarItems';
