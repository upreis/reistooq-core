import React, { memo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NavItem } from '../types/sidebar.types';

interface AnimatedSidebarItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isMobile: boolean;
  isActive: (path: string) => boolean;
  index: number;
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
}

const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Package;
};

export const AnimatedSidebarItem = memo(({ 
  item, 
  isCollapsed, 
  isMobile, 
  isActive,
  index,
  hoveredIndex,
  onHover
}: AnimatedSidebarItemProps) => {
  const Icon = getIconComponent(item.icon);
  const itemActive = item.path ? isActive(item.path) : false;
  const isHovered = hoveredIndex === index;

  const link = (
    <NavLink
      to={item.path || '#'}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        'relative z-10 flex items-center gap-2.5 h-[38px] px-3 py-2 rounded-lg transition-all duration-150',
        'text-sm font-medium select-none',
        'focus:outline-none focus-visible:ring-1.5 focus-visible:ring-[hsl(var(--primary))]',
        'active:bg-[hsl(var(--accent))]/60',
        itemActive
          ? 'text-[hsl(var(--brand-yellow-foreground))]'
          : 'text-[hsl(var(--foreground))]/90'
      )}
    >
      <Icon 
        className={cn(
          "shrink-0 transition-all duration-200",
          isHovered && "scale-110",
          itemActive && "text-[hsl(var(--brand-yellow-foreground))]",
          !itemActive && "text-[hsl(var(--muted-foreground))]",
          !isMobile && isCollapsed ? "h-5 w-5" : "h-5 w-5"
        )} 
      />
      
      <AnimatePresence>
        {(!isMobile && !isCollapsed) && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Hotkey/Badge */}
      {item.badge && (!isMobile && !isCollapsed) && (
        <span className={cn(
          'ml-auto text-xs shrink-0 px-1.5 py-0.5 rounded-md',
          itemActive 
            ? 'text-[hsl(var(--brand-yellow-foreground))]/70' 
            : 'text-[hsl(var(--muted-foreground))]',
          {
            'bg-[hsl(var(--primary))]/20': item.badge.variant === 'default',
            'bg-[hsl(var(--destructive))]/20': item.badge.variant === 'destructive',
            'bg-yellow-500/20': item.badge.variant === 'warning',
            'bg-green-500/20': item.badge.variant === 'success'
          }
        )}>
          {item.badge.content}
        </span>
      )}

      {/* Active indicator when collapsed */}
      {!isMobile && isCollapsed && itemActive && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[hsl(var(--brand-yellow))] shrink-0 border border-[hsl(var(--background))]" />
      )}
    </NavLink>
  );

  // Collapsed view - icon only with tooltip
  return !isMobile && isCollapsed ? (
    <div title={item.label} className="flex justify-center">
      <NavLink 
        to={item.path || '#'}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={() => onHover(null)}
        className={cn(
          "relative h-11 w-11 rounded-lg flex items-center justify-center transition-all duration-150",
          "focus:outline-none focus-visible:ring-1.5 focus-visible:ring-[hsl(var(--primary))]",
          "active:scale-95",
          isHovered && "scale-105",
          itemActive 
            ? "text-[hsl(var(--brand-yellow-foreground))]"
            : "text-[hsl(var(--foreground))]"
        )}
      >
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-all duration-200",
          isHovered && "scale-110",
          itemActive && "text-[hsl(var(--brand-yellow-foreground))]",
          !itemActive && "text-[hsl(var(--muted-foreground))]"
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
              'bg-yellow-500 text-yellow-50': item.badge.variant === 'warning',
              'bg-green-500 text-green-50': item.badge.variant === 'success'
            }
          )}>
            {item.badge.content}
          </span>
        )}
      </NavLink>
    </div>
  ) : (
    link
  );
});

AnimatedSidebarItem.displayName = 'AnimatedSidebarItem';
