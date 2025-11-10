/**
 * 🎬 ML EXECUTE ACTION - Edge Function
 * Executa ações na API do Mercado Livre (aprovar/reprovar review, imprimir etiqueta, apelar)
 */

import { corsHeaders, makeServiceClient } from '../_shared/client.ts';
import { getErrorMessage } from '../_shared/error-handler.ts';

interface RequestBody {
  returnId: number;
  claimId: number;
  actionType: 'review_ok' | 'review_fail' | 'print_label' | 'appeal' | 'refund' | 'ship';
  integrationAccountId: string;
  
  // Campos opcionais para ações específicas
  reason?: string; // Para review_fail e appeal
  reasonId?: string; // Para review_fail (ex: "SRF2", "SRF3")
  message?: string; // Mensagem adicional para review_fail ou appeal
  attachments?: string[]; // URLs de anexos para review_fail
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const { returnId, claimId, actionType, integrationAccountId, reason, reasonId, message, attachments } = body;

    if (!returnId || !claimId || !actionType || !integrationAccountId) {
      return new Response(
        JSON.stringify({ error: 'returnId, claimId, actionType e integrationAccountId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎬 Executando ação "${actionType}" para return ${returnId}, claim ${claimId}`);

    // Buscar tokens da conta
    const { data: secretRow, error: secretError } = await supabase
      .from('integration_secrets')
      .select('simple_tokens, use_simple, access_token')
      .eq('integration_account_id', integrationAccountId)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    if (secretError || !secretRow) {
      console.error(`❌ Erro ao buscar secret para conta ${integrationAccountId}:`, secretError?.message);
      return new Response(
        JSON.stringify({ error: 'Token de acesso não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let accessToken = '';
    
    // Tentar descriptografia simples primeiro
    if (secretRow.use_simple && secretRow.simple_tokens) {
      try {
        const simpleTokensStr = secretRow.simple_tokens as string;
        if (simpleTokensStr.startsWith('SALT2024::')) {
          const base64Data = simpleTokensStr.replace('SALT2024::', '');
          const jsonStr = atob(base64Data);
          const tokensData = JSON.parse(jsonStr);
          accessToken = tokensData.access_token || '';
          console.log(`✅ Token obtido via descriptografia simples`);
        }
      } catch (err) {
        console.error(`❌ Erro descriptografia simples:`, err);
      }
    }
    
    // Fallback para access_token legado
    if (!accessToken && secretRow.access_token) {
      accessToken = secretRow.access_token;
      console.log(`✅ Token obtido via campo legado`);
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token ML não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Executar ação baseada no tipo
    let result: any;
    
    switch (actionType) {
      case 'review_ok':
        result = await executeReviewOk(returnId, accessToken);
        break;
      
      case 'review_fail':
        result = await executeReviewFail(returnId, accessToken, reasonId, message, attachments);
        break;
      
      case 'print_label':
        result = await executePrintLabel(returnId, accessToken);
        break;
      
      case 'appeal':
        result = await executeAppeal(claimId, accessToken, reason, message);
        break;
      
      case 'ship':
        result = await executeShip(returnId, accessToken);
        break;
      
      case 'refund':
        result = await executeRefund(returnId, accessToken);
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: `Ação "${actionType}" não suportada` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (result.success) {
      console.log(`✅ Ação "${actionType}" executada com sucesso para return ${returnId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Ação "${actionType}" executada com sucesso`,
          data: result.data 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error(`❌ Falha ao executar ação "${actionType}":`, result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || 'Erro ao executar ação' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Erro na edge function ml-execute-action:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * 🟢 APROVAR REVISÃO
 * POST /post-purchase/v2/returns/{id}/reviews
 */
async function executeReviewOk(returnId: number, accessToken: string) {
  try {
    console.log(`🟢 Aprovando review para return ${returnId}...`);
    
    const url = `https://api.mercadolibre.com/post-purchase/v2/returns/${returnId}/reviews`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'ok' // Aprovar a revisão
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao aprovar review (${response.status}):`, errorText);
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText.substring(0, 200)}` 
      };
    }

    const data = await response.json();
    console.log(`✅ Review aprovada:`, data);
    
    return { 
      success: true, 
      data: data 
    };
  } catch (error) {
    console.error('❌ Erro ao executar review_ok:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * 🔴 REPROVAR REVISÃO
 * POST /post-purchase/v2/returns/{id}/reviews
 */
async function executeReviewFail(
  returnId: number, 
  accessToken: string, 
  reasonId?: string,
  message?: string,
  attachments?: string[]
) {
  try {
    console.log(`🔴 Reprovando review para return ${returnId}...`);
    
    const url = `https://api.mercadolibre.com/post-purchase/v2/returns/${returnId}/reviews`;
    
    const body: any = {
      status: 'fail' // Reprovar a revisão
    };
    
    // Adicionar razão se fornecida (ex: "SRF2", "SRF3", "SRF6", "SRF7")
    if (reasonId) {
      body.seller_reason = reasonId;
    }
    
    // Adicionar mensagem se fornecida
    if (message) {
      body.message = message;
    }
    
    // Adicionar anexos se fornecidos
    if (attachments && attachments.length > 0) {
      body.attachments = attachments.map(url => ({ url }));
    }
    
    console.log(`📝 Payload de reprovação:`, body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao reprovar review (${response.status}):`, errorText);
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText.substring(0, 200)}` 
      };
    }

    const data = await response.json();
    console.log(`✅ Review reprovada:`, data);
    
    return { 
      success: true, 
      data: data 
    };
  } catch (error) {
    console.error('❌ Erro ao executar review_fail:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * 🖨️ IMPRIMIR ETIQUETA
 * GET /shipments/{id}/label
 */
async function executePrintLabel(returnId: number, accessToken: string) {
  try {
    console.log(`🖨️ Buscando etiqueta para return ${returnId}...`);
    
    // Primeiro, precisamos buscar o shipment_id do return
    const returnUrl = `https://api.mercadolibre.com/post-purchase/v2/returns/${returnId}`;
    const returnResponse = await fetch(returnUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!returnResponse.ok) {
      return { success: false, error: 'Devolução não encontrada' };
    }
    
    const returnData = await returnResponse.json();
    const shipmentId = returnData.shipments?.[0]?.shipment_id;
    
    if (!shipmentId) {
      return { success: false, error: 'Shipment ID não encontrado para esta devolução' };
    }
    
    // Agora buscar a etiqueta
    const labelUrl = `https://api.mercadolibre.com/shipments/${shipmentId}/label`;
    const labelResponse = await fetch(labelUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!labelResponse.ok) {
      const errorText = await labelResponse.text();
      console.error(`❌ Erro ao buscar etiqueta (${labelResponse.status}):`, errorText);
      return { 
        success: false, 
        error: `Erro ${labelResponse.status}: ${errorText.substring(0, 200)}` 
      };
    }

    const labelData = await labelResponse.json();
    console.log(`✅ Etiqueta obtida para shipment ${shipmentId}`);
    
    return { 
      success: true, 
      data: {
        label_url: labelData.label_url || labelData.url,
        shipment_id: shipmentId
      }
    };
  } catch (error) {
    console.error('❌ Erro ao executar print_label:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * ⚖️ APELAR DECISÃO
 * POST /claims/{id}/appeal
 */
async function executeAppeal(
  claimId: number, 
  accessToken: string, 
  reason?: string,
  message?: string
) {
  try {
    console.log(`⚖️ Apelando claim ${claimId}...`);
    
    const url = `https://api.mercadolibre.com/claims/${claimId}/appeal`;
    
    const body: any = {};
    
    if (reason) {
      body.reason = reason;
    }
    
    if (message) {
      body.message = message;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao apelar (${response.status}):`, errorText);
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText.substring(0, 200)}` 
      };
    }

    const data = await response.json();
    console.log(`✅ Appeal criado:`, data);
    
    return { 
      success: true, 
      data: data 
    };
  } catch (error) {
    console.error('❌ Erro ao executar appeal:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * 📦 ENVIAR PRODUTO
 * POST /shipments/{id}/ship
 */
async function executeShip(returnId: number, accessToken: string) {
  try {
    console.log(`📦 Marcando como enviado return ${returnId}...`);
    
    // Buscar shipment_id
    const returnUrl = `https://api.mercadolibre.com/post-purchase/v2/returns/${returnId}`;
    const returnResponse = await fetch(returnUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!returnResponse.ok) {
      return { success: false, error: 'Devolução não encontrada' };
    }
    
    const returnData = await returnResponse.json();
    const shipmentId = returnData.shipments?.[0]?.shipment_id;
    
    if (!shipmentId) {
      return { success: false, error: 'Shipment ID não encontrado' };
    }
    
    // Marcar como enviado
    const shipUrl = `https://api.mercadolibre.com/shipments/${shipmentId}/ship`;
    const shipResponse = await fetch(shipUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!shipResponse.ok) {
      const errorText = await shipResponse.text();
      return { 
        success: false, 
        error: `Erro ${shipResponse.status}: ${errorText.substring(0, 200)}` 
      };
    }

    const data = await shipResponse.json();
    console.log(`✅ Produto marcado como enviado`);
    
    return { 
      success: true, 
      data: data 
    };
  } catch (error) {
    console.error('❌ Erro ao executar ship:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * 💰 REEMBOLSAR
 * POST /returns/{id}/refund
 */
async function executeRefund(returnId: number, accessToken: string) {
  try {
    console.log(`💰 Processando reembolso para return ${returnId}...`);
    
    const url = `https://api.mercadolibre.com/post-purchase/v2/returns/${returnId}/refund`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao processar reembolso (${response.status}):`, errorText);
      return { 
        success: false, 
        error: `Erro ${response.status}: ${errorText.substring(0, 200)}` 
      };
    }

    const data = await response.json();
    console.log(`✅ Reembolso processado:`, data);
    
    return { 
      success: true, 
      data: data 
    };
  } catch (error) {
    console.error('❌ Erro ao executar refund:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}
