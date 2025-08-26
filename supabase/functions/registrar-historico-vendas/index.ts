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
  const supabase = makeClient(authHeader);

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

    // Inserir
    const { data, error } = await supabase
      .from('historico_vendas')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('[registrar-historico-vendas] insert error', error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id || null }), {
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
