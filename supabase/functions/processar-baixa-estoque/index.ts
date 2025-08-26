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
          .select(`
            id,
            sku,
            quantidade,
            pedido_id,
            produtos!inner(
              id,
              sku_interno,
              quantidade_atual,
              nome
            )
          `)
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
          const produto = item.produtos;
          
          if (!produto) {
            console.warn(`Produto não encontrado para SKU ${item.sku}`);
            continue;
          }

          const novaQuantidade = Math.max(0, produto.quantidade_atual - item.quantidade);
          
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
            console.log(`Baixa realizada: ${produto.nome} - ${produto.quantidade_atual} → ${novaQuantidade}`);
          }
        }

        processedCount++;
        console.log(`Pedido ${orderId} processado com sucesso`);

        // Registrar no histórico de vendas (mínimo necessário)
        try {
          // Buscar dados do pedido
          const { data: pedidoRow } = await supabase
            .from('pedidos')
            .select('id, numero, nome_cliente, cpf_cnpj, data_pedido, valor_total, valor_frete, valor_desconto, numero_ecommerce, numero_venda, cidade, uf, empresa, integration_account_id, codigo_rastreamento, url_rastreamento')
            .eq('id', orderId)
            .maybeSingle();

          // Buscar itens do pedido
          const { data: itens } = await supabase
            .from('itens_pedidos')
            .select('sku, quantidade')
            .eq('pedido_id', orderId);

          const skus = (itens || []).map(i => i.sku).filter(Boolean);
          const quantidadeVendida = (itens || []).reduce((sum, i) => sum + (i.quantidade || 0), 0);

          // Buscar de-para para calcular total_itens e sku_estoque
          let total_itens = 0;
          let qtd_kit = 0;
          let sku_estoque_list: string[] = [];
          if (skus.length > 0) {
            const { data: depara } = await supabase
              .from('mapeamentos_depara')
              .select('sku_pedido, sku_correspondente, sku_simples, quantidade, ativo')
              .eq('ativo', true)
              .in('sku_pedido', skus);

            const map = new Map<string, { sku_correspondente: string | null; sku_simples: string | null; quantidade: number }>();
            for (const m of (depara || [])) {
              map.set(m.sku_pedido, { sku_correspondente: m.sku_correspondente, sku_simples: m.sku_simples, quantidade: m.quantidade || 1 });
            }

            for (const it of (itens || [])) {
              const m = map.get(it.sku) || { sku_correspondente: null, sku_simples: null, quantidade: 1 };
              const kit = Math.max(1, Number(m.quantidade || 1));
              qtd_kit += kit;
              total_itens += (Number(it.quantidade || 0) * kit);
              const estoqueSku = m.sku_correspondente || m.sku_simples;
              if (estoqueSku) sku_estoque_list.push(estoqueSku);
            }
          }

          const payload: Record<string, any> = {
            id_unico: orderId,
            numero_pedido: pedidoRow?.numero || String(orderId),
            sku_produto: skus.join(', '),
            descricao: `Baixa automática via função`;
            quantidade: quantidadeVendida,
            valor_unitario: 0,
            valor_total: Number(pedidoRow?.valor_total || 0),
            cliente_nome: pedidoRow?.nome_cliente || null,
            cliente_documento: pedidoRow?.cpf_cnpj || null,
            status: 'baixado',
            data_pedido: pedidoRow?.data_pedido || new Date().toISOString().slice(0,10),
            sku_estoque: sku_estoque_list.join(', '),
            sku_kit: skus.join(', '),
            qtd_kit,
            total_itens,
            cpf_cnpj: pedidoRow?.cpf_cnpj || null,
            empresa: pedidoRow?.empresa || null,
            cidade: pedidoRow?.cidade || null,
            uf: pedidoRow?.uf || null,
            numero_ecommerce: pedidoRow?.numero_ecommerce || null,
            numero_venda: pedidoRow?.numero_venda || null,
            valor_frete: Number(pedidoRow?.valor_frete || 0),
            valor_desconto: Number(pedidoRow?.valor_desconto || 0),
            obs: null,
            obs_interna: null,
            codigo_rastreamento: pedidoRow?.codigo_rastreamento || null,
            url_rastreamento: pedidoRow?.url_rastreamento || null,
            integration_account_id: pedidoRow?.integration_account_id || null,
            observacoes: `Edge function processar-baixa-estoque`
          };

          const { error: histError } = await supabase
            .from('historico_vendas')
            .insert(payload);

          if (histError) {
            console.error(`[Processar Baixa Estoque] Erro ao registrar histórico do pedido ${orderId}:`, histError.message);
          } else {
            console.log(`[Processar Baixa Estoque] Histórico registrado para pedido ${orderId}`);
          }
        } catch (e) {
          console.error(`[Processar Baixa Estoque] Falha ao registrar histórico para ${orderId}:`, e);
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