import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

interface NavigationItemProps {
  item: NavItem;
  collapsed: boolean;
  currentPath: string;
}

function NavigationItem({ item, collapsed, currentPath }: NavigationItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = getIconComponent(item.icon);
  const hasChildren = item.children && item.children.length > 0;
  
  // Check if any child is active
  const isChildActive = hasChildren && item.children?.some(child => 
    child.path === currentPath || (child.path && currentPath.startsWith(child.path))
  );
  
  const isActive = item.path === currentPath || isChildActive;

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton 
            className={`w-full justify-between ${isChildActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && (
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {!collapsed && (
          <CollapsibleContent className="ml-6">
            <SidebarMenu>
              {item.children?.map((child) => (
                <SidebarMenuItem key={child.path || child.label}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={child.path || '#'} 
                      className={({ isActive }) => 
                        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
                      }
                    >
                      {(() => {
                        const ChildIcon = getIconComponent(child.icon);
                        return <ChildIcon className="h-4 w-4" />;
                      })()}
                      <span>{child.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  }

  return (
    <SidebarMenuButton asChild>
      <NavLink 
        to={item.path || '#'} 
        className={({ isActive }) => 
          isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
        }
      >
        <Icon className="h-4 w-4" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    </SidebarMenuButton>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LucideIcons.Package className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">REISTOQ</h1>
              <p className="text-xs text-sidebar-foreground/60">Admin Dashboard</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2">
        {NAV_ITEMS.map((section) => (
          <SidebarGroup key={section.group}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider mb-2">
                {section.group}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.path || item.label}>
                    <NavigationItem 
                      item={item} 
                      collapsed={collapsed} 
                      currentPath={currentPath} 
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}