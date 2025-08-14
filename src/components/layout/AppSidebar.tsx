import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/config/nav";

// Helper function to get icon component from string name
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Package;
};

interface NavItem {
  label: string;
  path?: string;
  icon: string;
  children?: NavItem[];
}

interface MaterialMSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: MaterialMSidebarProps) {
  const location = useLocation();
  
  // State management with localStorage persistence
  const [collapsed, setCollapsed] = useState<boolean>(
    JSON.parse(localStorage.getItem('reistoq.sidebar.collapsed') ?? 'false')
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    JSON.parse(localStorage.getItem('reistoq.sidebar.open') ?? '{}')
  );

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('reistoq.sidebar.collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('reistoq.sidebar.open', JSON.stringify(openGroups));
  }, [openGroups]);

  // Active detection
  const isActive = (path: string) => 
    location.pathname === path || location.pathname.startsWith(path + '/');

  // Auto-open group with active child
  useEffect(() => {
    for (const section of NAV_ITEMS) {
      for (const item of section.items) {
        if (item.children) {
          const hasActiveChild = item.children.some(child => child.path && isActive(child.path));
          if (hasActiveChild) {
            setOpenGroups(prev => ({ ...prev, [item.label]: true }));
          }
        }
      }
    }
  }, [location.pathname]);

  // Scroll active item into view
  useEffect(() => {
    const activeElement = document.querySelector('[data-active="true"]');
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [location.pathname, collapsed]);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const toggleGroup = (groupLabel: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'h-screen bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))]',
        'transition-[width] duration-200 overflow-y-auto',
        collapsed ? 'w-20' : 'w-72',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-lg flex items-center justify-center shrink-0">
            <LucideIcons.Package className="w-5 h-5 text-white" />
          </div>
          <div className={cn(
            'transition-opacity duration-200',
            collapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
          )}>
            <h1 className="text-lg font-bold text-[hsl(var(--sidebar-foreground))] truncate">REISTOQ</h1>
            <p className="text-xs text-[hsl(var(--sidebar-foreground))]/60 truncate">Admin Dashboard</p>
          </div>
          <button
            onClick={toggleCollapsed}
            className={cn(
              'ml-auto p-1.5 rounded-md hover:bg-[hsl(var(--sidebar-accent))] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sidebar-ring))]',
              collapsed && 'mx-auto'
            )}
            aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            <ChevronDown className={cn(
              'h-4 w-4 transition-transform',
              collapsed ? '-rotate-90' : 'rotate-90'
            )} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6">
        {NAV_ITEMS.map((section) => (
          <div key={section.group}>
            {/* Section Label */}
            <div className={cn(
              'transition-opacity duration-200 mb-3',
              collapsed ? 'opacity-0 pointer-events-none h-0' : 'opacity-100'
            )}>
              <h2 className="text-xs font-medium text-[hsl(var(--sidebar-foreground))]/70 uppercase tracking-wider">
                {section.group}
              </h2>
            </div>

            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = getIconComponent(item.icon);
                const hasChildren = item.children && item.children.length > 0;
                const isGroupOpen = openGroups[item.label];
                const hasActiveChild = hasChildren && item.children?.some(child => 
                  child.path && isActive(child.path)
                );

                if (hasChildren) {
                  return (
                    <div key={item.label}>
                      {/* Group Header */}
                      <button
                        onClick={(e) => toggleGroup(item.label, e)}
                        className={cn(
                          'group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sidebar-ring))]',
                          hasActiveChild
                            ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--primary))] border-l-2 border-[hsl(var(--sidebar-ring))]'
                            : 'hover:bg-[hsl(var(--sidebar-accent))]'
                        )}
                        aria-expanded={isGroupOpen}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className={cn(
                          'truncate transition-opacity duration-200',
                          collapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
                        )}>
                          {item.label}
                        </span>
                        <ChevronDown className={cn(
                          'h-4 w-4 ml-auto transition-transform shrink-0',
                          isGroupOpen ? 'rotate-180' : '',
                          collapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
                        )} />
                        {/* Active indicator when collapsed */}
                        {collapsed && hasActiveChild && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--sidebar-ring))] shrink-0" />
                        )}
                      </button>

                      {/* Group Children */}
                      <div
                        className={cn(
                          'mt-1 pl-6 space-y-1 overflow-hidden transition-all duration-200',
                          collapsed ? 'pl-0' : '',
                          collapsed || !isGroupOpen ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
                        )}
                      >
                        {item.children?.map((child) => {
                          const ChildIcon = getIconComponent(child.icon);
                          const childActive = child.path ? isActive(child.path) : false;

                          return (
                            <NavLink
                              key={child.path || child.label}
                              to={child.path || '#'}
                              data-active={childActive}
                              className={cn(
                                'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sidebar-ring))]',
                                childActive
                                  ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--primary))] border-l-2 border-[hsl(var(--sidebar-ring))]'
                                  : 'hover:bg-[hsl(var(--sidebar-accent))]'
                              )}
                            >
                              <ChildIcon className="h-4 w-4 shrink-0" />
                              <span className={cn(
                                'truncate transition-opacity duration-200',
                                collapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
                              )}>
                                {child.label}
                              </span>
                              {/* Active indicator when collapsed */}
                              {collapsed && childActive && (
                                <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--sidebar-ring))] shrink-0" />
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Single item (no children)
                return (
                  <NavLink
                    key={item.path || item.label}
                    to={item.path || '#'}
                    data-active={item.path ? isActive(item.path) : false}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sidebar-ring))]',
                      item.path && isActive(item.path)
                        ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--primary))] border-l-2 border-[hsl(var(--sidebar-ring))]'
                        : 'hover:bg-[hsl(var(--sidebar-accent))]'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={cn(
                      'truncate transition-opacity duration-200',
                      collapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
                    )}>
                      {item.label}
                    </span>
                    {/* Active indicator when collapsed */}
                    {collapsed && item.path && isActive(item.path) && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--sidebar-ring))] shrink-0" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}