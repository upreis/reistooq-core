// src/dev/auditUnifiedOrders.ts
import { supabase } from '@/integrations/supabase/client';

export async function runUnifiedOrdersSnapshot(integration_account_id: string) {
  console.log('🔍 [Audit] Starting unified-orders snapshot...');
  
  try {
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
      console.error('❌ [Audit] Edge function error:', error);
      return { error };
    }

    // Log structure analysis
    console.log('📊 [Audit] Response structure:', {
      ok: data?.ok,
      hasResults: !!data?.results,
      resultsLength: data?.results?.length || 0,
      hasUnified: !!data?.unified,
      unifiedLength: data?.unified?.length || 0,
      hasPaging: !!data?.paging
    });

    if (data?.results?.[0]) {
      console.log('🔍 [Audit] First result keys:', Object.keys(data.results[0]));
      
      if (data.results[0]?.order_items?.[0]?.item) {
        console.log('🔍 [Audit] First item keys:', Object.keys(data.results[0].order_items[0].item));
      }
      
      if (data.results[0]?.buyer) {
        console.log('🔍 [Audit] Buyer keys:', Object.keys(data.results[0].buyer));
      }
      
      if (data.results[0]?.shipping) {
        console.log('🔍 [Audit] Shipping keys:', Object.keys(data.results[0].shipping));
      }
    }

    if (data?.unified?.[0]) {
      console.log('🔍 [Audit] First unified keys:', Object.keys(data.unified[0]));
    }

    // Save snapshot to simulate file save (in real app would save to filesystem)
    const snapshot = {
      timestamp: new Date().toISOString(),
      integration_account_id,
      data,
      analysis: {
        totalResults: data?.results?.length || 0,
        totalUnified: data?.unified?.length || 0,
        firstResultKeys: data?.results?.[0] ? Object.keys(data.results[0]) : [],
        firstUnifiedKeys: data?.unified?.[0] ? Object.keys(data.unified[0]) : [],
        sampleData: {
          raw: data?.results?.[0] || null,
          unified: data?.unified?.[0] || null
        }
      }
    };

    console.log('💾 [Audit] Snapshot saved:', snapshot.analysis);
    
    // Store in sessionStorage for access by audit panel
    sessionStorage.setItem('unified-orders-snapshot', JSON.stringify(snapshot));
    
    return { data: snapshot };
    
  } catch (err) {
    console.error('💥 [Audit] Unexpected error:', err);
    return { error: err };
  }
}

export function getStoredSnapshot() {
  try {
    const stored = sessionStorage.getItem('unified-orders-snapshot');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}