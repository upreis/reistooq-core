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
      ? "bg-sidebar-accent text-sidebar-primary font-medium border-r-2 border-sidebar-primary" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          {state !== "collapsed" && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">REISTOQ</h1>
              <p className="text-xs text-sidebar-foreground/60">Gestão de Estoque</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Dashboards Section */}
        <Collapsible open={dashboardsOpen} onOpenChange={setDashboardsOpen}>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between text-sidebar-foreground/80 uppercase tracking-wider text-xs font-semibold">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto font-semibold text-sidebar-foreground/80 hover:text-sidebar-foreground"
                >
                  <span>Dashboards</span>
                  <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${dashboardsOpen ? 'rotate-180' : ''}`} />
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
                          {state !== "collapsed" && <span>{item.title}</span>}
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
            <SidebarGroupLabel className="flex items-center justify-between text-sidebar-foreground/80 uppercase tracking-wider text-xs font-semibold">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto font-semibold text-sidebar-foreground/80 hover:text-sidebar-foreground"
                >
                  <span>Apps</span>
                  <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${appsOpen ? 'rotate-180' : ''}`} />
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
                          {state !== "collapsed" && <span>{item.title}</span>}
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

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">U</span>
          </div>
          {state !== "collapsed" && (
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">Usuário</p>
              <p className="text-xs text-sidebar-foreground/60">Admin</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}