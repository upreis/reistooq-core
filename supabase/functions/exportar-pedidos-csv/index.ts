import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function makeClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const supabase = makeClient(req.headers.get("Authorization"));
    const body = await req.json();
    
    console.log('[Exportar Pedidos CSV] Request body:', body);
    
    const { 
      orderIds, 
      format = 'csv',
      filename,
      integration_account_id,
      limit = 5000,
      offset = 0
    } = body;

    let ordersData;

    if (orderIds && Array.isArray(orderIds)) {
      // Exportar pedidos específicos por IDs
      console.log(`Exportando ${orderIds.length} pedidos específicos`);
      
      // Para pedidos do sistema interno, usar tabela pedidos
      const { data: orders, error: ordersError } = await supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedidos(
            id,
            sku,
            descricao,
            quantidade,
            valor_unitario,
            valor_total
          )
        `)
        .in('id', orderIds);

      if (ordersError) {
        throw new Error(`Erro ao buscar pedidos: ${ordersError.message}`);
      }

      ordersData = orders || [];
    } else if (integration_account_id) {
      // Exportar usando unified-orders para dados do Mercado Livre
      console.log(`Exportando via unified-orders: account_id=${integration_account_id}`);
      
      const { data: unifiedData, error: unifiedError } = await supabase.functions.invoke('unified-orders', {
        body: {
          integration_account_id,
          limit,
          offset
        }
      });

      if (unifiedError || !unifiedData?.ok) {
        throw new Error(`Erro ao buscar pedidos via unified-orders: ${unifiedError?.message || 'Resposta inválida'}`);
      }

      ordersData = unifiedData.unified || [];
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: "É necessário fornecer orderIds ou integration_account_id"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Encontrados ${ordersData.length} pedidos para exportação`);

    // Gerar CSV
    const csvContent = generateCSV(ordersData);
    const finalFilename = filename || `pedidos_export_${new Date().toISOString().split('T')[0]}.csv`;

    // Para exports grandes (>1000), retornar link para download
    if (ordersData.length > 1000) {
      // Simular upload para storage ou gerar link temporário
      const downloadUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
      
      return new Response(JSON.stringify({
        success: true,
        filename: finalFilename,
        downloadUrl,
        records: ordersData.length,
        message: `Exportação de ${ordersData.length} pedidos gerada com sucesso`
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Para exports menores, retornar CSV diretamente
    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${finalFilename}"`
      }
    });

  } catch (error) {
    console.error('[Exportar Pedidos CSV] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

function generateCSV(orders: any[]): string {
  if (!orders || orders.length === 0) {
    return 'id,numero,data_pedido,cliente,valor_total,situacao\n';
  }

  // Headers
  const headers = [
    'id',
    'numero',
    'data_pedido',
    'nome_cliente',
    'cpf_cnpj',
    'valor_total',
    'valor_frete',
    'valor_desconto',
    'situacao',
    'cidade',
    'uf',
    'empresa',
    'codigo_rastreamento',
    'url_rastreamento',
    'created_at'
  ];

  let csv = headers.join(',') + '\n';

  // Data rows
  for (const order of orders) {
    const row = headers.map(header => {
      let value = order[header];
      
      // Handle special formatting
      if (header === 'data_pedido' && value) {
        value = new Date(value).toLocaleDateString('pt-BR');
      }
      
      if (typeof value === 'string' && value.includes(',')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value || '';
    });
    
    csv += row.join(',') + '\n';
  }

  return csv;
}