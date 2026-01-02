import { NavSection } from '@/components/sidebar/enhanced/types/sidebar.types';

export const ENHANCED_NAV_ITEMS: NavSection[] = [
  {
    id: 'main',
    group: '',
    items: [
      // MÓDULOS PRINCIPAIS
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: 'LayoutDashboard',
        permission: 'dashboard:view',
        children: [
          {
            id: 'dashboard-inicial',
            label: 'Visão Geral',
            path: '/dashboardinicial/visao-geral',
            icon: 'Home',
            permission: 'dashboard:view'
          }
        ]
      },
      {
        id: 'oms',
        label: 'Vendas',
        icon: 'TrendingUp',
        permission: 'vendas:view',
        children: [
          {
            id: 'vendas-marketplace',
            label: 'Marketplace',
            path: '/pedidos',
            icon: 'Store',
            permission: 'orders:read'
          },
          {
            id: 'oms-pedidos',
            label: 'Orçamento',
            path: '/oms/pedidos',
            icon: 'ShoppingCart',
            permission: 'orders:read'
          },
          {
            id: 'oms-cadastro',
            label: 'Cadastro',
            path: '/oms/cadastro',
            icon: 'Users',
            permission: 'vendas:view'
          },
          {
            id: 'oms-configuracoes',
            label: 'Configurações OMS',
            path: '/oms/configuracoes',
            icon: 'Settings',
            permission: 'vendas:manage'
          }
        ]
      },
      {
        id: 'compras',
        label: 'Compras',
        icon: 'ShoppingBag',
        permission: 'compras:view',
        children: [
          {
            id: 'compras-pedidos',
            label: 'Pedidos',
            path: '/compras/pedidos',
            icon: 'ShoppingCart',
            permission: 'compras:view'
          },
          {
            id: 'compras-cotacoes',
            label: 'Cotações',
            path: '/compras/cotacoes',
            icon: 'Calculator',
            permission: 'compras:view'
          },
          {
            id: 'compras-fornecedores',
            label: 'Fornecedores',
            path: '/compras/fornecedores',
            icon: 'Building2',
            permission: 'compras:view'
          },
          {
            id: 'compras-importacao',
            label: 'Importação',
            path: '/compras/importacao',
            icon: 'Upload',
            permission: 'compras:manage'
          }
        ]
      },
      { 
        id: 'estoque', 
        label: 'Estoque', 
        icon: 'Package',
        permission: 'estoque:view',
        children: [
          {
            id: 'controle-estoque',
            label: 'Estoque',
            path: '/estoque',
            icon: 'Package',
            permission: 'estoque:view'
          },
          {
            id: 'depara',
            label: 'De-Para',
            path: '/estoque/de-para',
            icon: 'ArrowLeftRight',
            permission: 'estoque:view'
          },
          {
            id: 'composicoes',
            label: 'Produtos',
            path: '/estoque/composicoes',
            icon: 'Layers',
            permission: 'estoque:view'
          },
          {
            id: 'insumos',
            label: 'Insumos',
            path: '/estoque/insumos',
            icon: 'Box',
            permission: 'estoque:view'
          },
          {
            id: 'historico-estoque',
            label: 'Histórico',
            path: '/estoque/historico',
            icon: 'Clock',
            permission: 'estoque:view'
          }
        ]
      },
      
      // FERRAMENTAS E APLICATIVOS
      {
        id: 'aplicativos',
        label: 'Aplicativos',
        icon: 'Grid3X3',
        children: [
          { 
            id: 'calendar', 
            label: 'Calendário Logístico', 
            path: '/aplicativos/calendario', 
            icon: 'Calendar' 
          },
          { 
            id: 'notes', 
            label: 'Notas', 
            path: '/aplicativos/notas', 
            icon: 'Notebook' 
          },
          { 
            id: 'scanner', 
            label: 'Scanner', 
            path: '/aplicativos/scanner', 
            icon: 'Scan' 
          }
        ]
      },
      { 
        id: 'historico', 
        label: 'Histórico', 
        path: '/historico', 
        icon: 'History',
        permission: 'historico:view'
      },
      
      // CONFIGURAÇÕES
      { 
        id: 'admin', 
        label: 'Configurações', 
        icon: 'Settings',
        permission: 'admin:access',
        children: [
          {
            id: 'admin-usuarios',
            label: 'Usuários',
            path: '/admin/usuarios',
            icon: 'Users',
            permission: 'admin:access'
          },
          {
            id: 'admin-alertas',
            label: 'Alertas',
            path: '/admin/alertas',
            icon: 'Bell',
            permission: 'admin:access'
          },
          {
            id: 'admin-integracoes',
            label: 'Integrações',
            path: '/admin/integracoes',
            icon: 'Zap',
            permission: 'admin:access'
          },
          {
            id: 'admin-perfil',
            label: 'Perfil',
            path: '/admin/perfil',
            icon: 'User'
          }
        ]
      }
    ]
  }
];

// Configuration for the enhanced sidebar
export const SIDEBAR_CONFIG = {
  expandedWidth: 264,
  collapsedWidth: 72,
  hoverOpenDelay: 120,
  hoverCloseDelay: 200,
  zIndexFlyout: 80,
  persistKey: 'ui.sidebar.expanded',
  animationDuration: 200
};

export const SIDEBAR_BEHAVIORS = {
  flyoutPortal: true,
  openOnHover: true,
  touchTapToExpand: true,
  closeOnRouteChange: true,
  autoCollapseOnMobile: true
};

export const SIDEBAR_A11Y = {
  ariaRole: 'navigation',
  keyboard: true,
  escapeClosesFlyout: true,
  announcements: true
};

export const KEYBOARD_SHORTCUTS = {
  toggle: 'Ctrl+B',
  search: 'Ctrl+K',
  escape: 'Escape'
};