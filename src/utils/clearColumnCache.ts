/**
 * 🧹 UTILITÁRIO PARA LIMPAR CACHE DE COLUNAS COMPLETAMENTE
 * Execute no console: window.clearAllColumnCache()
 */

export const clearAllColumnCache = () => {
  const keys = [
    'pedidos-column-preferences',
    'pedidos-column-preferences-v2',
    'pedidos-column-preferences-v3', 
    'pedidos-column-preferences-v4',
    'pedidos-column-preferences-v5',
    'pedidos:lastSearch'
  ];
  
  let cleared = 0;
  keys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleared++;
      console.log(`✅ Removido: ${key}`);
    }
  });
  
  console.log(`🧹 Total de caches limpos: ${cleared}`);
  console.log('🔄 Recarregue a página para aplicar mudanças');
  
  return cleared;
};

// Disponibilizar globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).clearAllColumnCache = clearAllColumnCache;
}
