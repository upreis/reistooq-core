import { NavSection } from '@/components/sidebar/enhanced/types/sidebar.types';

export const ENHANCED_NAV_ITEMS: NavSection[] = [
  {
    id: 'dashboards',
    group: 'Dashboards',
    items: [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        path: '/', 
        icon: 'LayoutDashboard' 
      },
      {
        id: 'oms',
        label: 'Vendas',
        icon: 'ShoppingBag',
        children: [
          {
            id: 'oms-dashboard',
            label: 'Dashboard OMS',
            path: '/oms',
            icon: 'BarChart3'
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
            id: 'oms-fornecedores',
            label: 'Fornecedores',
            path: '/oms/fornecedores',
            icon: 'Building'
          },
          {
            id: 'oms-relatorios',
            label: 'Relatórios',
            path: '/oms/relatorios',
            icon: 'FileBarChart'
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
        id: 'analytics',
        label: 'Analytics',
        path: '/analytics',
        icon: 'TrendingUp'
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
        id: 'user-profile',
        label: 'Perfil do Usuário',
        icon: 'UserRound',
        children: [
          { 
            id: 'profile', 
            label: 'Perfil', 
            path: '/apps/user-profile/profile', 
            icon: 'User' 
          },
          { 
            id: 'followers', 
            label: 'Seguidores', 
            path: '/apps/user-profile/followers', 
            icon: 'Users' 
          },
          { 
            id: 'friends', 
            label: 'Amigos', 
            path: '/apps/user-profile/friends', 
            icon: 'UsersRound' 
          },
          { 
            id: 'gallery', 
            label: 'Galeria', 
            path: '/apps/user-profile/gallery', 
            icon: 'Image' 
          }
        ]
      },
      { 
        id: 'calendar', 
        label: 'Calendário', 
        path: '/apps/calendar', 
        icon: 'Calendar' 
      },
      { 
        id: 'notes', 
        label: 'Notas', 
        path: '/apps/notes', 
        icon: 'Notebook' 
      },
      { 
        id: 'estoque', 
        label: 'Gestão de Estoque', 
        path: '/estoque', 
        icon: 'Boxes' 
      },
      { 
        id: 'pedidos', 
        label: 'Vendas Marketplace', 
        path: '/pedidos', 
        icon: 'Receipt'
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
        path: '/admin', 
        icon: 'Shield' 
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