import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { makeClient, corsHeaders } from "../_shared/client.ts";

// POST /registrar-historico-vendas
// Body: objeto com as colunas existentes em public.historico_vendas
export default async function handler(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const authHeader = req.headers.get('Authorization');
  // Use serviço (bypass RLS) para inserir no histórico
  const supabase = makeClient(null);

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Permitir somente colunas conhecidas da tabela historico_vendas
    const allowedKeys = new Set([
      'id_unico',
      'numero_pedido',
      'sku_produto',
      'descricao',
      'quantidade',
      'valor_unitario',
      'valor_total',
      'cliente_nome',
      'cliente_documento',
      'status',
      'observacoes',
      'data_pedido',
      'sku_estoque',
      'sku_kit',
      'qtd_kit',
      'total_itens',
      'cpf_cnpj',
      'empresa',
      'cidade',
      'uf',
      'numero_ecommerce',
      'numero_venda',
      'valor_frete',
      'valor_desconto',
      'data_prevista',
      'obs',
      'obs_interna',
      'codigo_rastreamento',
      'url_rastreamento',
      'integration_account_id',
    ]);

    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(body)) {
      if (allowedKeys.has(k)) payload[k] = v;
    }

    // data_pedido é NOT NULL na tabela
    if (!payload.data_pedido) {
      // usar data atual (YYYY-MM-DD)
      const today = new Date();
      payload.data_pedido = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
        .toISOString()
        .slice(0, 10);
    }

    // Fallbacks seguros
    payload.status = payload.status || 'baixado';
    payload.quantidade = payload.quantidade ?? 0;
    payload.valor_unitario = payload.valor_unitario ?? 0;
    payload.valor_total = payload.valor_total ?? 0;

    // Garantir integration_account_id quando ausente para visibilidade no /historico
    if (!payload.integration_account_id) {
      try {
        if (payload.numero_pedido) {
          const { data: p1 } = await supabase
            .from('pedidos')
            .select('integration_account_id')
            .eq('numero', String(payload.numero_pedido))
            .maybeSingle();
          if (p1?.integration_account_id) payload.integration_account_id = p1.integration_account_id;
        }
        if (!payload.integration_account_id && payload.id_unico) {
          const { data: p2 } = await supabase
            .from('pedidos')
            .select('integration_account_id')
            .eq('id', String(payload.id_unico))
            .maybeSingle();
          if (p2?.integration_account_id) payload.integration_account_id = p2.integration_account_id;
        }
      } catch (resolveErr) {
        console.warn('[registrar-historico-vendas] Falha ao resolver integration_account_id', resolveErr);
      }
    }

    // Dedup: se houver id_unico, evitar inserção duplicada
    if (payload.id_unico) {
      try {
        const { data: existing } = await supabase
          .from('historico_vendas')
          .select('id')
          .eq('id_unico', String(payload.id_unico))
          .maybeSingle();
        if (existing?.id) {
          return new Response(JSON.stringify({ ok: true, id: existing.id, dedup: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      } catch (lookupErr) {
        console.warn('[registrar-historico-vendas] lookup existing failed', lookupErr);
      }
    }

    // Inserir via RPC com SECURITY DEFINER (bypassa RLS)
    const { data, error } = await supabase.rpc('hv_insert', { p: payload });

    if (error) {
      // Se for violação de unicidade (23505), buscar e retornar o existente
      const isDuplicate = (error as any)?.code === '23505' ||
        String((error as any)?.message || '').toLowerCase().includes('duplicate key') ||
        String((error as any)?.details || '').toLowerCase().includes('already exists');

      if (isDuplicate && payload.id_unico) {
        try {
          const { data: existing } = await supabase
            .from('historico_vendas')
            .select('id')
            .eq('id_unico', String(payload.id_unico))
            .maybeSingle();
          if (existing?.id) {
            return new Response(JSON.stringify({ ok: true, id: existing.id, dedup: true }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          }
        } catch (resolveDupErr) {
          console.warn('[registrar-historico-vendas] duplicate resolve failed', resolveDupErr);
        }
      }

      console.error('[registrar-historico-vendas] insert error', error);
      return new Response(JSON.stringify({ ok: false, error: (error as any)?.message || 'insert failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const insertedId = typeof data === 'string' ? data : (data?.id ?? null);
    return new Response(JSON.stringify({ ok: true, id: insertedId }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('[registrar-historico-vendas] unexpected', e?.message || e);
    return new Response(JSON.stringify({ ok: false, error: 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Start the edge function server
serve((req) => handler(req));
