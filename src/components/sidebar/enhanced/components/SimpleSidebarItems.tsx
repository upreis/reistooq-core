import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavItem } from '../types/sidebar.types';
import { getIconComponent } from '../utils/sidebar-utils';

interface SimpleSidebarItemsProps {
  items: NavItem[];
  isCollapsed: boolean;
  isMobile: boolean;
  isActive: (path: string) => boolean;
}

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
    <div className="space-y-0.5">
      <menu className="space-y-0.5">
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
                    "group relative h-11 w-11 rounded-lg flex items-center justify-center border",
                    "transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                    "hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]",
                    itemActive 
                      ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 shrink-0 transition-colors duration-200",
                    itemActive ? "text-[hsl(var(--primary-foreground))]" : ""
                  )} />
                  
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
                  'group relative flex items-center gap-2.5 h-9 px-3 py-2 rounded-lg border-l-2',
                  'transition-all duration-200',
                  'text-sm select-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
                  'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]',
                  itemActive
                    ? 'bg-[hsl(var(--accent))] border-[hsl(var(--primary))] text-[hsl(var(--accent-foreground))] font-medium'
                    : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]'
                )}
              >
                <Icon 
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors duration-200",
                    itemActive ? "text-[hsl(var(--accent-foreground))]" : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]"
                  )} 
                />
                
                <span className="truncate text-sm">
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

              </NavLink>
            </li>
          );
        })}
      </menu>
    </div>
  );
});

SimpleSidebarItems.displayName = 'SimpleSidebarItems';
