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
    const supabaseService = makeClient(null);
    const body = await req.json();
    
    console.log('[Processar Baixa Estoque] Request body:', body);
    
    const { orderIds, action = 'baixar_estoque' } = body;
    
    if (!orderIds || !Array.isArray(orderIds)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "orderIds é obrigatório e deve ser um array" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Processar cada pedido
    for (const orderId of orderIds) {
      try {
        // Buscar itens do pedido
        const { data: orderItems, error: itemsError } = await supabase
          .from('itens_pedidos')
          .select('id, sku, quantidade, pedido_id')
          .eq('pedido_id', orderId);

        if (itemsError) {
          console.error(`Erro ao buscar itens do pedido ${orderId}:`, itemsError);
          errors.push(`Pedido ${orderId}: ${itemsError.message}`);
          errorCount++;
          continue;
        }

        if (!orderItems || orderItems.length === 0) {
          console.log(`Nenhum item encontrado para o pedido ${orderId}`);
          continue;
        }

        // Processar baixa de estoque para cada item
        for (const item of orderItems) {
          // Buscar mapeamento do SKU do pedido para SKU do estoque
          const { data: mapeamento } = await supabase
            .from('mapeamentos_depara')
            .select('sku_correspondente, quantidade')
            .eq('sku_pedido', item.sku)
            .eq('ativo', true)
            .maybeSingle();

          if (!mapeamento || !mapeamento.sku_correspondente) {
            console.warn(`Mapeamento não encontrado para SKU ${item.sku}`);
            errors.push(`SKU ${item.sku}: mapeamento não encontrado`);
            continue;
          }

          // Buscar produto no estoque usando o SKU mapeado
          const { data: produto, error: produtoError } = await supabase
            .from('produtos')
            .select('id, sku_interno, quantidade_atual, nome')
            .eq('sku_interno', mapeamento.sku_correspondente)
            .maybeSingle();

          if (produtoError || !produto) {
            console.warn(`Produto não encontrado para SKU ${mapeamento.sku_correspondente}`);
            errors.push(`SKU ${mapeamento.sku_correspondente}: produto não encontrado`);
            continue;
          }

          // Calcular quantidade total a debitar (item.quantidade * mapeamento.quantidade)
          const quantidadeDebitar = item.quantidade * (mapeamento.quantidade || 1);
          const novaQuantidade = Math.max(0, produto.quantidade_atual - quantidadeDebitar);
          
          // Atualizar quantidade do produto
          const { error: updateError } = await supabase
            .from('produtos')
            .update({ 
              quantidade_atual: novaQuantidade,
              ultima_movimentacao: new Date().toISOString()
            })
            .eq('id', produto.id);

          if (updateError) {
            console.error(`Erro ao atualizar produto ${produto.id}:`, updateError);
            errors.push(`Produto ${produto.nome}: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`Baixa realizada: ${produto.nome} (${item.sku} → ${mapeamento.sku_correspondente}) - ${produto.quantidade_atual} → ${novaQuantidade} (-${quantidadeDebitar})`);
          }
        }

        processedCount++;
        console.log(`Pedido ${orderId} processado com sucesso`);

        // Registrar histórico (mínimo necessário para aparecer na página /historico)
        try {
          // Buscar dados essenciais do pedido
          const { data: pedidoRow } = await supabase
            .from('pedidos')
            .select('numero, data_pedido, integration_account_id')
            .eq('id', orderId)
            .maybeSingle();

          // Coletar SKUs e quantidade total vendida a partir dos itens já carregados
          const skus = (orderItems || []).map((i: any) => i.sku).filter(Boolean);
          const quantidadeVendida = (orderItems || []).reduce((sum: number, i: any) => sum + (Number(i.quantidade) || 0), 0);

          const { error: histError } = await supabaseService
            .rpc('hv_insert', {
              p: {
                id_unico: String(orderId),
                numero_pedido: pedidoRow?.numero || String(orderId),
                sku_produto: skus.length ? skus.join(', ') : 'BAIXA_ESTOQUE',
                descricao: 'Baixa automática de estoque via função',
                quantidade: quantidadeVendida || 0,
                valor_unitario: 0,
                valor_total: 0,
                status: 'baixado',
                data_pedido: pedidoRow?.data_pedido || new Date().toISOString().slice(0,10),
                observacoes: 'Processado automaticamente',
                integration_account_id: pedidoRow?.integration_account_id || null,
              }
            });

          if (histError) {
            console.error(`[Processar Baixa Estoque] Erro ao registrar histórico:`, histError.message);
          } else {
            console.log(`[Processar Baixa Estoque] Histórico registrado para pedido ${orderId}`);
          }
        } catch (e) {
          console.error(`[Processar Baixa Estoque] Falha ao registrar histórico:`, e);
        }

      } catch (error) {
        console.error(`Erro ao processar pedido ${orderId}:`, error);
        errors.push(`Pedido ${orderId}: ${error.message}`);
        errorCount++;
      }
    }

    const response = {
      success: errorCount === 0,
      processed: processedCount,
      errors: errorCount,
      details: errors.length > 0 ? errors : undefined,
      message: `Processados: ${processedCount}, Erros: ${errorCount}`
    };

    console.log('[Processar Baixa Estoque] Response:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('[Processar Baixa Estoque] Erro geral:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});