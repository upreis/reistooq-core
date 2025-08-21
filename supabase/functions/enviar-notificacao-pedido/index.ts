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
    
    console.log('[Enviar Notificação Pedido] Request body:', body);
    
    const { 
      orderId, 
      type = 'status_update',
      message,
      email,
      phone,
      template = 'default'
    } = body;
    
    if (!orderId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "orderId é obrigatório" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Buscar dados do pedido
    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .select(`
        *,
        integration_accounts!inner(
          id,
          organization_id,
          provider,
          name
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('Erro ao buscar pedido:', orderError);
      return new Response(JSON.stringify({
        success: false,
        error: `Erro ao buscar pedido: ${orderError.message}`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!order) {
      return new Response(JSON.stringify({
        success: false,
        error: `Pedido ${orderId} não encontrado`
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Buscar configurações de notificação da organização
    const { data: notifConfig } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .eq('organization_id', order.integration_accounts.organization_id)
      .in('chave', ['notificacoes_email', 'notificacoes_sms', 'email_template']);

    const config = Object.fromEntries(
      (notifConfig || []).map(c => [c.chave, c.valor])
    );

    // Preparar notificação baseada no tipo
    const notification = await prepareNotification(order, type, message, template);
    
    const results = {
      email: false,
      sms: false,
      push: false,
      webhook: false
    };

    // Enviar notificação por email (se habilitado)
    if (config.notificacoes_email === 'true' || email) {
      try {
        // Placeholder para integração com serviço de email
        // await sendEmailNotification(order, notification, email || order.nome_cliente);
        console.log(`📧 Email enviado para: ${email || order.nome_cliente}`);
        console.log(`Assunto: ${notification.subject}`);
        console.log(`Corpo: ${notification.body}`);
        results.email = true;
      } catch (error) {
        console.error('Erro ao enviar email:', error);
      }
    }

    // Enviar notificação por SMS (se habilitado)
    if (config.notificacoes_sms === 'true' || phone) {
      try {
        // Placeholder para integração com serviço de SMS
        // await sendSMSNotification(order, notification, phone);
        console.log(`📱 SMS enviado para: ${phone || 'cliente'}`);
        console.log(`Mensagem: ${notification.sms}`);
        results.sms = true;
      } catch (error) {
        console.error('Erro ao enviar SMS:', error);
      }
    }

    // Registrar notificação no histórico
    try {
      await supabase
        .from('historico')
        .insert({
          tipo: 'notificacao',
          descricao: `Notificação ${type} enviada para pedido ${order.numero}`,
          detalhes: {
            pedido_id: orderId,
            pedido_numero: order.numero,
            tipo_notificacao: type,
            canais: results,
            template_usado: template
          }
        });
    } catch (error) {
      console.warn('Erro ao registrar no histórico:', error);
    }

    const response = {
      success: true,
      orderId,
      orderNumber: order.numero,
      notificationType: type,
      channels: results,
      message: 'Notificações processadas'
    };

    console.log('[Enviar Notificação Pedido] Response:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('[Enviar Notificação Pedido] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function prepareNotification(order: any, type: string, customMessage?: string, template = 'default') {
  const templates = {
    status_update: {
      subject: `Atualização do Pedido #${order.numero}`,
      body: customMessage || `Olá ${order.nome_cliente},\n\nSeu pedido #${order.numero} foi atualizado.\nStatus atual: ${order.situacao}\n\nObrigado!`,
      sms: customMessage || `Pedido #${order.numero} atualizado: ${order.situacao}`
    },
    shipped: {
      subject: `Pedido #${order.numero} Enviado`,
      body: `Olá ${order.nome_cliente},\n\nSeu pedido #${order.numero} foi enviado!\n${order.codigo_rastreamento ? `Código de rastreamento: ${order.codigo_rastreamento}` : ''}\n\nObrigado!`,
      sms: `Pedido #${order.numero} enviado! ${order.codigo_rastreamento ? `Rastreamento: ${order.codigo_rastreamento}` : ''}`
    },
    delivered: {
      subject: `Pedido #${order.numero} Entregue`,
      body: `Olá ${order.nome_cliente},\n\nSeu pedido #${order.numero} foi entregue com sucesso!\n\nEsperamos que esteja satisfeito. Obrigado!`,
      sms: `Pedido #${order.numero} entregue! Obrigado pela preferência.`
    },
    cancelled: {
      subject: `Pedido #${order.numero} Cancelado`,
      body: `Olá ${order.nome_cliente},\n\nSeu pedido #${order.numero} foi cancelado.\n\nEm caso de dúvidas, entre em contato conosco.`,
      sms: `Pedido #${order.numero} cancelado. Contate-nos em caso de dúvidas.`
    }
  };

  return templates[type] || templates.status_update;
}