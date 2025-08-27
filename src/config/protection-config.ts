// 🛡️ CONFIGURAÇÃO DO SISTEMA DE PROTEÇÃO
// Este arquivo define quais páginas e componentes são protegidos contra modificações

export const PROTECTED_PAGES = {
  // Páginas principais protegidas
  PEDIDOS: {
    path: '/pedidos',
    files: [
      'src/pages/Pedidos.tsx',
      'src/components/pedidos/SimplePedidosPage.tsx',
      'src/components/pedidos/PedidosTable.tsx',
      'src/components/pedidos/PedidosTableMemo.tsx',
      'src/components/pedidos/PedidosFilters.tsx',
      'src/core/pedidos/guards/PedidosGuard.tsx'
    ],
    description: 'Sistema de gerenciamento de pedidos'
  },
  
  HISTORICO: {
    path: '/historico',
    files: [
      'src/pages/Historico.tsx',
      'src/features/historico/components/HistoricoSimplePage.tsx',
      'src/core/historico/guards/HistoricoGuard.tsx'
    ],
    description: 'Sistema de histórico de operações'
  },
  
  SCANNER: {
    path: '/scanner',
    files: [
      'src/pages/Scanner.tsx',
      'src/components/scanner/'
    ],
    description: 'Sistema de scanner de códigos de barras'
  },
  
  DE_PARA: {
    path: '/depara',
    files: [
      'src/pages/DePara.tsx',
      'src/components/sku-map/'
    ],
    description: 'Sistema de mapeamento de SKUs'
  },
  
  ESTOQUE: {
    path: '/estoque',
    files: [
      'src/pages/Estoque.tsx',
      'src/components/estoque/'
    ],
    description: 'Sistema de gestão de estoque'
  },
  
  DASHBOARD: {
    path: '/',
    files: [
      'src/pages/Index.tsx'
    ],
    description: 'Dashboard principal'
  }
} as const;

// Marcador de proteção que deve estar presente nos arquivos
export const PROTECTION_MARKER = '🛡️';

// Tipos de modificação permitida
export enum ALLOWED_MODIFICATIONS {
  BUG_FIX = 'bug_fix',
  PERFORMANCE = 'performance', 
  ACCESSIBILITY = 'accessibility',
  USER_REQUESTED = 'user_requested'
}

// Função para verificar se um arquivo está protegido
export function isFileProtected(filePath: string): boolean {
  return Object.values(PROTECTED_PAGES).some(page => 
    page.files.some(file => 
      filePath.includes(file) || file.includes(filePath)
    )
  );
}

// Função para obter informações de proteção de um arquivo
export function getProtectionInfo(filePath: string) {
  for (const [key, page] of Object.entries(PROTECTED_PAGES)) {
    if (page.files.some(file => filePath.includes(file) || file.includes(filePath))) {
      return {
        page: key,
        description: page.description,
        path: page.path
      };
    }
  }
  return null;
}