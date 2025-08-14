import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Scan,
  History,
  Settings,
  Users,
  FileText,
  Calendar,
  Mail,
  Ticket,
  Layers,
  ChevronDown,
  Home,
  TrendingUp,
  ArrowLeftRight,
  AlertTriangle,
  MessageSquare,
  CreditCard
} from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [dashboardsOpen, setDashboardsOpen] = useState(true);
  const [appsOpen, setAppsOpen] = useState(true);
  const [ecommerceOpen, setEcommerceOpen] = useState(true);
  const [userProfileOpen, setUserProfileOpen] = useState(true);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium rounded-lg" 
      : "hover:bg-sidebar-accent text-sidebar-foreground rounded-lg";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          {state !== "collapsed" && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">MaterialM</h1>
              <p className="text-xs text-sidebar-foreground/60">React Admin</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2">
        {/* Dashboards Section */}
        <Collapsible open={dashboardsOpen} onOpenChange={setDashboardsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between text-sidebar-foreground/60 uppercase tracking-wider text-xs font-semibold px-2 py-2">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto font-semibold text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs"
                >
                  <span>Dashboards</span>
                  <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${dashboardsOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {dashboards.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-4 w-4" />
                          {state !== "collapsed" && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Apps Section */}
        <Collapsible open={appsOpen} onOpenChange={setAppsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between text-sidebar-foreground/60 uppercase tracking-wider text-xs font-semibold px-2 py-2">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto font-semibold text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs"
                >
                  <span>Apps</span>
                  <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${appsOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {apps.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.children ? (
                        <Collapsible open={item.title === 'eCommerce' ? ecommerceOpen : userProfileOpen} onOpenChange={item.title === 'eCommerce' ? setEcommerceOpen : setUserProfileOpen}>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <item.icon className="h-4 w-4" />
                                {state !== "collapsed" && <span className="text-sm ml-2">{item.title}</span>}
                              </div>
                              {state !== "collapsed" && <ChevronDown className={`h-3 w-3 transition-transform ${(item.title === 'eCommerce' ? ecommerceOpen : userProfileOpen) ? 'rotate-180' : ''}`} />}
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenu className="ml-4 mt-1">
                              {item.children.map((child) => (
                                <SidebarMenuItem key={child.title}>
                                  <SidebarMenuButton asChild>
                                    <NavLink to={child.url} className={getNavCls}>
                                      <child.icon className="h-3 w-3" />
                                      {state !== "collapsed" && <span className="text-xs">{child.title}</span>}
                                    </NavLink>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </SidebarMenu>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            {state !== "collapsed" && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">J</span>
          </div>
          {state !== "collapsed" && (
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">Jonathan Deo</p>
              <p className="text-xs text-sidebar-foreground/60">Designer</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}