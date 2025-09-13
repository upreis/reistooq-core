import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = 'https://tdjyfqnxvjgossuncpwm.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[ML Webhook] ${req.method} request received`);

    if (req.method !== 'POST') {
      console.log('[ML Webhook] Invalid method:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse o corpo da requisição
    const body = await req.json();
    console.log('[ML Webhook] Notification received:', JSON.stringify(body, null, 2));

    // Extrair informações da notificação
    const { resource, user_id, topic, application_id } = body;
    
    if (!resource || !topic) {
      console.log('[ML Webhook] Missing required fields:', { resource, topic });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Log da notificação recebida
    const logData = {
      webhook_data: body,
      resource,
      user_id: user_id?.toString(),
      topic,
      application_id: application_id?.toString(),
      processed_at: new Date().toISOString(),
      status: 'received'
    };

    // Salvar log no banco (opcional - pode criar uma tabela ml_notifications_log)
    try {
      await supabase
        .from('ml_notifications_log')
        .insert(logData);
      console.log('[ML Webhook] Notification logged successfully');
    } catch (error) {
      console.warn('[ML Webhook] Failed to log notification:', error);
      // Não falhar se não conseguir logar
    }

    // Processar diferentes tipos de notificação
    if (topic === 'orders_v2') {
      console.log('[ML Webhook] Processing order notification for resource:', resource);
      
      // Buscar pedido atualizado via API do ML
      // Aqui você pode chamar a função unified-orders para sincronizar
      try {
        await supabase.functions.invoke('unified-orders', {
          body: { 
            force_sync: true,
            ml_resource: resource 
          }
        });
        console.log('[ML Webhook] Order sync triggered successfully');
      } catch (error) {
        console.error('[ML Webhook] Failed to trigger order sync:', error);
      }
    } else if (topic === 'messages') {
      console.log('[ML Webhook] Processing message notification for resource:', resource);
      // Processar notificações de mensagens
    } else if (topic === 'claims') {
      console.log('[ML Webhook] Processing claim notification for resource:', resource);
      // Processar notificações de reclamações
    } else {
      console.log('[ML Webhook] Unknown topic:', topic);
    }

    // Mercado Livre espera uma resposta 200 OK
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Notification processed',
      resource,
      topic 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('[ML Webhook] Error processing notification:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});