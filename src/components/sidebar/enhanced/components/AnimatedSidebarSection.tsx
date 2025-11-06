import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NavItem } from '../types/sidebar.types';
import { AnimatedSidebarItem } from './AnimatedSidebarItem';

interface AnimatedSidebarSectionProps {
  items: NavItem[];
  isCollapsed: boolean;
  isMobile: boolean;
  isActive: (path: string) => boolean;
}

export const AnimatedSidebarSection = memo(({ 
  items, 
  isCollapsed, 
  isMobile, 
  isActive 
}: AnimatedSidebarSectionProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter only single items (no children)
  const singleItems = items.filter(item => !item.children || item.children.length === 0);

  if (singleItems.length === 0) {
    return null;
  }

  // Item dimensions: altura do item + gap entre itens
  const ITEM_HEIGHT = 38; // h-[38px]
  const GAP = 2; // space-y-0.5
  const TOTAL_HEIGHT = ITEM_HEIGHT + GAP;

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
        {singleItems.map((item, index) => (
          <li key={item.id || item.path || item.label}>
            <AnimatedSidebarItem
              item={item}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              isActive={isActive}
              index={index}
              hoveredIndex={hoveredIndex}
              onHover={setHoveredIndex}
            />
          </li>
        ))}
        
        {/* 🎯 Animated hover background - move to hovered item position */}
        <motion.div
          className={cn(
            "absolute inset-x-1 rounded-lg pointer-events-none",
            "bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent))]/50",
            isCollapsed ? "h-11 w-11 left-1/2 -translate-x-1/2" : "h-[38px]"
          )}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{
            opacity: hoveredIndex !== null ? 1 : 0,
            scale: hoveredIndex !== null ? 1 : 0.75,
            top: hoveredIndex !== null ? (hoveredIndex * TOTAL_HEIGHT) + 2 : 0,
          }}
          transition={{ 
            duration: 0.1,
            ease: [0.4, 0, 0.2, 1] // cubic-bezier easing
          }}
        />
      </menu>
    </div>
  );
});

AnimatedSidebarSection.displayName = 'AnimatedSidebarSection';
