export const NAV_ITEMS = [
  {
    group: 'Dashboards',
    items: [
      { label: 'Dashboard',  path: '/',           icon: 'LayoutDashboard' },
      { label: 'Analytics',  path: '/analytics',  icon: 'TrendingUp' },
      { label: 'eCommerce',  path: '/ecommerce',  icon: 'ShoppingCart' },
      { label: 'CRM',        path: '/crm',        icon: 'Users' },
    ],
  },
  {
    group: 'Aplicações',
    items: [
      {
        label: 'eCommerce', icon: 'ShoppingCart', children: [
          { label: 'Loja',              path: '/apps/ecommerce/shop',        icon: 'ShoppingCart' },
          { label: 'Detalhes',          path: '/apps/ecommerce/detail/1',    icon: 'FileText' },
          { label: 'Lista de Produtos', path: '/apps/ecommerce/list',        icon: 'Package' },
          { label: 'Checkout',          path: '/apps/ecommerce/checkout',    icon: 'CreditCard' },
          { label: 'Adicionar Produto', path: '/apps/ecommerce/addproduct',  icon: 'PlusSquare' },
          { label: 'Editar Produto',    path: '/apps/ecommerce/editproduct', icon: 'Settings' },
        ]
      },
      {
        label: 'Perfil do Usuário', icon: 'UserRound', children: [
          { label: 'Perfil',      path: '/apps/user-profile/profile',   icon: 'User' },
          { label: 'Seguidores',  path: '/apps/user-profile/followers', icon: 'Users' },
          { label: 'Amigos',      path: '/apps/user-profile/friends',   icon: 'UsersRound' },
          { label: 'Galeria',     path: '/apps/user-profile/gallery',   icon: 'Image' },
        ]
      },
      { label: 'Calendário',        path: '/apps/calendar',   icon: 'Calendar' },
      { label: 'Notas',             path: '/apps/notes',      icon: 'Notebook' },
      { label: 'Chat',              path: '/apps/chats',      icon: 'MessageSquare' },
      { label: 'Gestão de Estoque', path: '/estoque',         icon: 'Boxes' },
      { label: 'Pedidos',           path: '/pedidos',         icon: 'Receipt' },
      { label: 'Scanner',           path: '/scanner',         icon: 'Scan' },
      { label: 'De-Para',           path: '/de-para',         icon: 'ArrowLeftRight' },
      { label: 'Alertas',           path: '/alertas',         icon: 'Bell' },
      { 
        label: 'Configurações', 
        path: '/configuracoes', 
        icon: 'Settings',
        children: [
          { label: 'Integrações', path: '/configuracoes/integracoes', icon: 'Zap' }
        ]
      },
      { label: 'Histórico',         path: '/historico',       icon: 'History' },
    ],
  },
];