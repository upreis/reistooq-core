/**
 * 🗑️ CLEANUP VENDAS ANTIGAS - Edge Function
 * 
 * Remove vendas com mais de 6 meses da tabela vendas_hoje_realtime
 * Executada diariamente via CRON job
 * 
 * Padrão de retenção:
 * - Dados mantidos por 6 meses (180 dias)
 * - Após esse período, são automaticamente excluídos
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cid = () => crypto.randomUUID().slice(0, 8);

Deno.serve(async (req) => {
  const correlationId = cid();
  console.log(`[cleanup-vendas:${correlationId}] 🗑️ Iniciando limpeza de vendas antigas`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Calcular data de corte: 6 meses (180 dias) atrás
    const RETENTION_DAYS = 180;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    console.log(`[cleanup-vendas:${correlationId}] 📅 Data de corte: ${cutoffISO} (${RETENTION_DAYS} dias atrás)`);

    // Contar registros antes de deletar
    const { count: countBefore, error: countError } = await supabase
      .from('vendas_hoje_realtime')
      .select('*', { count: 'exact', head: true })
      .lt('date_created', cutoffISO);

    if (countError) {
      console.error(`[cleanup-vendas:${correlationId}] ❌ Erro ao contar registros:`, countError);
    } else {
      console.log(`[cleanup-vendas:${correlationId}] 📊 Registros a serem deletados: ${countBefore || 0}`);
    }

    // Deletar registros antigos
    const { error: deleteError } = await supabase
      .from('vendas_hoje_realtime')
      .delete()
      .lt('date_created', cutoffISO);

    if (deleteError) {
      console.error(`[cleanup-vendas:${correlationId}] ❌ Erro ao deletar:`, deleteError);
      return new Response(
        JSON.stringify({ success: false, error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[cleanup-vendas:${correlationId}] ✅ Limpeza concluída: ${countBefore || 0} registros removidos`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: countBefore || 0,
        cutoff_date: cutoffISO,
        retention_days: RETENTION_DAYS,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[cleanup-vendas:${correlationId}] ❌ Erro geral:`, error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
