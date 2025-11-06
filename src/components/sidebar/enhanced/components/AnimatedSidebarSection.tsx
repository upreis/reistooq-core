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
        
        {/* Animated hover background */}
        <motion.div
          className={cn(
            "absolute inset-x-1 h-[38px] rounded-lg pointer-events-none",
            "bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent))]/50"
          )}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: hoveredIndex !== null ? 1 : 0,
            scale: hoveredIndex !== null ? 1 : 0.85,
            top: hoveredIndex !== null ? hoveredIndex * 38 + 2 : 0,
          }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        />
      </menu>
    </div>
  );
});

AnimatedSidebarSection.displayName = 'AnimatedSidebarSection';
