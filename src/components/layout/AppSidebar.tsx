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
];

const apps = [
  { title: "Gestão de Estoque", url: "/estoque", icon: Package },
  { title: "Pedidos", url: "/pedidos", icon: ShoppingCart },
  { title: "Scanner", url: "/scanner", icon: Scan },
  { title: "De-Para", url: "/de-para", icon: ArrowLeftRight },
  { title: "Alertas", url: "/alertas", icon: AlertTriangle },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Contatos", url: "/contacts", icon: Users },
  { title: "Blog", url: "/blog", icon: FileText },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Calendário", url: "/calendar", icon: Calendar },
  { title: "Email", url: "/email", icon: Mail },
  { title: "Faturas", url: "/invoice", icon: CreditCard },
  { title: "Tickets", url: "/tickets", icon: Ticket },
  { title: "Kanban", url: "/kanban", icon: Layers },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [dashboardsOpen, setDashboardsOpen] = useState(true);
  const [appsOpen, setAppsOpen] = useState(true);

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
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
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