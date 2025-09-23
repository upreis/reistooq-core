import { NavSection } from '@/components/sidebar/enhanced/types/sidebar.types';

export const ENHANCED_NAV_ITEMS: NavSection[] = [
  {
    id: 'dashboards',
    group: 'Dashboards',
    items: [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: 'LayoutDashboard',
        children: [
          {
            id: 'dashboard-inicial',
            label: 'Visão Geral',
            path: '/dashboardinicial',
            icon: 'Home'
          },
          {
            id: 'dashboard-vendas',
            label: 'Dashboard Vendas',
            path: '/dashboard/vendas',
            icon: 'TrendingUp'
          },
          {
            id: 'dashboard-estoque',
            label: 'Dashboard Estoque',
            path: '/dashboard/estoque',
            icon: 'Package'
          },
          {
            id: 'dashboard-financeiro',
            label: 'Dashboard Financeiro',
            path: '/dashboard/financeiro',
            icon: 'DollarSign'
          }
        ]
      },
      {
        id: 'oms',
        label: 'Vendas',
        icon: 'DollarSign',
        children: [
          {
            id: 'vendas-marketplace',
            label: 'Vendas Marketplace',
            path: '/pedidos',
            icon: 'Store'
          },
          {
            id: 'oms-pedidos',
            label: 'Vendas Direta/Atacado',
            path: '/oms/pedidos',
            icon: 'ShoppingCart'
          },
          {
            id: 'oms-clientes',
            label: 'Clientes',
            path: '/oms/clientes',
            icon: 'Users'
          },
          {
            id: 'oms-configuracoes',
            label: 'Configurações OMS',
            path: '/oms/configuracoes',
            icon: 'Settings'
          }
        ]
      },
      {
        id: 'compras',
        label: 'Compras',
        icon: 'ShoppingBag',
        children: [
          {
            id: 'compras-pedidos',
            label: 'Pedidos',
            path: '/compras',
            icon: 'ShoppingCart'
          },
          {
            id: 'compras-cotacoes',
            label: 'Cotações',
            path: '/compras/cotacoes',
            icon: 'Calculator'
          },
          {
            id: 'compras-fornecedores',
            label: 'Fornecedores',
            path: '/compras/fornecedores',
            icon: 'Building2'
          },
          {
            id: 'compras-importacao',
            label: 'Importação',
            path: '/compras/importacao',
            icon: 'Upload'
          }
        ]
      }
    ]
  },
  {
    id: 'applications',
    group: 'Aplicações',
    items: [
      {
        id: 'ecommerce-app',
        label: 'eCommerce',
        icon: 'ShoppingCart',
        children: [
          { 
            id: 'shop', 
            label: 'Loja', 
            path: '/apps/ecommerce/shop', 
            icon: 'ShoppingCart' 
          },
          { 
            id: 'detail', 
            label: 'Detalhes', 
            path: '/apps/ecommerce/detail/1', 
            icon: 'FileText' 
          },
          { 
            id: 'product-list', 
            label: 'Lista de Produtos', 
            path: '/apps/ecommerce/list', 
            icon: 'Package' 
          },
          { 
            id: 'checkout', 
            label: 'Checkout', 
            path: '/apps/ecommerce/checkout', 
            icon: 'CreditCard' 
          },
          { 
            id: 'add-product', 
            label: 'Adicionar Produto', 
            path: '/apps/ecommerce/addproduct', 
            icon: 'PlusSquare' 
          },
          { 
            id: 'edit-product', 
            label: 'Editar Produto', 
            path: '/apps/ecommerce/editproduct', 
            icon: 'Settings' 
          }
        ]
      },
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
          }
        ]
      },
      { 
        id: 'estoque', 
        label: 'Gestão de Estoque', 
        icon: 'Boxes',
        children: [
          {
            id: 'controle-estoque',
            label: 'Controle de Estoque',
            path: '/estoque',
            icon: 'Package'
          },
          {
            id: 'composicoes',
            label: 'Composições',
            path: '/estoque/composicoes',
            icon: 'Layers'
          }
        ]
      },
      { 
        id: 'scanner', 
        label: 'Scanner', 
        path: '/scanner', 
        icon: 'Scan' 
      },
      { 
        id: 'depara', 
        label: 'De-Para', 
        path: '/de-para', 
        icon: 'ArrowLeftRight' 
      },
      { 
        id: 'alertas', 
        label: 'Alertas', 
        path: '/alertas', 
        icon: 'Bell'
      },
      {
        id: 'configuracoes',
        label: 'Configurações',
        icon: 'Settings',
        children: [
          { 
            id: 'integracoes', 
            label: 'Integrações', 
            path: '/configuracoes/integracoes', 
            icon: 'Zap' 
          },
          { 
            id: 'anuncios', 
            label: 'Anúncios', 
            path: '/configuracoes/anuncios', 
            icon: 'Megaphone' 
          },
          { 
            id: 'administracao', 
            label: 'Administração', 
            path: '/configuracoes/administracao', 
            icon: 'UserCheck' 
          },
          { 
            id: 'ml-orders-completas', 
            label: 'Devoluções ML', 
            path: '/ml-orders-completas', 
            icon: 'Database' 
          }
        ]
      },
      { 
        id: 'historico', 
        label: 'Histórico', 
        path: '/historico', 
        icon: 'History' 
      },
      { 
        id: 'admin', 
        label: 'Administração', 
        icon: 'Shield',
        children: [
          {
            id: 'admin-visao-geral',
            label: 'Visão Geral',
            path: '/admin',
            icon: 'LayoutDashboard'
          },
          {
            id: 'admin-usuarios',
            label: 'Usuários',
            path: '/admin/usuarios',
            icon: 'Users'
          },
          {
            id: 'admin-cargos',
            label: 'Cargos',
            path: '/admin/cargos',
            icon: 'UserCheck'
          },
          {
            id: 'admin-convites',
            label: 'Convites',
            path: '/admin/convites',
            icon: 'Mail'
          },
          {
            id: 'admin-alertas',
            label: 'Alertas',
            path: '/admin/alertas',
            icon: 'Bell'
          },
          {
            id: 'admin-seguranca',
            label: 'Segurança',
            path: '/admin/seguranca',
            icon: 'Lock'
          },
          {
            id: 'admin-auditoria',
            label: 'Auditoria',
            path: '/admin/auditoria',
            icon: 'FileSearch'
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