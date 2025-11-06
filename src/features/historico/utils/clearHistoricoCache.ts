/**
 * 🧹 UTILITÁRIO PARA LIMPAR CACHE DO HISTÓRICO
 * Força recarregamento das colunas sincronizadas
 */

export const clearHistoricoCache = () => {
  try {
    console.log('🧹 Limpando cache do histórico...');
    
    // Limpar cache de colunas
    const keysToRemove = [
      'historico-columns-config',
      'historico-visible-columns',
      'historico-column-order',
      'historico-active-profile'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Removido: ${key}`);
    });
    
    console.log('✅ Cache do histórico limpo com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    return false;
  }
};

// Auto-executar ao importar este arquivo
clearHistoricoCache();
