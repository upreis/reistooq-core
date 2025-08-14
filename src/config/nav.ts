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
    group: 'Apps',
    items: [
      {
        label: 'eCommerce', icon: 'ShoppingCart', children: [
          { label: 'Shop',         path: '/apps/ecommerce/shop',        icon: 'ShoppingCart' },
          { label: 'Details',      path: '/apps/ecommerce/detail/1',    icon: 'FileText' },
          { label: 'List',         path: '/apps/ecommerce/list',        icon: 'Package' },
          { label: 'Checkout',     path: '/apps/ecommerce/checkout',    icon: 'CreditCard' },
          { label: 'Add Product',  path: '/apps/ecommerce/addproduct',  icon: 'PlusSquare' },
          { label: 'Edit Product', path: '/apps/ecommerce/editproduct', icon: 'Settings' },
        ]
      },
      {
        label: 'User Profile', icon: 'UserRound', children: [
          { label: 'Profile',   path: '/apps/user-profile/profile',   icon: 'User' },
          { label: 'Followers', path: '/apps/user-profile/followers', icon: 'Users' },
          { label: 'Friends',   path: '/apps/user-profile/friends',   icon: 'UsersRound' },
          { label: 'Gallery',   path: '/apps/user-profile/gallery',   icon: 'Image' },
        ]
      },
      { label: 'Calendar',          path: '/apps/calendar',   icon: 'Calendar' },
      { label: 'Notes',             path: '/apps/notes',      icon: 'Notebook' },
      { label: 'Chats',             path: '/apps/chats',      icon: 'MessageSquare' },
      { label: 'Gestão de Estoque', path: '/estoque',         icon: 'Boxes' },
      { label: 'Pedidos',           path: '/pedidos',         icon: 'Receipt' },
      { label: 'Scanner',           path: '/scanner',         icon: 'Scan' },
      { label: 'De-Para',           path: '/de-para',         icon: 'ArrowLeftRight' },
      { label: 'Alertas',           path: '/alertas',         icon: 'Bell' },
      { label: 'Histórico',         path: '/historico',       icon: 'History' },
    ],
  },
];