// Script para testar status da API
import { supabase } from '@/integrations/supabase/client';

export async function testStatusAPI() {
  const integrationAccountId = 'da212057-37cc-41ce-82c8-5fe5befb9cd4';
  
  console.log('🔍 Testando API unified-orders para extrair todos os status...');
  
  try {
    // Buscar dados básicos
    const { data: basicData, error: basicError } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id: integrationAccountId,
        limit: 50,
        enrich: false,
        debug: true
      }
    });
    
    if (basicError) {
      console.error('❌ Erro na API básica:', basicError);
      return;
    }
    
    console.log('✅ Dados básicos obtidos:', basicData?.results?.length || 0, 'pedidos');
    
    // Extrair todos os status únicos
    const allStatuses = new Set();
    const allShippingStatuses = new Set();
    const allSituacoes = new Set();
    
    if (basicData?.results) {
      basicData.results.forEach(order => {
        // Status principal
        if (order.status) allStatuses.add(order.status);
        
        // Status de envio
        if (order.shipping_status) allShippingStatuses.add(order.shipping_status);
        if (order.shipping?.status) allShippingStatuses.add(order.shipping.status);
        
        // Situação mapeada
        if (order.situacao) allSituacoes.add(order.situacao);
        
        // Tags importantes
        if (order.tags) {
          order.tags.forEach(tag => {
            if (tag.includes('paid') || tag.includes('delivered') || tag.includes('cancelled')) {
              allStatuses.add(tag);
            }
          });
        }
      });
    }
    
    console.log('\n📊 ANÁLISE COMPLETA DE STATUS:');
    console.log('\n🏷️ STATUS PRINCIPAIS (order.status):');
    Array.from(allStatuses).sort().forEach(status => console.log(`  - ${status}`));
    
    console.log('\n🚚 STATUS DE ENVIO (shipping.status):');
    Array.from(allShippingStatuses).sort().forEach(status => console.log(`  - ${status}`));
    
    console.log('\n📝 SITUAÇÕES MAPEADAS (situacao):');
    Array.from(allSituacoes).sort().forEach(situacao => console.log(`  - ${situacao}`));
    
    // Buscar dados enriquecidos para comparar
    const { data: enrichedData, error: enrichedError } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id: integrationAccountId,
        limit: 10,
        enrich: true,
        include_shipping: true,
        debug: true
      }
    });
    
    if (!enrichedError && enrichedData?.results) {
      console.log('\n🔬 ANÁLISE DE DADOS ENRIQUECIDOS:');
      const sampleOrder = enrichedData.results[0];
      if (sampleOrder) {
        console.log('Status principal:', sampleOrder.status);
        console.log('Shipping status:', sampleOrder.shipping?.status);
        console.log('Shipping substatus:', sampleOrder.shipping?.substatus);
        console.log('Situação mapeada:', sampleOrder.situacao);
        console.log('Tags:', sampleOrder.tags);
        console.log('Logistic type:', sampleOrder.shipping?.logistic?.type);
        console.log('Delivery type:', sampleOrder.shipping?.delivery_type);
      }
    }
    
    return {
      statusPrincipais: Array.from(allStatuses).sort(),
      statusEnvio: Array.from(allShippingStatuses).sort(),
      situacoesMapeadas: Array.from(allSituacoes).sort(),
      totalPedidos: basicData?.results?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return null;
  }
}

// Executar se estiver no browser
if (typeof window !== 'undefined') {
  window.testStatusAPI = testStatusAPI;
}