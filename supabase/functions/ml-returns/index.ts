/**
 * 🔄 ML RETURNS - Edge Function
 * Busca devoluções da API do Mercado Livre
 */

import { corsHeaders, makeServiceClient, getMlConfig } from '../_shared/client.ts';
import { getErrorMessage } from '../_shared/error-handler.ts';

interface RequestBody {
  accountIds: string[];
  filters?: {
    search?: string;
    status?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  pagination?: {
    offset?: number;
    limit?: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Usar Authorization header para criar client com permissões do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header é obrigatório' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = makeServiceClient();

    // Parse request body
    const body: RequestBody = await req.json();
    const { accountIds, filters = {}, pagination = {} } = body;

    if (!accountIds || accountIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'accountIds é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const offset = pagination.offset || 0;
    const limit = pagination.limit || 50;

    console.log(`🔍 Buscando devoluções para ${accountIds.length} conta(s)`);

    // Buscar configuração ML para cada conta
    const allReturns: any[] = [];
    let totalReturns = 0;

    for (const accountId of accountIds) {
      // Obter access_token usando a função compartilhada COM authHeader
      const mlConfig = await getMlConfig(supabase, accountId, authHeader);
      
      if (!mlConfig || !mlConfig.access_token) {
        console.error(`❌ Token ML não encontrado para conta ${accountId}`);
        continue;
      }

      const accessToken = mlConfig.access_token;
      const sellerId = mlConfig.account_identifier;

      if (!sellerId) {
        console.error(`❌ seller_id não encontrado para conta ${accountId}`);
        continue;
      }

      // Construir URL da API de Returns
      let apiUrl = `https://api.mercadolibre.com/post-purchase/v1/returns/search?seller_id=${sellerId}&offset=${offset}&limit=${limit}`;

      // Adicionar filtros
      if (filters.status && filters.status.length > 0) {
        apiUrl += `&status=${filters.status.join(',')}`;
      }

      if (filters.dateFrom) {
        apiUrl += `&date_from=${filters.dateFrom}`;
      }

      if (filters.dateTo) {
        apiUrl += `&date_to=${filters.dateTo}`;
      }

      if (filters.search) {
        apiUrl += `&q=${encodeURIComponent(filters.search)}`;
      }

      console.log(`🌐 API URL: ${apiUrl}`);

      // Chamar API do ML
      const mlResponse = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
        console.error(`❌ Erro ML API (${mlResponse.status}):`, errorText);
        continue;
      }

      const mlData = await mlResponse.json();
      console.log(`✅ ML retornou ${mlData.results?.length || 0} devoluções`);

      if (mlData.results) {
        allReturns.push(...mlData.results);
        totalReturns = mlData.paging?.total || mlData.results.length;
      }
    }

    // Aplicar filtro de busca local se necessário
    let filteredReturns = allReturns;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredReturns = allReturns.filter((ret) =>
        ret.id?.toString().includes(searchLower) ||
        ret.claim_id?.toLowerCase().includes(searchLower) ||
        ret.order_id?.toString().includes(searchLower) ||
        ret.tracking_number?.toLowerCase().includes(searchLower)
      );
    }

    console.log(`📦 Retornando ${filteredReturns.length} devoluções`);

    return new Response(
      JSON.stringify({
        returns: filteredReturns,
        total: totalReturns,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
