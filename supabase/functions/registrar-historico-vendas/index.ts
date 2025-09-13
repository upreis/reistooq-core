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

// POST /registrar-historico-vendas
// Body: objeto com as colunas existentes em public.historico_vendas
Deno.serve(async (req: Request): Promise<Response> => {
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
      'quantidade_kit',
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
      // ✅ Adicionando campos faltantes do histórico
      'receita_flex_bonus',
      'tipo_metodo_envio',
      'metodo_envio_combinado',
      'pack_status',
      'pack_status_detail',
      'pack_id',
    ]);

    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(body)) {
      if (allowedKeys.has(k)) payload[k] = v;
    }

    // Sanitizar integration_account_id (deve ser UUID)
    if (payload.integration_account_id) {
      const val = String(payload.integration_account_id);
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRe.test(val)) {
        console.warn('[registrar-historico-vendas] integration_account_id inválido, removendo do payload:', val);
        delete payload.integration_account_id;
      }
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

    // 🔧 DEDUPLICAÇÃO MELHORADA - verificar múltiplas formas de duplicata
    if (payload.id_unico) {
      try {
        const { data: existing } = await supabase
          .from('historico_vendas')
          .select('id, integration_account_id')
          .eq('id_unico', String(payload.id_unico))
          .maybeSingle();
          
        if (existing?.id) {
          console.log('[registrar-historico-vendas] ✅ registro já existe, retornando ID:', existing.id);
          return new Response(JSON.stringify({ 
            ok: true, 
            id: existing.id, 
            dedup: true,
            message: 'Registro já existe no histórico' 
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      } catch (lookupErr) {
        console.warn('[registrar-historico-vendas] erro na consulta de duplicata:', lookupErr);
      }
    }

    // 🔧 INSERÇÃO via RPC com SECURITY DEFINER (bypassa RLS)
    console.log('[registrar-historico-vendas] tentando inserir via RPC hv_insert...');
    const { data, error } = await supabase.rpc('hv_insert', { p: payload });

    if (error) {
      console.error('[registrar-historico-vendas] ❌ erro na inserção:', error);
      
      // 🔧 TRATAMENTO ROBUSTO de duplicatas (23505)
      const isDuplicate = (error as any)?.code === '23505' ||
        String((error as any)?.message || '').toLowerCase().includes('duplicate') ||
        String((error as any)?.details || '').toLowerCase().includes('already exists');

      if (isDuplicate && payload.id_unico) {
        console.log('[registrar-historico-vendas] 🔄 detectada duplicata 23505, buscando registro existente...');
        try {
          const { data: existing } = await supabase
            .from('historico_vendas')
            .select('id, integration_account_id')
            .eq('id_unico', String(payload.id_unico))
            .maybeSingle();
            
          if (existing?.id) {
            console.log('[registrar-historico-vendas] ✅ registro duplicado encontrado:', existing.id);
            return new Response(JSON.stringify({ 
              ok: true, 
              id: existing.id, 
              dedup: true,
              message: 'Registro já existia (duplicata resolvida)'
            }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          }
        } catch (resolveDupErr) {
          console.error('[registrar-historico-vendas] erro ao resolver duplicata:', resolveDupErr);
        }
        // 🔁 Fallback: ainda que não tenhamos localizado via select, retornar sucesso para não travar UI
        console.warn('[registrar-historico-vendas] ⚠️ duplicata detectada, retornando sucesso mesmo sem localizar registro. id_unico:', payload.id_unico);
        return new Response(JSON.stringify({
          ok: true,
          id: null,
          dedup: true,
          message: 'Registro já existia (dedup sem leitura)'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ 
        ok: false, 
        error: (error as any)?.message || 'Falha na inserção',
        code: (error as any)?.code,
        details: (error as any)?.details
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 🔧 SUCESSO na inserção
    console.log('[registrar-historico-vendas] ✅ inserção bem-sucedida:', data);
    const insertedId = typeof data === 'string' ? data : (data?.id ?? null);
    return new Response(JSON.stringify({ 
      ok: true, 
      id: insertedId,
      message: 'Histórico registrado com sucesso',
      integration_account_id: payload.integration_account_id
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    console.error('[registrar-historico-vendas] unexpected', e?.message || e);
    return new Response(JSON.stringify({ ok: false, error: 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});