import React from "react";
import { Bell, Search, Settings, User, Moon, Sun, Grid3X3, Flag, Plus, ChevronDown, Megaphone, LogOut, TriangleAlert } from "lucide-react";
import { useLocation } from "react-router-dom";
import visaoGeralIcon from "@/assets/dashboard-visao-geral-icon.png";
import pedidosIcon from "@/assets/pedidos-icon.png";
import vendasOnlineIcon from "@/assets/vendas-online-icon.png";
import reclamacoesIcon from "@/assets/icons/reclamacoes-icon.png";
import comprasPedidosIcon from "@/assets/compras-pedidos-icon.png";
import comprasCotacoesIcon from "@/assets/compras-cotacoes-icon.png";
import comprasFornecedoresIcon from "@/assets/compras-fornecedores-icon.png";
import comprasImportacaoIcon from "@/assets/compras-importacao-icon.png";
import estoqueIcon from "@/assets/estoque-icon.png";
import estoqueComposicoesIcon from "@/assets/estoque-composicoes-icon.png";
import estoqueHistoricoIcon from "@/assets/estoque-historico-icon.png";
import aplicativosCalendarioIcon from "@/assets/aplicativos-calendario-icon.png";
import aplicativosNotasIcon from "@/assets/aplicativos-notas-icon.png";
import configuracoesIntegracoesIcon from "@/assets/configuracoes-integracoes-icon.png";
import configuracoesAnunciosIcon from "@/assets/configuracoes-anuncios-icon.png";
import adminIcon from "@/assets/admin-icon.png";
import adminUsuariosIcon from "@/assets/admin-usuarios-icon.png";
import adminCargosIcon from "@/assets/admin-cargos-icon.png";
import adminConvitesIcon from "@/assets/admin-convites-icon.png";
import adminAlertasIcon from "@/assets/admin-alertas-icon.png";
import adminSegurancaIcon from "@/assets/admin-seguranca-icon.png";
import adminAuditoriaIcon from "@/assets/admin-auditoria-icon.png";
import adminPerfilIcon from "@/assets/admin-perfil-icon.png";
import ecommerceShopIcon from "@/assets/ecommerce-shop-icon.png";
import ecommerceListIcon from "@/assets/ecommerce-list-icon.png";
import ecommerceAddProductIcon from "@/assets/ecommerce-addproduct-icon.png";
import ecommerceImportIcon from "@/assets/ecommerce-import-icon.png";
import scannerIcon from "@/assets/scanner-icon.png";
import deParaIcon from "@/assets/de-para-icon.png";
import alertasIcon from "@/assets/alertas-icon.png";
import historicoIcon from "@/assets/historico-icon.png";
import devolucoesdevendaIcon from "@/assets/icons/devolucoes-venda-icon.png";
import pedidosOmsIcon from "@/assets/pedidos-oms-icon.png";
import clientesOmsIcon from "@/assets/clientes-oms-icon.png";
import configuracoesOmsIcon from "@/assets/configuracoes-oms-icon.png";
import vendedoresOmsIcon from "@/assets/vendedores-oms-icon.png";
import dashboardVendasIcon from "@/assets/dashboard-vendas-icon.png";
import dashboardEstoqueIcon from "@/assets/dashboard-estoque-icon.png";
import dashboardAnalisesIcon from "@/assets/dashboard-analises-icon.png";
import { OMSNavLimelight } from "@/features/oms/components/OMSNavLimelight";
import { DashboardInicialNav } from "@/features/dashboard/components/DashboardInicialNav";
import { EstoqueNav } from "@/features/estoque/components/EstoqueNav";
import { ComprasNavLimelight } from "@/features/compras/components/ComprasNavLimelight";
import { AplicativosNavLimelight } from "@/features/aplicativos/components/AplicativosNavLimelight";
import { ConfiguracoesNavLimelight } from "@/features/configuracoes/components/ConfiguracoesNavLimelight";
import { AdminNavLimelight } from "@/features/admin/components/AdminNavLimelight";
import { EcommerceNavLimelight } from "@/features/ecommerce/components/EcommerceNavLimelight";
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
// NotificacoesPanel removido temporariamente

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
    if (path.startsWith('/dashboardinicial/visao-geral')) return { icon: visaoGeralIcon, label: 'Dashboard / Visão Geral', isImage: true };
    if (path.startsWith('/dashboardinicial/vendas')) return { icon: dashboardVendasIcon, label: 'Dashboard / Vendas', isImage: true };
    if (path.startsWith('/dashboardinicial/estoque')) return { icon: dashboardEstoqueIcon, label: 'Dashboard / Estoque', isImage: true };
    if (path.startsWith('/dashboardinicial/analises')) return { icon: dashboardAnalisesIcon, label: 'Dashboard / Análises', isImage: true };
    if (path.startsWith('/dashboardinicial')) return { icon: '📊', label: 'Dashboard' };
    
    // OMS
    if (path.startsWith('/oms/pedidos')) return { icon: pedidosOmsIcon, label: 'Pedidos', isImage: true };
    if (path.startsWith('/oms/clientes')) return { icon: clientesOmsIcon, label: 'Clientes', isImage: true };
    if (path.startsWith('/oms/vendedores')) return { icon: vendedoresOmsIcon, label: 'Vendedores', isImage: true };
    if (path.startsWith('/oms/configuracoes')) return { icon: configuracoesOmsIcon, label: 'Configurações', isImage: true };
    if (path.startsWith('/oms')) return { icon: '🎯', label: 'OMS' };
    
    // Compras
    if (path.startsWith('/compras/pedidos')) return { icon: comprasPedidosIcon, label: 'Compras / Pedidos', isImage: true };
    if (path.startsWith('/compras/fornecedores')) return { icon: comprasFornecedoresIcon, label: 'Compras / Fornecedores', isImage: true };
    if (path.startsWith('/compras/cotacoes')) return { icon: comprasCotacoesIcon, label: 'Compras / Cotações', isImage: true };
    if (path.startsWith('/compras/importacao')) return { icon: comprasImportacaoIcon, label: 'Compras / Importação', isImage: true };
    if (path.startsWith('/compras')) return { icon: '🛒', label: 'Compras' };
    
    // Aplicativos
    if (path.startsWith('/aplicativos/calendario')) return { icon: aplicativosCalendarioIcon, label: 'Aplicativos / Calendário', isImage: true };
    if (path.startsWith('/aplicativos/notas')) return { icon: aplicativosNotasIcon, label: 'Aplicativos / Notas', isImage: true };
    
    // Misc
    if (path.startsWith('/historico')) return { icon: historicoIcon, label: 'Histórico', isImage: true };
    if (path.startsWith('/alertas')) return { icon: alertasIcon, label: 'Alertas', isImage: true };
    if (path.startsWith('/de-para')) return { icon: deParaIcon, label: 'De-Para', isImage: true };
    if (path.startsWith('/scanner')) return { icon: scannerIcon, label: 'Scanner', isImage: true };
    
    // Configurações
    if (path.startsWith('/configuracoes/integracoes')) return { icon: configuracoesIntegracoesIcon, label: 'Configurações / Integrações', isImage: true };
    if (path.startsWith('/configuracoes/anuncios')) return { icon: configuracoesAnunciosIcon, label: 'Configurações / Anúncios', isImage: true };
    
    // Apps/Ecommerce
    if (path.startsWith('/apps/ecommerce/import')) return { icon: ecommerceImportIcon, label: 'Apps / Ecommerce / Importar', isImage: true };
    if (path.startsWith('/apps/ecommerce/addproduct')) return { icon: ecommerceAddProductIcon, label: 'Apps / Ecommerce / Adicionar', isImage: true };
    if (path.startsWith('/apps/ecommerce/list')) return { icon: ecommerceListIcon, label: 'Apps / Ecommerce / Produtos', isImage: true };
    if (path.startsWith('/apps/ecommerce/shop')) return { icon: ecommerceShopIcon, label: 'Apps / Ecommerce / Loja', isImage: true };
    
    // Admin
    if (path.startsWith('/admin/perfil')) return { icon: adminPerfilIcon, label: 'Admin / Perfil', isImage: true };
    if (path.startsWith('/admin/auditoria')) return { icon: adminAuditoriaIcon, label: 'Admin / Auditoria', isImage: true };
    if (path.startsWith('/admin/seguranca')) return { icon: adminSegurancaIcon, label: 'Admin / Segurança', isImage: true };
    if (path.startsWith('/admin/alertas')) return { icon: adminAlertasIcon, label: 'Admin / Alertas', isImage: true };
    if (path.startsWith('/admin/convites')) return { icon: adminConvitesIcon, label: 'Admin / Convites', isImage: true };
    if (path.startsWith('/admin/cargos')) return { icon: adminCargosIcon, label: 'Admin / Cargos', isImage: true };
    if (path.startsWith('/admin/usuarios')) return { icon: adminUsuariosIcon, label: 'Admin / Usuários', isImage: true };
    if (path.startsWith('/admin')) return { icon: adminIcon, label: 'Admin', isImage: true };
    
    // Estoque
    if (path.startsWith('/estoque/historico')) return { icon: estoqueHistoricoIcon, label: 'Estoque / Histórico', isImage: true };
    if (path.startsWith('/estoque/composicoes')) return { icon: estoqueComposicoesIcon, label: 'Estoque / Composições', isImage: true };
    if (path.startsWith('/estoque')) return { icon: estoqueIcon, label: 'Estoque', isImage: true };
    if (path.startsWith('/category-manager')) return { icon: '🏷️', label: 'Categorias' };
    
    // Pedidos e Vendas
    if (path === '/pedidos') return { icon: pedidosIcon, label: 'Vendas', isImage: true };
    if (path.startsWith('/vendas-online')) return { icon: vendasOnlineIcon, label: 'Vendas Online', isImage: true };
    
    if (path.startsWith('/devolucoesdevenda')) return { icon: devolucoesdevendaIcon, label: 'Devoluções de Venda', isImage: true };
    if (path.startsWith('/reclamacoes')) return { icon: reclamacoesIcon, label: 'Reclamações', isImage: true };
    
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
    <header className={`sticky z-40 bg-card border-b transition-all duration-300 ${hasAnnouncements && !isCollapsed && !isHidden ? 'top-12' : 'top-0'}`}>
      <div className="flex items-center gap-2 h-14" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        {/* Desktop Sidebar Toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded p-2 border"
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
              {breadcrumb.isImage ? (
                <img src={breadcrumb.icon} alt="" className="w-10 h-10 object-contain" />
              ) : (
                <span>{breadcrumb.icon}</span>
              )}
              <span>/</span>
              <span className="text-primary">{breadcrumb.label}</span>
            </div>
          )}
        </div>

        {/* Navigation - Centered */}
        <div className="flex-1 flex justify-center">
          {(location.pathname === '/pedidos' || location.pathname.startsWith('/oms') || location.pathname === '/reclamacoes' || location.pathname === '/vendas-online' || location.pathname === '/devolucoesdevenda') && <OMSNavLimelight />}
          {location.pathname.startsWith('/dashboardinicial') && <DashboardInicialNav />}
          {location.pathname.startsWith('/estoque') && <EstoqueNav />}
          {location.pathname.startsWith('/compras') && <ComprasNavLimelight />}
          {location.pathname.startsWith('/aplicativos') && <AplicativosNavLimelight />}
          {location.pathname.startsWith('/configuracoes') && <ConfiguracoesNavLimelight />}
          {location.pathname.startsWith('/admin') && <AdminNavLimelight />}
          {location.pathname.startsWith('/apps/ecommerce') && <EcommerceNavLimelight />}
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

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

          {/* Painel de notificações removido temporariamente */}

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