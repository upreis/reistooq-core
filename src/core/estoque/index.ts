// Core do sistema de estoque
export * from './guards/EstoqueGuard';

// Versão do sistema de estoque
export const ESTOQUE_SYSTEM_VERSION = '1.0.0';

// Função de validação do sistema
export function verifyEstoqueSystemIntegrity(): boolean {
  try {
    // Verificações básicas do sistema
    const hasGuard = typeof EstoqueGuard !== 'undefined';
    
    if (!hasGuard) {
      console.error('❌ EstoqueGuard não encontrado');
      return false;
    }

    console.info('✅ Sistema de estoque validado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na validação do sistema de estoque:', error);
    return false;
  }
}

import { EstoqueGuard } from './guards/EstoqueGuard';