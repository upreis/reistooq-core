import React from "react";
import { Bell, Search, Settings, User, Moon, Sun, Grid3X3, Flag, Plus, ChevronDown, Megaphone, LogOut, TriangleAlert } from "lucide-react";
import { useLocation } from "react-router-dom";
import { OMSNavLimelight } from "@/features/oms/components/OMSNavLimelight";
import { DashboardInicialNav } from "@/features/dashboard/components/DashboardInicialNav";
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QuickAppsModal } from "@/components/layout/QuickAppsModal";
import { useAnnouncements } from "@/contexts/AnnouncementContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarUI } from "@/context/SidebarUIContext";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";

export default function Header() {
  const location = useLocation();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen, isSidebarCollapsed, setIsSidebarCollapsed } = useSidebarUI();
  const { isHidden, setIsHidden, hasAnnouncements, isCollapsed, setIsCollapsed } = useAnnouncements();
  const { user, signOut } = useAuth();
  const { profile, displayName, fullName, initials } = useCurrentProfile();

  const handleSignOut = async () => {
    await signOut();
  };

  // Função para obter o breadcrumb baseado na rota atual
  const getBreadcrumb = () => {
    const path = location.pathname;
    
    // Dashboard Inicial
    if (path.startsWith('/dashboardinicial/visao-geral')) return { icon: '📊', label: 'Dashboard / Visão Geral' };
    if (path.startsWith('/dashboardinicial/vendas')) return { icon: '💰', label: 'Dashboard / Vendas' };
    if (path.startsWith('/dashboardinicial/estoque')) return { icon: '📦', label: 'Dashboard / Estoque' };
    if (path.startsWith('/dashboardinicial/analises')) return { icon: '📈', label: 'Dashboard / Análises' };
    if (path.startsWith('/dashboardinicial')) return { icon: '📊', label: 'Dashboard' };
    
    // OMS
    if (path.startsWith('/oms')) return { icon: '🎯', label: 'OMS' };
    
    // Compras
    if (path.startsWith('/compras/pedidos')) return { icon: '🛒', label: 'Compras / Pedidos' };
    if (path.startsWith('/compras/fornecedores')) return { icon: '🏭', label: 'Compras / Fornecedores' };
    if (path.startsWith('/compras/cotacoes')) return { icon: '💵', label: 'Compras / Cotações' };
    if (path.startsWith('/compras/importacao')) return { icon: '📥', label: 'Compras / Importação' };
    if (path.startsWith('/compras')) return { icon: '🛒', label: 'Compras' };
    
    // Estoque
    if (path.startsWith('/estoque')) return { icon: '📦', label: 'Estoque' };
    if (path.startsWith('/category-manager')) return { icon: '🏷️', label: 'Categorias' };
    
    // Pedidos e Vendas
    if (path === '/pedidos') return { icon: '📦', label: 'Vendas' };
    if (path.startsWith('/vendas-online')) return { icon: '🛍️', label: 'Vendas Online' };
    if (path.startsWith('/ml-orders-completas')) return { icon: '↩️', label: 'Devoluções de Vendas' };
    if (path.startsWith('/devolucoes-ml')) return { icon: '📮', label: 'Devoluções ML' };
    if (path.startsWith('/reclamacoes')) return { icon: '⚠️', label: 'Reclamações' };
    
    // Ferramentas
    if (path.startsWith('/scanner')) return { icon: '📷', label: 'Scanner' };
    if (path.startsWith('/de-para')) return { icon: '🔄', label: 'De-Para' };
    if (path.startsWith('/alertas')) return { icon: '🔔', label: 'Alertas' };
    
    // Configurações
    if (path.startsWith('/configuracoes/integracoes')) return { icon: '🔌', label: 'Configurações / Integrações' };
    if (path.startsWith('/configuracoes/anuncios')) return { icon: '📢', label: 'Configurações / Avisos' };
    if (path.startsWith('/configuracoes')) return { icon: '⚙️', label: 'Configurações' };
    if (path.startsWith('/historico')) return { icon: '📜', label: 'Histórico' };
    
    // Aplicativos
    if (path.startsWith('/aplicativos/calendario')) return { icon: '📅', label: 'Aplicativos / Calendário' };
    if (path.startsWith('/aplicativos/notas')) return { icon: '📝', label: 'Aplicativos / Notas' };
    if (path.startsWith('/aplicativos')) return { icon: '🎨', label: 'Aplicativos' };
    
    // Admin
    if (path.startsWith('/admin/usuarios')) return { icon: '👥', label: 'Admin / Usuários' };
    if (path.startsWith('/admin/cargos')) return { icon: '🎭', label: 'Admin / Cargos' };
    if (path.startsWith('/admin/convites')) return { icon: '✉️', label: 'Admin / Convites' };
    if (path.startsWith('/admin/alertas')) return { icon: '🚨', label: 'Admin / Alertas' };
    if (path.startsWith('/admin/seguranca')) return { icon: '🔒', label: 'Admin / Segurança' };
    if (path.startsWith('/admin/auditoria')) return { icon: '📋', label: 'Admin / Auditoria' };
    if (path.startsWith('/admin/perfil')) return { icon: '👤', label: 'Admin / Perfil' };
    if (path.startsWith('/admin')) return { icon: '🛡️', label: 'Administração' };
    
    // eCommerce
    if (path.startsWith('/apps/ecommerce/shop')) return { icon: '🛒', label: 'eCommerce / Loja' };
    if (path.startsWith('/apps/ecommerce/detail')) return { icon: '🔍', label: 'eCommerce / Detalhes' };
    if (path.startsWith('/apps/ecommerce/list')) return { icon: '📋', label: 'eCommerce / Produtos' };
    if (path.startsWith('/apps/ecommerce/addproduct')) return { icon: '➕', label: 'eCommerce / Adicionar' };
    if (path.startsWith('/apps/ecommerce/editproduct')) return { icon: '✏️', label: 'eCommerce / Editar' };
    if (path.startsWith('/apps/ecommerce')) return { icon: '🛒', label: 'eCommerce' };
    
    return null;
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className={`sticky z-40 bg-background border-b transition-all duration-300 ${hasAnnouncements && !isCollapsed && !isHidden ? 'top-12' : 'top-0'}`}>
      <div className="flex items-center gap-2 px-4 h-14">
        {/* Desktop Sidebar Toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded p-2 border ml-2"
          aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          data-testid="sidebar-desktop-toggle"
        >
          {isSidebarCollapsed ? (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-4">
          {breadcrumb && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{breadcrumb.icon}</span>
              <span>/</span>
              <span className="text-primary">{breadcrumb.label}</span>
            </div>
          )}
        </div>

        {/* Navigation - Centered */}
        <div className="flex-1 flex justify-center">
          {location.pathname === '/pedidos' && <OMSNavLimelight />}
          {location.pathname.startsWith('/dashboardinicial') && <DashboardInicialNav />}
          {location.pathname.startsWith('/estoque') && <EstoqueNav />}
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-3">
          {/* Language/Country Flag */}
          <Button variant="ghost" size="icon">
            <Flag className="h-5 w-5" />
          </Button>
          
          {/* Quick Apps */}
          <QuickAppsModal />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Plus/Add Button */}
          <Button variant="ghost" size="icon">
            <Plus className="h-5 w-5" />
          </Button>

          {/* Banner Expand Button - only show when collapsed and has announcements */}
          {hasAnnouncements && isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsCollapsed(false)}
              title="Expandir anúncios"
              className="text-amber-400 hover:text-amber-300"
            >
              <TriangleAlert className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          )}

          {/* Announcement Expand Button - only show when hidden and has announcements */}
          {isHidden && hasAnnouncements && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsHidden(false)}
              title="Mostrar anúncios"
              className="text-foreground hover:text-foreground"
            >
              <Megaphone className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url} alt={fullName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{profile?.cargo || 'Usuário'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile?.avatar_url} alt={fullName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{fullName}</p>
                  <p className="text-xs text-muted-foreground">{profile?.cargo || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Meu Perfil</p>
                  <p className="text-xs text-muted-foreground">Configurações da conta</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Minhas Notas</p>
                  <p className="text-xs text-muted-foreground">Notas diárias</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Minhas Tarefas</p>
                  <p className="text-xs text-muted-foreground">Lista de tarefas diárias</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sair</p>
                  <p className="text-xs text-muted-foreground">Fazer logout</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}