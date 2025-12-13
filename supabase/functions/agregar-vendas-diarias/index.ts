import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VendaRaw {
  order_id: string;
  item_sku: string | null;
  item_title: string | null;
  item_thumbnail: string | null;
  total_amount: number;
  integration_account_id: string;
  organization_id: string;
  date_created: string;
}

interface ProdutoAgregado {
  data: string;
  integration_account_id: string;
  organization_id: string;
  sku: string | null;
  titulo: string | null;
  thumbnail: string | null;
  quantidade_vendida: number;
  receita: number;
}

interface TotalAgregado {
  data: string;
  integration_account_id: string;
  organization_id: string;
  total_receita: number;
  total_pedidos: number;
  ticket_medio: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[agregar-vendas-diarias] Iniciando agregação diária...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional parameters
    let targetDate: string | null = null;
    let forceReprocess = false;
    
    try {
      const body = await req.json();
      targetDate = body.target_date || null;
      forceReprocess = body.force_reprocess || false;
    } catch {
      // No body provided, use defaults
    }

    // Se não foi especificada data, agregar o dia anterior (dados completos)
    const dateToAggregate = targetDate || getYesterdayDateSP();
    console.log(`[agregar-vendas-diarias] Agregando dados para: ${dateToAggregate}`);

    // Buscar vendas do dia especificado
    const startDateISO = `${dateToAggregate}T00:00:00-03:00`;
    const endDateISO = `${dateToAggregate}T23:59:59-03:00`;

    console.log(`[agregar-vendas-diarias] Buscando vendas entre ${startDateISO} e ${endDateISO}`);

    const { data: vendas, error: vendasError } = await supabase
      .from('vendas_hoje_realtime')
      .select('order_id, item_sku, item_title, item_thumbnail, total_amount, integration_account_id, organization_id, date_created')
      .gte('date_created', startDateISO)
      .lte('date_created', endDateISO);

    if (vendasError) {
      console.error('[agregar-vendas-diarias] Erro ao buscar vendas:', vendasError);
      throw vendasError;
    }

    if (!vendas || vendas.length === 0) {
      console.log(`[agregar-vendas-diarias] Nenhuma venda encontrada para ${dateToAggregate}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma venda para agregar',
        date: dateToAggregate,
        vendas_processadas: 0,
        execution_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[agregar-vendas-diarias] ${vendas.length} vendas encontradas para agregação`);

    // Agrupar por (integration_account_id, sku) para produtos
    const produtosMap = new Map<string, ProdutoAgregado>();
    // Agrupar por integration_account_id para totais
    const totaisMap = new Map<string, TotalAgregado>();

    for (const venda of vendas) {
      // Chave para produto: account + sku
      const produtoKey = `${venda.integration_account_id}|${venda.item_sku || 'SEM_SKU'}`;
      
      if (produtosMap.has(produtoKey)) {
        const existing = produtosMap.get(produtoKey)!;
        existing.quantidade_vendida += 1;
        existing.receita += venda.total_amount || 0;
        // Manter thumbnail se existir
        if (!existing.thumbnail && venda.item_thumbnail) {
          existing.thumbnail = venda.item_thumbnail;
        }
      } else {
        produtosMap.set(produtoKey, {
          data: dateToAggregate,
          integration_account_id: venda.integration_account_id,
          organization_id: venda.organization_id,
          sku: venda.item_sku,
          titulo: venda.item_title,
          thumbnail: venda.item_thumbnail,
          quantidade_vendida: 1,
          receita: venda.total_amount || 0
        });
      }

      // Chave para totais: account
      const totalKey = venda.integration_account_id;
      
      if (totaisMap.has(totalKey)) {
        const existing = totaisMap.get(totalKey)!;
        existing.total_pedidos += 1;
        existing.total_receita += venda.total_amount || 0;
      } else {
        totaisMap.set(totalKey, {
          data: dateToAggregate,
          integration_account_id: venda.integration_account_id,
          organization_id: venda.organization_id,
          total_receita: venda.total_amount || 0,
          total_pedidos: 1,
          ticket_medio: 0
        });
      }
    }

    // Calcular ticket médio para totais
    for (const [key, total] of totaisMap) {
      if (total.total_pedidos > 0) {
        total.ticket_medio = total.total_receita / total.total_pedidos;
      }
    }

    const produtosArray = Array.from(produtosMap.values());
    const totaisArray = Array.from(totaisMap.values());

    console.log(`[agregar-vendas-diarias] Agregados: ${produtosArray.length} produtos, ${totaisArray.length} totais por conta`);

    // Se forceReprocess, deletar dados existentes primeiro
    if (forceReprocess) {
      console.log(`[agregar-vendas-diarias] Force reprocess - removendo dados anteriores de ${dateToAggregate}`);
      
      await supabase
        .from('vendas_agregadas_produto')
        .delete()
        .eq('data', dateToAggregate);
        
      await supabase
        .from('vendas_agregadas_totais')
        .delete()
        .eq('data', dateToAggregate);
    }

    // Upsert dados agregados de produtos
    if (produtosArray.length > 0) {
      const { error: produtosError } = await supabase
        .from('vendas_agregadas_produto')
        .upsert(produtosArray, {
          onConflict: 'data,integration_account_id,sku',
          ignoreDuplicates: false
        });

      if (produtosError) {
        console.error('[agregar-vendas-diarias] Erro ao inserir produtos agregados:', produtosError);
        throw produtosError;
      }
    }

    // Upsert dados agregados totais
    if (totaisArray.length > 0) {
      const { error: totaisError } = await supabase
        .from('vendas_agregadas_totais')
        .upsert(totaisArray, {
          onConflict: 'data,integration_account_id',
          ignoreDuplicates: false
        });

      if (totaisError) {
        console.error('[agregar-vendas-diarias] Erro ao inserir totais agregados:', totaisError);
        throw totaisError;
      }
    }

    // Limpar dados agregados com mais de 5 meses (150 dias)
    const cutoffDate = getCutoffDate(150);
    console.log(`[agregar-vendas-diarias] Limpando dados agregados anteriores a ${cutoffDate}`);

    const { error: cleanupProdutosError } = await supabase
      .from('vendas_agregadas_produto')
      .delete()
      .lt('data', cutoffDate);

    if (cleanupProdutosError) {
      console.warn('[agregar-vendas-diarias] Erro ao limpar produtos antigos:', cleanupProdutosError);
    }

    const { error: cleanupTotaisError } = await supabase
      .from('vendas_agregadas_totais')
      .delete()
      .lt('data', cutoffDate);

    if (cleanupTotaisError) {
      console.warn('[agregar-vendas-diarias] Erro ao limpar totais antigos:', cleanupTotaisError);
    }

    const executionTime = Date.now() - startTime;
    console.log(`[agregar-vendas-diarias] Concluído em ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      date: dateToAggregate,
      vendas_processadas: vendas.length,
      produtos_agregados: produtosArray.length,
      contas_agregadas: totaisArray.length,
      execution_time_ms: executionTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[agregar-vendas-diarias] Erro fatal:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido',
      execution_time_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Função para obter a data de ontem no timezone de São Paulo
function getYesterdayDateSP(): string {
  const now = new Date();
  // Ajustar para São Paulo (UTC-3)
  const spOffset = -3 * 60; // minutes
  const utcOffset = now.getTimezoneOffset();
  const spTime = new Date(now.getTime() + (utcOffset + spOffset) * 60 * 1000);
  // Subtrair 1 dia
  spTime.setDate(spTime.getDate() - 1);
  return spTime.toISOString().split('T')[0];
}

// Função para obter data de corte (X dias atrás)
function getCutoffDate(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() - days);
  return now.toISOString().split('T')[0];
}
