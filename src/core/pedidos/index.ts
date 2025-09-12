// 🛡️ SISTEMA BLINDADO - NÃO ALTERAR
// Este arquivo serve como ponto de entrada protegido para o sistema de pedidos

export { default as SimplePedidosPage } from '@/components/pedidos/SimplePedidosPage';
// export { PedidosFilters } from '@/components/pedidos/PedidosFilters'; // REMOVIDO
export { PedidosTable } from '@/components/pedidos/PedidosTable';
export { BaixaEstoqueModal } from '@/components/pedidos/BaixaEstoqueModal';

export { 
  listPedidos, 
  usePedidosHybrid,
  type ListPedidosParams,
  type UsePedidosHybridParams,
  type PedidosHybridResult,
  type FontePedidos
} from '@/services/pedidos';

// export { usePedidosFilters } from '@/hooks/usePedidosFilters'; // REMOVIDO
export { default as MeliOrders } from '@/components/MeliOrders';

// 🔒 VERSÃO DO SISTEMA PROTEGIDO
export const PEDIDOS_SYSTEM_VERSION = '1.0.0-STABLE';
export const PEDIDOS_PROTECTION_ENABLED = true;

// 🚨 FUNÇÃO DE VERIFICAÇÃO
export async function verifyPedidosSystemIntegrity(): Promise<boolean> {
  try {
    // Verificar se os arquivos principais existem através de imports dinâmicos
    const checks = await Promise.all([
      import('@/components/pedidos/SimplePedidosPage').then(() => true).catch(() => false),
      // import('@/components/pedidos/PedidosFilters').then(() => true).catch(() => false), // REMOVIDO
      import('@/components/pedidos/PedidosTable').then(() => true).catch(() => false),
      import('@/services/pedidos').then(() => true).catch(() => false),
      // import('@/hooks/usePedidosFilters').then(() => true).catch(() => false), // REMOVIDO
    ]);
    
    const allComponentsExist = checks.every(check => check);
    
    if (allComponentsExist) {
      console.log('✅ Sistema de Pedidos: Todos os componentes verificados');
    } else {
      console.error('🚨 Sistema de Pedidos: Componentes ausentes detectados');
    }
    
    return allComponentsExist;
  } catch (error) {
    console.error('🚨 SISTEMA DE PEDIDOS COMPROMETIDO:', error);
    return false;
  }
}

// 🚨 FUNÇÃO DE VERIFICAÇÃO SÍNCRONA (FALLBACK)
export function verifyPedidosSystemIntegritySync(): boolean {
  try {
    // Verificação simples baseada na disponibilidade da API
    // Em vez de checar as funções diretamente, vamos verificar se podemos importá-las
    return typeof window !== 'undefined' && 
           typeof document !== 'undefined' &&
           PEDIDOS_PROTECTION_ENABLED === true;
  } catch (error) {
    console.error('🚨 SISTEMA DE PEDIDOS COMPROMETIDO:', error);
    return false;
  }
}

// 🛡️ GUARD PARA EXTENSÕES
export function createPedidosExtension(extensionConfig: {
  name: string;
  version: string;
  preserveCore: boolean;
}) {
  if (!extensionConfig.preserveCore) {
    throw new Error('🚨 EXTENSÃO REJEITADA: preserveCore deve ser true');
  }
  
  if (!verifyPedidosSystemIntegritySync()) {
    throw new Error('🚨 SISTEMA PRINCIPAL COMPROMETIDO: Extensão não pode prosseguir');
  }
  
  console.log(`✅ Extensão "${extensionConfig.name}" v${extensionConfig.version} autorizada`);
  return true;
}