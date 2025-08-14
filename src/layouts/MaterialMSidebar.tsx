import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3, Package, ShoppingCart, Scan, History, Settings, 
  Users, FileText, Calendar, Mail, TrendingUp, ArrowLeftRight,
  AlertTriangle, MessageSquare, CreditCard, Home, ChevronDown,
  Menu
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MaterialMSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const dashboards = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "eCommerce", url: "/ecommerce", icon: ShoppingCart },
  { title: "CRM", url: "/dashboards/crm", icon: Users },
];

const apps = [
  { 
    title: "eCommerce", 
    icon: ShoppingCart,
    children: [
      { title: "Shop", url: "/apps/ecommerce/shop", icon: ShoppingCart },
      { title: "Details", url: "/apps/ecommerce/detail/1", icon: FileText },
      { title: "List", url: "/apps/ecommerce/list", icon: Package },
      { title: "Checkout", url: "/apps/ecommerce/checkout", icon: CreditCard },
      { title: "Add Product", url: "/apps/ecommerce/addproduct", icon: Package },
      { title: "Edit Product", url: "/apps/ecommerce/editproduct", icon: Settings },
    ]
  },
  { 
    title: "User Profile", 
    icon: Users,
    children: [
      { title: "Profile", url: "/apps/user-profile/profile", icon: Users },
      { title: "Followers", url: "/apps/user-profile/followers", icon: Users },
      { title: "Friends", url: "/apps/user-profile/friends", icon: Users },
      { title: "Gallery", url: "/apps/user-profile/gallery", icon: Users },
    ]
  },
  { title: "Calendar", url: "/apps/calendar", icon: Calendar },
  { title: "Notes", url: "/apps/notes", icon: FileText },
  { title: "Chats", url: "/apps/chats", icon: MessageSquare },
  { title: "Gestão de Estoque", url: "/estoque", icon: Package },
  { title: "Pedidos", url: "/pedidos", icon: ShoppingCart },
  { title: "Scanner", url: "/scanner", icon: Scan },
  { title: "De-Para", url: "/de-para", icon: ArrowLeftRight },
  { title: "Alertas", url: "/alertas", icon: AlertTriangle },
  { title: "Histórico", url: "/historico", icon: History },
];

export function MaterialMSidebar({ collapsed, onToggle }: MaterialMSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [dashboardsOpen, setDashboardsOpen] = useState(true);
  const [appsOpen, setAppsOpen] = useState(true);
  const [ecommerceOpen, setEcommerceOpen] = useState(true);
  const [userProfileOpen, setUserProfileOpen] = useState(true);

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
        {/* Dashboards Section */}
        <Collapsible open={dashboardsOpen} onOpenChange={setDashboardsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs font-semibold uppercase tracking-wider"
            >
              {!collapsed && (
                <>
                  <span>Dashboards</span>
                  <ChevronDown className={cn("ml-auto h-3 w-3 transition-transform", dashboardsOpen && "rotate-180")} />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {dashboards.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end
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

        {/* Apps Section */}
        <Collapsible open={appsOpen} onOpenChange={setAppsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs font-semibold uppercase tracking-wider"
            >
              {!collapsed && (
                <>
                  <span>Apps</span>
                  <ChevronDown className={cn("ml-auto h-3 w-3 transition-transform", appsOpen && "rotate-180")} />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {apps.map((item) => (
              <div key={item.title}>
                {item.children ? (
                  <Collapsible 
                    open={item.title === 'eCommerce' ? ecommerceOpen : userProfileOpen} 
                    onOpenChange={item.title === 'eCommerce' ? setEcommerceOpen : setUserProfileOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </div>
                        {!collapsed && (
                          <ChevronDown className={cn(
                            "h-3 w-3 transition-transform",
                            (item.title === 'eCommerce' ? ecommerceOpen : userProfileOpen) && "rotate-180"
                          )} />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.title}
                          to={child.url}
                          className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors",
                            isActive 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <child.icon className="w-3 h-3 shrink-0" />
                          {!collapsed && <span>{child.title}</span>}
                        </NavLink>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <NavLink
                    to={item.url}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
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