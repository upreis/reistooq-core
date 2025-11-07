// Estrutura detalhada de permissões por módulo e suas abas
export interface DetailedPermission {
  key: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
}

export const DETAILED_PERMISSIONS: DetailedPermission[] = [
  // DASHBOARD - 1 permissão principal
  {
    key: 'dashboard:view',
    name: 'Acessar Dashboard',
    description: 'Visualizar a página inicial do dashboard',
    category: 'DASHBOARD'
  },

  // VENDAS (OMS) - 4 permissões reais correspondentes às páginas
  {
    key: 'pedidos:marketplace',
    name: 'Marketplace',
    description: 'Acessar página de vendas marketplace (/pedidos)',
    category: 'VENDAS (OMS)'
  },
  {
    key: 'oms:pedidos',
    name: 'Atacado',
    description: 'Acessar página de vendas direta e atacado (/oms/pedidos)',
    category: 'VENDAS (OMS)'
  },
  {
    key: 'oms:clientes',
    name: 'Clientes',
    description: 'Acessar página de clientes (/oms/clientes)',
    category: 'VENDAS (OMS)'
  },
  {
    key: 'oms:configuracoes',
    name: 'Configurações OMS',
    description: 'Acessar página de configurações OMS (/oms/configuracoes)',
    category: 'VENDAS (OMS)'
  },

  // COMPRAS - 1 permissão principal
  {
    key: 'compras:view',
    name: 'Acessar Compras',
    description: 'Acesso ao módulo de compras',
    category: 'COMPRAS'
  },

  // ESTOQUE - 2 permissões principais
  {
    key: 'estoque:view',
    name: 'Acessar Estoque',
    description: 'Acesso ao módulo de estoque',
    category: 'ESTOQUE'
  },
  {
    key: 'estoque:compositions',
    name: 'Composições',
    description: 'Acessar composições de produtos',
    category: 'ESTOQUE'
  },

  // ECOMMERCE - 1 permissão principal
  {
    key: 'ecommerce:view',
    name: 'Acessar eCommerce',
    description: 'Acesso ao módulo eCommerce',
    category: 'ECOMMERCE'
  },

  // CONFIGURAÇÕES - 1 permissão principal
  {
    key: 'configuracoes:view',
    name: 'Acessar Configurações',
    description: 'Acesso às configurações do sistema',
    category: 'CONFIGURAÇÕES'
  },

  // ADMINISTRAÇÃO - 1 permissão principal
  {
    key: 'admin:access',
    name: 'Acessar Administração',
    description: 'Acesso ao módulo de administração',
    category: 'ADMINISTRAÇÃO'
  },

  // APLICATIVOS - 2 permissões
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

  // FERRAMENTAS - 2 permissões principais
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
  }
];