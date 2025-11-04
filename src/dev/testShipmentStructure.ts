/**
 * 🧪 TESTE: Chamar test-shipment-structure
 */

import { supabase } from '@/integrations/supabase/client';

export async function testShipmentStructure() {
  console.log('🧪 Iniciando teste de estrutura do shipment...');
  
  try {
    const { data, error } = await supabase.functions.invoke('test-shipment-structure', {
      body: {
        shipment_id: '45796990714', // Do pedido 2000013656902262
        integration_account_id: '5740f717-1771-4298-b8c9-464ffb8d8dce'
      }
    });

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log('✅ Resultado do teste:', data);
    
    // Salvar snapshot
    sessionStorage.setItem('shipment-structure-test', JSON.stringify({
      timestamp: new Date().toISOString(),
      shipment_id: '45796990714',
      data
    }));
    
    return data;
  } catch (err) {
    console.error('❌ Erro ao testar:', err);
  }
}

// Executar automaticamente se estiver em dev
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  (window as any).testShipmentStructure = testShipmentStructure;
  console.log('💡 Execute: window.testShipmentStructure()');
}
