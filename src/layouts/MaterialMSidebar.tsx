import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, TrendingUp, ShoppingCart, Users, FileText, Package, 
  CreditCard, PlusSquare, Settings, UserRound, User, UsersRound, Image,
  Calendar, Notebook, MessageSquare, Boxes, Receipt, Scan, ArrowLeftRight,
  Bell, History, ChevronDown, Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NAV_ITEMS } from "@/config/nav";

interface MaterialMSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Icon mapping for dynamic icon loading
const iconMap: Record<string, any> = {
  LayoutDashboard, TrendingUp, ShoppingCart, Users, FileText, Package,
  CreditCard, PlusSquare, Settings, UserRound, User, UsersRound, Image,
  Calendar, Notebook, MessageSquare, Boxes, Receipt, Scan, ArrowLeftRight,
  Bell, History
};

export function MaterialMSidebar({ collapsed, onToggle }: MaterialMSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Track open state for each collapsible group
  const [groupStates, setGroupStates] = useState<Record<string, boolean>>({
    'Dashboards': true,
    'Apps': true,
    'eCommerce': true,
    'User Profile': true,
  });

  const isActive = (path: string) => currentPath === path;
  
  return (
    <div className={cn(
      "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-[70px]" : "w-[280px]"
    )}>
      {/* Header */}
      <div className="h-[70px] flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">REISTOQ</h1>
              <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="py-4 px-3 space-y-2 overflow-y-auto h-[calc(100vh-140px)]">
        {NAV_ITEMS.map((section) => (
          <Collapsible 
            key={section.group}
            open={groupStates[section.group]} 
            onOpenChange={(open) => setGroupStates(prev => ({ ...prev, [section.group]: open }))}
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs font-semibold uppercase tracking-wider"
              >
                {!collapsed && (
                  <>
                    <span>{section.group}</span>
                    <ChevronDown className={cn("ml-auto h-3 w-3 transition-transform", groupStates[section.group] && "rotate-180")} />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {section.items.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <Collapsible 
                      open={groupStates[item.label]} 
                      onOpenChange={(open) => setGroupStates(prev => ({ ...prev, [item.label]: open }))}
                    >
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                          <div className="flex items-center gap-3">
                            {React.createElement(iconMap[item.icon], { className: "w-4 h-4" })}
                            {!collapsed && <span className="text-sm">{item.label}</span>}
                          </div>
                          {!collapsed && (
                            <ChevronDown className={cn(
                              "h-3 w-3 transition-transform",
                              groupStates[item.label] && "rotate-180"
                            )} />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.label}
                            to={child.path}
                            className={({ isActive }) => cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors",
                              isActive 
                                ? "bg-primary/10 text-primary font-medium" 
                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            {React.createElement(iconMap[child.icon], { className: "w-3 h-3 shrink-0" })}
                            {!collapsed && <span>{child.label}</span>}
                          </NavLink>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      {React.createElement(iconMap[item.icon], { className: "w-4 h-4 shrink-0" })}
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Footer */}
      <div className="h-[70px] flex items-center px-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">J</span>
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">Jonathan Deo</p>
              <p className="text-xs text-sidebar-foreground/60">Designer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}