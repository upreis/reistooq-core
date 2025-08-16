import React, { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/config/nav";
import { useSidebarUI } from "@/context/SidebarUIContext";

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

export default function Sidebar() {
  const { isSidebarCollapsed, setIsSidebarCollapsed, isMobileSidebarOpen, setIsMobileSidebarOpen } = useSidebarUI();
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  // State management for open groups (desktop only)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    JSON.parse(localStorage.getItem('reistoq.sidebar.open') ?? '{}')
  );

  // Persist open groups state
  useEffect(() => {
    localStorage.setItem('reistoq.sidebar.open', JSON.stringify(openGroups));
  }, [openGroups]);

  // Foco quando abre no mobile
  useEffect(() => {
    if (isMobileSidebarOpen) panelRef.current?.focus();
  }, [isMobileSidebarOpen]);

  // Active detection
  const isActive = (path: string) => 
    location.pathname === path || location.pathname.startsWith(path + '/');

  // Auto-open group with active child
  useEffect(() => {
    for (const section of NAV_ITEMS) {
      for (const item of section.items) {
        if (item.children) {
          const hasActiveChild = item.children.some(child => child.path && isActive(child.path));
          if (hasActiveChild && !isSidebarCollapsed) {
            setOpenGroups(prev => ({ ...prev, [item.label]: true }));
          }
        }
      }
    }
  }, [location.pathname, isSidebarCollapsed]);

  const toggleGroup = (groupLabel: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSidebarCollapsed) {
      setOpenGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
    }
  };

  // Classes de largura (desktop)
  const desktopWidth = isSidebarCollapsed ? "md:w-[72px]" : "md:w-72";

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-lg flex items-center justify-center shrink-0">
            <LucideIcons.Package className="w-5 h-5 text-white" />
          </div>
          <div className={cn(
            'transition-opacity duration-200',
            !isMobile && isSidebarCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
          )}>
            <h1 className="text-lg font-bold text-[hsl(var(--sidebar-foreground))] truncate">REISTOQ</h1>
            <p className="text-xs text-[hsl(var(--sidebar-foreground))]/60 truncate">Admin Dashboard</p>
          </div>
          {/* DO NOT add desktop collapse/expand buttons here. Desktop toggle lives in Header; rail lives in FullLayout. */}
          {isMobile && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="ml-auto p-1.5 rounded-md hover:bg-[hsl(var(--sidebar-accent))] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sidebar-ring))]"
              aria-label="Fechar menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((section) => (
          <div key={section.group}>
            {/* Section Label */}
            <div className={cn(
              'transition-opacity duration-200 mb-3',
              !isMobile && isSidebarCollapsed ? 'opacity-0 pointer-events-none h-0' : 'opacity-100'
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
                        title={!isMobile && isSidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className="h-5 w-5 shrink-0 font-bold stroke-[2.5]" />
                        <span className={cn(
                          'truncate transition-opacity duration-200',
                          !isMobile && isSidebarCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
                        )}>
                          {item.label}
                        </span>
                        <ChevronDown className={cn(
                          'h-4 w-4 ml-auto transition-transform shrink-0',
                          isGroupOpen ? 'rotate-180' : '',
                          !isMobile && isSidebarCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
                        )} />
                        {/* Active indicator when collapsed */}
                        {!isMobile && isSidebarCollapsed && hasActiveChild && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--sidebar-ring))] shrink-0" />
                        )}
                      </button>

                      {/* Group Children */}
                      <div
                        className={cn(
                          'mt-1 pl-6 space-y-1 overflow-hidden transition-all duration-200',
                          !isMobile && isSidebarCollapsed ? 'pl-0' : '',
                          (!isMobile && isSidebarCollapsed) || !isGroupOpen ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
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
                              title={!isMobile && isSidebarCollapsed ? child.label : undefined}
                            >
                              <ChildIcon className="h-4 w-4 shrink-0 font-bold stroke-[2.5]" />
                              <span className={cn(
                                'truncate transition-opacity duration-200',
                                !isMobile && isSidebarCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
                              )}>
                                {child.label}
                              </span>
                              {/* Active indicator when collapsed */}
                              {!isMobile && isSidebarCollapsed && childActive && (
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
                    title={!isMobile && isSidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0 font-bold stroke-[2.5]" />
                    <span className={cn(
                      'truncate transition-opacity duration-200',
                      !isMobile && isSidebarCollapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
                    )}>
                      {item.label}
                    </span>
                    {/* Active indicator when collapsed */}
                    {!isMobile && isSidebarCollapsed && item.path && isActive(item.path) && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-[hsl(var(--sidebar-ring))] shrink-0" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Drawer Mobile */}
      <div
        id="app-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Menu lateral"
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "fixed z-40 inset-y-0 left-0 w-72 bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))] outline-none",
          "transform transition-transform duration-300 ease-out",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:hidden"
        )}
      >
        <SidebarContent isMobile={true} />
      </div>

      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:shrink-0 bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))]",
          "transition-[width] duration-200 overflow-y-auto",
          desktopWidth
        )}
      >
        <SidebarContent isMobile={false} />
      </aside>
    </>
  );
}