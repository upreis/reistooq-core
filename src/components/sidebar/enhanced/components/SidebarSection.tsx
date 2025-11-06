import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavSection } from '../types/sidebar.types';
import { SidebarItemWithChildren } from './SidebarItemWithChildren';
import { AnimatedSidebarSection } from './AnimatedSidebarSection';

interface SidebarSectionProps {
  section: NavSection;
  isCollapsed: boolean;
  isMobile: boolean;
  isActive: (path: string) => boolean;
  getPointerType: () => 'mouse' | 'touch' | 'pen';
  calculateFlyoutPosition: (element: HTMLElement) => any;
}

export const SidebarSection = memo(({ 
  section, 
  isCollapsed, 
  isMobile,
  isActive,
  getPointerType,
  calculateFlyoutPosition
}: SidebarSectionProps) => {
  return (
    <div key={section.id}>
      {/* Section Label */}
      <AnimatePresence>
        {(!isMobile && !isCollapsed) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-3"
          >
            <h2 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              {section.group}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Items */}
      <div className="space-y-1">
        {/* Items with children (groups) */}
        {section.items.filter(item => item.children && item.children.length > 0).map((item) => (
          <SidebarItemWithChildren
            key={item.id || item.label}
            item={item}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            pointerType={getPointerType()}
            calculateFlyoutPosition={calculateFlyoutPosition}
          />
        ))}
        
        {/* Single items (no children) - with animated menu style */}
        <AnimatedSidebarSection
          items={section.items}
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          isActive={isActive}
        />
      </div>
    </div>
  );
});

SidebarSection.displayName = 'SidebarSection';
