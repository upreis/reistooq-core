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
    const supabaseUser = makeClient(req.headers.get("Authorization"));
    const supabaseService = makeClient(null);
    
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('[Processar Baixa Estoque] Erro ao parsear JSON:', parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Formato JSON inválido" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
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
        console.log(`Processando pedido: ${orderId}`);
        
        // Buscar dados básicos do pedido para obter os SKUs
        const { data: pedidoRow } = await supabaseService
          .from('pedidos')
          .select('numero, data_pedido, integration_account_id')
          .eq('id', orderId)
          .maybeSingle();

        if (!pedidoRow) {
          console.error(`Pedido ${orderId} não encontrado`);
          errors.push(`Pedido ${orderId}: não encontrado`);
          errorCount++;
          continue;
        }

        // Buscar itens do pedido para obter os SKUs originais  
        const { data: orderItems, error: itemsError } = await supabaseService
          .from('itens_pedidos')
          .select('sku, quantidade')
          .eq('pedido_id', orderId);

        if (itemsError || !orderItems) {
          console.error(`Erro ao buscar itens do pedido ${orderId}:`, itemsError);
          errors.push(`Pedido ${orderId}: ${itemsError?.message || 'itens não encontrados'}`);
          errorCount++;
          continue;
        }

        console.log(`Encontrados ${orderItems.length} itens para pedido ${orderId}`);

        // Processar por SKU único do pedido através dos mapeamentos
        const skusUnicos = [...new Set(orderItems.map(item => item.sku))];
        let totalDebitadoGeral = 0;
        
        for (const skuPedido of skusUnicos) {
          console.log(`Processando SKU do pedido: ${skuPedido}`);
          // Quantidade vendida SOMENTE deste SKU no pedido
          const quantidadeVendidaSku = orderItems
            .filter(item => item.sku === skuPedido)
            .reduce((sum, item) => sum + (item.quantidade || 0), 0);
          
          // Buscar mapeamento ativo para este SKU  
          const { data: mapeamento } = await supabaseService
            .from('mapeamentos_depara')
            .select('sku_correspondente, sku_simples, quantidade')
            .eq('sku_pedido', skuPedido)
            .eq('ativo', true)
            .maybeSingle();

           if (!mapeamento) {
             console.warn(`Mapeamento não encontrado para SKU ${skuPedido}`);
             errors.push(`SKU ${skuPedido}: mapeamento não encontrado`);
             errorCount++;
             continue;
           }

          // O SKU KIT que aparece na UI é o sku_simples (SKU Unitário) 
          const skuKit = mapeamento.sku_simples;
          // O SKU Estoque é o sku_correspondente (SKU Correto)
          const skuEstoque = mapeamento.sku_correspondente;
          // Quantidade por kit do mapeamento
          const qtdKit = mapeamento.quantidade || 1;

          console.log(`Mapeamento encontrado:`, {
            skuPedido,
            skuKit,
            skuEstoque, 
            qtdKit,
            quantidadeVendida: quantidadeVendidaSku
          });

          // Buscar produto no estoque usando o SKU Estoque (sku_correspondente)
          let produto: any = null;
          let produtoError: any = null;
          // Tentativa 1: por SKU + integration_account
          {
            const res = await supabaseService
              .from('produtos')
              .select('id, sku_interno, quantidade_atual, nome, integration_account_id')
              .eq('sku_interno', skuEstoque)
              .eq('integration_account_id', pedidoRow.integration_account_id)
              .maybeSingle();
            produto = res.data;
            produtoError = res.error;
          }
          // Fallback: apenas por SKU se não encontrou
          if (!produto) {
            console.warn(`Produto com SKU ${skuEstoque} não encontrado na conta ${pedidoRow.integration_account_id}, tentando fallback por SKU apenas...`);
            const res2 = await supabaseService
              .from('produtos')
              .select('id, sku_interno, quantidade_atual, nome, integration_account_id')
              .eq('sku_interno', skuEstoque)
              .maybeSingle();
            if (!res2.error && res2.data) produto = res2.data;
            else produtoError = produtoError || res2.error;
          }

          if (produtoError || !produto) {
            console.warn(`Produto não encontrado para SKU Estoque ${skuEstoque}`);
            errors.push(`SKU Estoque ${skuEstoque}: produto não encontrado`);
            errorCount++;
            continue;
          }

          // Total de Itens = quantidade vendida (deste SKU) × quantidade do kit
          const quantidadeVendidaSkuNum = Number(quantidadeVendidaSku) || 0;
          const qtdKitNum = Number(qtdKit) || 1;
          const totalItens = quantidadeVendidaSkuNum * qtdKitNum;
          const novaQuantidade = Math.max(0, Number(produto.quantidade_atual ?? 0) - totalItens);
          
          console.log(`Baixa calculada:`, {
            produtoNome: produto.nome,
            skuInterno: produto.sku_interno,
            estoqueAtual: produto.quantidade_atual,
            totalItensADebitar: totalItens,
            novaQuantidade
          });

          // Atualizar quantidade do produto
          const { error: updateError } = await supabaseService
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
            totalDebitadoGeral += totalItens;
            console.log(`✅ Baixa realizada: ${produto.nome} (${skuPedido} → ${skuKit} → ${skuEstoque}) - ${produto.quantidade_atual} → ${novaQuantidade} (-${totalItens})`);
          }
        }

        processedCount++;
        console.log(`✅ Pedido ${orderId} processado com sucesso`);

        // Registrar histórico (usando dados calculados)
        try {
          const skusProcessados = skusUnicos.join(', ');
          const totalGeralItens = totalDebitadoGeral;

           const { error: histError } = await supabaseUser
             .rpc('hv_insert', {
              p: {
                id_unico: String(orderId),
                numero_pedido: pedidoRow.numero || String(orderId),
                sku_produto: skusProcessados,
                descricao: `Baixa automática: ${skusProcessados}`,
                quantidade: totalGeralItens,
                valor_unitario: 0,
                valor_total: 0,
                status: 'baixado',
                data_pedido: pedidoRow.data_pedido || new Date().toISOString().slice(0,10),
                observacoes: `Processado automaticamente - Total de itens: ${totalGeralItens}`,
                integration_account_id: pedidoRow.integration_account_id,
              }
            });

          if (histError) {
            console.error(`Erro ao registrar histórico:`, histError.message);
          } else {
            console.log(`✅ Histórico registrado para pedido ${orderId}`);
          }
        } catch (e) {
          console.error(`Falha ao registrar histórico:`, e);
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