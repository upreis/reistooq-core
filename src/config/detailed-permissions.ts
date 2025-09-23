// Estrutura detalhada de permissões por módulo e suas abas
export interface DetailedPermission {
  key: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
}

export const DETAILED_PERMISSIONS: DetailedPermission[] = [
  // DASHBOARD PERMISSIONS
  {
    key: 'dashboard:view',
    name: 'Acessar Dashboard Principal',
    description: 'Visualizar a página inicial do dashboard',
    category: 'DASHBOARD'
  },
  {
    key: 'dashboard:view_overview',
    name: 'Visão Geral',
    description: 'Acessar aba de visão geral do dashboard',
    category: 'DASHBOARD',
    subcategory: 'Dashboard Principal'
  },
  {
    key: 'dashboard:view_sales',
    name: 'Dashboard Vendas',
    description: 'Acessar aba de dashboard de vendas',
    category: 'DASHBOARD',
    subcategory: 'Dashboard Principal'
  },
  {
    key: 'dashboard:view_inventory',
    name: 'Dashboard Estoque',
    description: 'Acessar aba de dashboard de estoque',
    category: 'DASHBOARD',
    subcategory: 'Dashboard Principal'
  },
  {
    key: 'dashboard:view_financial',
    name: 'Dashboard Financeiro',
    description: 'Acessar aba de dashboard financeiro',
    category: 'DASHBOARD',
    subcategory: 'Dashboard Principal'
  },

  // VENDAS (OMS) PERMISSIONS
  {
    key: 'oms:view',
    name: 'Acessar Módulo OMS',
    description: 'Acesso geral ao módulo de vendas OMS',
    category: 'VENDAS (OMS)'
  },
  {
    key: 'oms:marketplace_orders',
    name: 'Vendas Marketplace',
    description: 'Acessar aba de vendas marketplace',
    category: 'VENDAS (OMS)',
    subcategory: 'Vendas OMS'
  },
  {
    key: 'oms:direct_wholesale_orders',
    name: 'Vendas Direta/Atacado',
    description: 'Acessar aba de vendas direta e atacado',
    category: 'VENDAS (OMS)',
    subcategory: 'Vendas OMS'
  },
  {
    key: 'oms:customers',
    name: 'Clientes OMS',
    description: 'Acessar aba de clientes no módulo OMS',
    category: 'VENDAS (OMS)',
    subcategory: 'Vendas OMS'
  },
  {
    key: 'oms:settings',
    name: 'Configurações OMS',
    description: 'Acessar aba de configurações do OMS',
    category: 'VENDAS (OMS)',
    subcategory: 'Vendas OMS'
  },

  // COMPRAS PERMISSIONS
  {
    key: 'compras:view',
    name: 'Acessar Módulo Compras',
    description: 'Acesso geral ao módulo de compras',
    category: 'COMPRAS'
  },
  {
    key: 'compras:orders',
    name: 'Pedidos de Compra',
    description: 'Acessar aba de pedidos de compra',
    category: 'COMPRAS',
    subcategory: 'Compras'
  },
  {
    key: 'compras:quotes',
    name: 'Cotações',
    description: 'Acessar aba de cotações',
    category: 'COMPRAS',
    subcategory: 'Compras'
  },
  {
    key: 'compras:suppliers',
    name: 'Fornecedores',
    description: 'Acessar aba de fornecedores',
    category: 'COMPRAS',
    subcategory: 'Compras'
  },
  {
    key: 'compras:import',
    name: 'Importação',
    description: 'Acessar aba de importação',
    category: 'COMPRAS',
    subcategory: 'Compras'
  },

  // ESTOQUE PERMISSIONS
  {
    key: 'estoque:view',
    name: 'Acessar Módulo Estoque',
    description: 'Acesso geral ao módulo de estoque',
    category: 'ESTOQUE'
  },
  {
    key: 'estoque:control',
    name: 'Controle de Estoque',
    description: 'Acessar aba de controle de estoque',
    category: 'ESTOQUE',
    subcategory: 'Gestão de Estoque'
  },
  {
    key: 'estoque:compositions',
    name: 'Composições',
    description: 'Acessar aba de composições de produtos',
    category: 'ESTOQUE',
    subcategory: 'Gestão de Estoque'
  },

  // ECOMMERCE PERMISSIONS
  {
    key: 'ecommerce:view',
    name: 'Acessar Módulo eCommerce',
    description: 'Acesso geral ao módulo eCommerce',
    category: 'ECOMMERCE'
  },
  {
    key: 'ecommerce:shop',
    name: 'Loja',
    description: 'Acessar aba da loja',
    category: 'ECOMMERCE',
    subcategory: 'eCommerce'
  },
  {
    key: 'ecommerce:product_details',
    name: 'Detalhes do Produto',
    description: 'Acessar aba de detalhes do produto',
    category: 'ECOMMERCE',
    subcategory: 'eCommerce'
  },
  {
    key: 'ecommerce:product_list',
    name: 'Lista de Produtos',
    description: 'Acessar aba de lista de produtos',
    category: 'ECOMMERCE',
    subcategory: 'eCommerce'
  },
  {
    key: 'ecommerce:checkout',
    name: 'Checkout',
    description: 'Acessar aba de checkout',
    category: 'ECOMMERCE',
    subcategory: 'eCommerce'
  },
  {
    key: 'ecommerce:add_product',
    name: 'Adicionar Produto',
    description: 'Acessar aba de adicionar produto',
    category: 'ECOMMERCE',
    subcategory: 'eCommerce'
  },
  {
    key: 'ecommerce:edit_product',
    name: 'Editar Produto',
    description: 'Acessar aba de editar produto',
    category: 'ECOMMERCE',
    subcategory: 'eCommerce'
  },

  // CONFIGURAÇÕES PERMISSIONS
  {
    key: 'configuracoes:view',
    name: 'Acessar Configurações',
    description: 'Acesso geral às configurações',
    category: 'CONFIGURAÇÕES'
  },
  {
    key: 'configuracoes:integrations',
    name: 'Integrações',
    description: 'Acessar aba de integrações',
    category: 'CONFIGURAÇÕES',
    subcategory: 'Configurações'
  },
  {
    key: 'configuracoes:announcements',
    name: 'Anúncios',
    description: 'Acessar aba de anúncios',
    category: 'CONFIGURAÇÕES',
    subcategory: 'Configurações'
  },
  {
    key: 'configuracoes:administration',
    name: 'Administração',
    description: 'Acessar aba de administração',
    category: 'CONFIGURAÇÕES',
    subcategory: 'Configurações'
  },
  {
    key: 'configuracoes:ml_returns',
    name: 'Devoluções ML',
    description: 'Acessar aba de devoluções do Mercado Livre',
    category: 'CONFIGURAÇÕES',
    subcategory: 'Configurações'
  },

  // ADMINISTRAÇÃO PERMISSIONS
  {
    key: 'admin:access',
    name: 'Acessar Administração',
    description: 'Acesso geral ao módulo de administração',
    category: 'ADMINISTRAÇÃO'
  },
  {
    key: 'admin:overview',
    name: 'Visão Geral Admin',
    description: 'Acessar aba de visão geral da administração',
    category: 'ADMINISTRAÇÃO',
    subcategory: 'Administração'
  },
  {
    key: 'admin:users',
    name: 'Usuários',
    description: 'Acessar aba de usuários',
    category: 'ADMINISTRAÇÃO',
    subcategory: 'Administração'
  },
  {
    key: 'admin:roles',
    name: 'Cargos',
    description: 'Acessar aba de cargos',
    category: 'ADMINISTRAÇÃO',
    subcategory: 'Administração'
  },
  {
    key: 'admin:invites',
    name: 'Convites',
    description: 'Acessar aba de convites',
    category: 'ADMINISTRAÇÃO',
    subcategory: 'Administração'
  },
  {
    key: 'admin:alerts',
    name: 'Alertas Admin',
    description: 'Acessar aba de alertas da administração',
    category: 'ADMINISTRAÇÃO',
    subcategory: 'Administração'
  },
  {
    key: 'admin:security',
    name: 'Segurança',
    description: 'Acessar aba de segurança',
    category: 'ADMINISTRAÇÃO',
    subcategory: 'Administração'
  },
  {
    key: 'admin:audit',
    name: 'Auditoria',
    description: 'Acessar aba de auditoria',
    category: 'ADMINISTRAÇÃO',
    subcategory: 'Administração'
  },
  {
    key: 'admin:profile',
    name: 'Perfil Admin',
    description: 'Acessar aba de perfil da administração',
    category: 'ADMINISTRAÇÃO',
    subcategory: 'Administração'
  },

  // APLICATIVOS PERMISSIONS
  {
    key: 'calendar:view',
    name: 'Calendário Logístico',
    description: 'Acessar aplicativo de calendário logístico',
    category: 'APLICATIVOS'
  },
  {
    key: 'notes:view',
    name: 'Notas',
    description: 'Acessar aplicativo de notas',
    category: 'APLICATIVOS'
  },

  // FERRAMENTAS PERMISSIONS
  {
    key: 'scanner:use',
    name: 'Scanner',
    description: 'Utilizar ferramenta de scanner',
    category: 'FERRAMENTAS'
  },
  {
    key: 'depara:view',
    name: 'De-Para',
    description: 'Acessar ferramenta de de-para',
    category: 'FERRAMENTAS'
  },
  {
    key: 'alerts:view',
    name: 'Alertas',
    description: 'Visualizar alertas do sistema',
    category: 'FERRAMENTAS'
  },
  {
    key: 'historico:view',
    name: 'Histórico',
    description: 'Acessar histórico do sistema',
    category: 'FERRAMENTAS'
  },

  // LEGACY PERMISSIONS (manter compatibilidade)
  {
    key: 'pedidos:view',
    name: 'Visualizar Pedidos',
    description: 'Visualizar lista de pedidos',
    category: 'VENDAS (OMS)'
  },
  {
    key: 'customers:read',
    name: 'Ler Dados de Clientes',
    description: 'Visualizar informações básicas dos clientes',
    category: 'VENDAS (OMS)'
  },
  {
    key: 'integrations:read',
    name: 'Ler Integrações',
    description: 'Visualizar configurações de integrações',
    category: 'CONFIGURAÇÕES'
  }
];