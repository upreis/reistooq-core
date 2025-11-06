import React, { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavSection, NavItem } from './enhanced/types/sidebar.types';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { 
  Sidebar, 
  SidebarBody, 
  SidebarLink 
} from '@/components/ui/aceternity-sidebar';
import { useLocation } from 'react-router-dom';

interface AceternityEnhancedSidebarProps {
  navItems: NavSection[];
  isMobile?: boolean;
  onMobileClose?: () => void;
}

const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Package;
};

// Flatten navigation to simple links
const flattenNavItems = (sections: NavSection[]): Array<{ label: string; href: string; icon: React.ReactNode }> => {
  const links: Array<{ label: string; href: string; icon: React.ReactNode }> = [];
  
  sections.forEach(section => {
    section.items.forEach(item => {
      if (item.path) {
        const Icon = getIconComponent(item.icon);
        links.push({
          label: item.label,
          href: item.path,
          icon: <Icon className="h-5 w-5 flex-shrink-0" />
        });
      }
      
      if (item.children) {
        item.children.forEach(child => {
          if (child.path) {
            const Icon = getIconComponent(child.icon);
            links.push({
              label: child.label,
              href: child.path,
              icon: <Icon className="h-5 w-5 flex-shrink-0" />
            });
          }
        });
      }
    });
  });
  
  return links;
};

export function AceternityEnhancedSidebar({ 
  navItems, 
  isMobile = false,
  onMobileClose 
}: AceternityEnhancedSidebarProps) {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebarUI();
  const location = useLocation();

  // Flatten to links (no permissions filter for simplicity)
  const links = useMemo(() => flattenNavItems(navItems), [navItems]);

  return (
    <Sidebar open={!isSidebarCollapsed} setOpen={(open) => setIsSidebarCollapsed(!open)} animate={!isMobile}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center">
            <div className="text-2xl font-bold text-primary">REISTOQ</div>
          </div>
          
          {/* Links */}
          <div className="flex flex-col gap-2">
            {links.map((link, idx) => {
              const isActive = location.pathname === link.href;
              return (
                <SidebarLink
                  key={idx}
                  link={link}
                  className={cn(
                    "rounded-lg px-3 py-2 transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                />
              );
            })}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
