import { supabase } from '@/integrations/supabase/client';

export interface AuditResult {
  success: boolean;
  data?: any;
  error?: string;
  analysis: {
    resultsKeys: string[];
    unifiedKeys: string[];
    itemKeys: string[];
    firstRaw: any;
    firstUnified: any;
    counts: {
      results: number;
      unified: number;
    };
  };
}

export async function runUnifiedOrdersSnapshot(integration_account_id: string): Promise<AuditResult> {
  try {
    console.log('🔍 Starting unified-orders audit...');
    
    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: { 
        integration_account_id, 
        status: 'paid', 
        limit: 5, 
        enrich: true, 
        debug: true 
      }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return {
        success: false,
        error: error.message,
        analysis: {
          resultsKeys: [],
          unifiedKeys: [],
          itemKeys: [],
          firstRaw: null,
          firstUnified: null,
          counts: { results: 0, unified: 0 }
        }
      };
    }

    console.log('✅ Edge function response received');
    
    // Análise dos dados
    const results = data?.results || [];
    const unified = data?.unified || [];
    const firstResult = results[0];
    const firstUnified = unified[0];
    
    const resultsKeys = firstResult ? Object.keys(firstResult) : [];
    const unifiedKeys = firstUnified ? Object.keys(firstUnified) : [];
    const itemKeys = firstResult?.order_items?.[0]?.item ? Object.keys(firstResult.order_items[0].item) : [];

    console.log('📊 Analysis:');
    console.log('- Results count:', results.length);
    console.log('- Unified count:', unified.length);
    console.log('- Raw keys:', resultsKeys);
    console.log('- Unified keys:', unifiedKeys);
    console.log('- Item keys:', itemKeys);
    
    // Sample data logging
    if (firstResult) {
      console.log('🔬 First raw order sample:');
      console.log('- ID:', firstResult.id);
      console.log('- Status:', firstResult.status);
      console.log('- Pack ID:', firstResult.pack_id);
      console.log('- Pickup ID:', firstResult.pickup_id);
      console.log('- Buyer ID:', firstResult.buyer?.id);
      console.log('- Seller ID:', firstResult.seller?.id);
      console.log('- Shipping ID:', firstResult.shipping?.id);
      console.log('- Order items count:', firstResult.order_items?.length);
      if (firstResult.order_items?.[0]) {
        console.log('- First item SKU:', firstResult.order_items[0].item?.seller_sku);
        console.log('- First item custom field:', firstResult.order_items[0].item?.seller_custom_field);
      }
    }

    if (firstUnified) {
      console.log('🎯 First unified order sample:');
      console.log('- ID:', firstUnified.id);
      console.log('- Numero:', firstUnified.numero);
      console.log('- Nome cliente:', firstUnified.nome_cliente);
      console.log('- CPF/CNPJ:', firstUnified.cpf_cnpj);
      console.log('- Valor frete:', firstUnified.valor_frete);
      console.log('- Codigo rastreamento:', firstUnified.codigo_rastreamento);
    }

    // Save snapshot
    const snapshot = {
      timestamp: new Date().toISOString(),
      data,
      analysis: {
        resultsKeys,
        unifiedKeys,
        itemKeys,
        firstRaw: firstResult,
        firstUnified,
        counts: {
          results: results.length,
          unified: unified.length
        }
      }
    };

    // Try to save to local storage for browser access
    if (typeof window !== 'undefined') {
      localStorage.setItem('unified-orders-audit', JSON.stringify(snapshot));
      console.log('💾 Snapshot saved to localStorage');
    }

    return {
      success: true,
      data,
      analysis: snapshot.analysis
    };

  } catch (err: any) {
    console.error('💥 Audit failed:', err);
    return {
      success: false,
      error: err.message,
      analysis: {
        resultsKeys: [],
        unifiedKeys: [],
        itemKeys: [],
        firstRaw: null,
        firstUnified: null,
        counts: { results: 0, unified: 0 }
      }
    };
  }
}