// F6.6: Edge Function para alertas proativos
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertTrigger {
  type: 'error_rate' | 'response_time' | 'system_health' | 'api_failure';
  threshold: number;
  current_value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

interface AlertNotification {
  id: string;
  title: string;
  message: string;
  severity: AlertTrigger['severity'];
  timestamp: string;
  resolved: boolean;
  actions?: Array<{
    label: string;
    url: string;
    type: 'primary' | 'secondary';
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { trigger } = await req.json() as { trigger: AlertTrigger };

    console.log(`[Proactive Alerts] Processing trigger:`, trigger);

    // Determinar se deve disparar alerta
    const shouldAlert = shouldTriggerAlert(trigger);
    
    if (!shouldAlert) {
      return new Response(
        JSON.stringify({ ok: true, alerted: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar notificação de alerta
    const notification = createAlertNotification(trigger);
    
    // Salvar no banco para histórico
    const { error: saveError } = await supabase
      .from('system_alerts')
      .insert({
        type: trigger.type,
        severity: trigger.severity,
        threshold: trigger.threshold,
        current_value: trigger.current_value,
        metadata: trigger.metadata || {},
        notification_data: notification,
        created_at: new Date().toISOString(),
      });

    if (saveError) {
      console.error('[Proactive Alerts] Error saving alert:', saveError);
    }

    // Enviar notificações baseadas na severidade
    await sendAlertNotifications(notification, trigger.severity);

    console.log(`[Proactive Alerts] Alert triggered successfully:`, notification.title);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        alerted: true,
        notification: notification
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Proactive Alerts] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function shouldTriggerAlert(trigger: AlertTrigger): boolean {
  switch (trigger.type) {
    case 'error_rate':
      return trigger.current_value > trigger.threshold;
    
    case 'response_time':
      return trigger.current_value > trigger.threshold;
    
    case 'system_health':
      return trigger.current_value < trigger.threshold; // Health score (lower is worse)
    
    case 'api_failure':
      return trigger.current_value > trigger.threshold;
    
    default:
      return false;
  }
}

function createAlertNotification(trigger: AlertTrigger): AlertNotification {
  const now = new Date().toISOString();
  
  let title = '';
  let message = '';
  const actions = [
    {
      label: 'Ver Dashboard',
      url: '/monitoring/system-health',
      type: 'primary' as const,
    },
    {
      label: 'Ver Logs',
      url: 'https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/functions',
      type: 'secondary' as const,
    },
  ];

  switch (trigger.type) {
    case 'error_rate':
      title = `Taxa de Erro Elevada Detectada`;
      message = `A taxa de erro atual (${trigger.current_value.toFixed(1)}%) excedeu o limite de ${trigger.threshold}%. Verifique os logs para identificar problemas.`;
      break;
    
    case 'response_time':
      title = `Tempo de Resposta Alto`;
      message = `O tempo médio de resposta (${Math.round(trigger.current_value)}ms) está acima do limite de ${trigger.threshold}ms. O sistema pode estar sobrecarregado.`;
      break;
    
    case 'system_health':
      title = `Saúde do Sistema Comprometida`;
      message = `O score de saúde (${trigger.current_value.toFixed(1)}) está abaixo do mínimo (${trigger.threshold}). Verifique métricas críticas.`;
      break;
    
    case 'api_failure':
      title = `Falhas de API Detectadas`;
      message = `${trigger.current_value} falhas de API registradas, excedendo o limite de ${trigger.threshold}. Investigue APIs externas.`;
      break;
    
    default:
      title = 'Alerta do Sistema';
      message = 'Um problema foi detectado no sistema.';
  }

  return {
    id: crypto.randomUUID(),
    title,
    message,
    severity: trigger.severity,
    timestamp: now,
    resolved: false,
    actions,
  };
}

async function sendAlertNotifications(
  notification: AlertNotification, 
  severity: AlertTrigger['severity']
) {
  // Para alertas críticos, enviar múltiplas notificações
  if (severity === 'critical') {
    // TODO: Integrar com serviços de notificação
    console.log(`[CRITICAL ALERT] ${notification.title}: ${notification.message}`);
    
    // Simular envio de notificações
    // await sendSlackNotification(notification);
    // await sendEmailNotification(notification);
    // await sendPushNotification(notification);
  } else if (severity === 'high') {
    console.log(`[HIGH ALERT] ${notification.title}: ${notification.message}`);
    // await sendSlackNotification(notification);
  } else {
    console.log(`[${severity.toUpperCase()} ALERT] ${notification.title}`);
  }
}

console.log('[Proactive Alerts] Function loaded and ready');