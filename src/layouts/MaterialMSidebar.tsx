import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, Package } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NAV_ITEMS } from "@/config/nav";

interface MaterialMSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}


export function MaterialMSidebar({ collapsed, onToggle }: MaterialMSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({
    Dashboards: true,
    Apps: true,
  });

  const toggleSection = (sectionTitle: string) => {
    setSectionsOpen(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };
  
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
            key={section.title}
            open={sectionsOpen[section.title]} 
            onOpenChange={() => toggleSection(section.title)}
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs font-semibold uppercase tracking-wider"
              >
                {!collapsed && (
                  <>
                    <span>{section.title}</span>
                    <ChevronDown className={cn("ml-auto h-3 w-3 transition-transform", sectionsOpen[section.title] && "rotate-180")} />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end={item.url === "/"}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
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