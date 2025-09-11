import React from 'react';
import { PedidosGuard } from '@/core/pedidos/guards/PedidosGuard';
import SimplePedidosPage from '@/components/pedidos/SimplePedidosPage';
import { resetColumnCache } from '@/features/pedidos/hooks/useColumnManager';

export default function Pedidos() {
  // FORÇAR limpeza completa e configuração de colunas de devolução
  React.useEffect(() => {
    // Limpar TODOS os caches relacionados às colunas
    localStorage.removeItem('pedidos-column-preferences');
    localStorage.removeItem('pedidos:lastSearch');
    localStorage.removeItem('column-manager-cache');
    resetColumnCache();
    
    // FORÇAR configuração das colunas de devolução
    const defaultColumnsWithReturns = [
      'id', 'empresa', 'numero', 'nome_cliente', 'data_pedido', 'situacao',
      'valor_total', 'valor_frete', 'cidade', 'uf',
      'return_status', 'return_status_money', 'has_return', 'has_claim'
    ];
    
    localStorage.setItem('pedidos-column-preferences', JSON.stringify({
      visibleColumns: defaultColumnsWithReturns,
      activeProfile: 'standard'
    }));
    
    console.log('🔍 [AUDIT] FORÇANDO colunas de devolução:', defaultColumnsWithReturns);
    
    console.log('🔍 [AUDIT] Página Pedidos carregada - verificando dados de devolução');
    
    // Interceptar requests para auditar resposta da unified-orders
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (args[0] && args[0].toString().includes('unified-orders')) {
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          console.log('🔍 [AUDIT] Resposta unified-orders:', {
            ok: data.ok,
            results_count: data.results?.length || 0,
            has_returns_data: data.results?.some((r: any) => 
              r.return_status || r.has_return || r.has_claim
            ),
            sample_order: data.results?.[0] ? {
              id: data.results[0].id,
              return_status: data.results[0].return_status,
              has_return: data.results[0].has_return,
              has_claim: data.results[0].has_claim,
              return_fields: Object.keys(data.results[0]).filter(k => k.startsWith('return_')),
              all_fields: Object.keys(data.results[0]).slice(0, 20)
            } : null,
            raw_sample: data.results?.[0] ? JSON.stringify(data.results[0], null, 2).slice(0, 500) : null
          });
        } catch (e) {
          console.log('🔍 [AUDIT] Erro ao fazer parse da resposta unified-orders:', e);
        }
      }
      
      return response;
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return (
    <PedidosGuard>
      <SimplePedidosPage />
    </PedidosGuard>
  );
}
