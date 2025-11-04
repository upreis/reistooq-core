/**
 * 🧪 TESTE: Estrutura do Shipment
 * Testa diretamente o endpoint /shipments/{id} para ver a estrutura real
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipment_id, integration_account_id } = await req.json();
    
    if (!shipment_id || !integration_account_id) {
      return new Response(
        JSON.stringify({ error: 'shipment_id e integration_account_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar token da conta
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: account } = await supabase
      .from('integration_accounts')
      .select('access_token')
      .eq('id', integration_account_id)
      .single();

    if (!account?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Token não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TESTE ESTRUTURA SHIPMENT ${shipment_id}`);
    console.log(`${'='.repeat(80)}\n`);

    // Teste 1: /shipments/{id} básico
    console.log('📍 TESTE 1: GET /shipments/{id} (SEM header x-format-new)');
    const basicResp = await fetch(
      `https://api.mercadolibre.com/shipments/${shipment_id}`,
      { headers: { Authorization: `Bearer ${account.access_token}` } }
    );
    const basicData = await basicResp.json();
    console.log('✅ Resposta recebida:', JSON.stringify(basicData, null, 2));

    // Teste 2: /shipments/{id} com x-format-new
    console.log('\n📍 TESTE 2: GET /shipments/{id} (COM header x-format-new)');
    const newFormatResp = await fetch(
      `https://api.mercadolibre.com/shipments/${shipment_id}`,
      { 
        headers: { 
          Authorization: `Bearer ${account.access_token}`,
          'x-format-new': 'true'
        } 
      }
    );
    const newFormatData = await newFormatResp.json();
    console.log('✅ Resposta recebida:', JSON.stringify(newFormatData, null, 2));

    // Teste 3: /shipments/{id}/costs
    console.log('\n📍 TESTE 3: GET /shipments/{id}/costs (COM header x-format-new)');
    const costsResp = await fetch(
      `https://api.mercadolibre.com/shipments/${shipment_id}/costs`,
      { 
        headers: { 
          Authorization: `Bearer ${account.access_token}`,
          'x-format-new': 'true'
        } 
      }
    );
    const costsData = await costsResp.json();
    console.log('✅ Resposta recebida:', JSON.stringify(costsData, null, 2));

    // Análise dos campos
    console.log('\n📊 ANÁLISE DOS CAMPOS:');
    console.log('\n1️⃣ LOGISTIC_TYPE:');
    console.log('   basicData.logistic_type:', basicData.logistic_type);
    console.log('   basicData.logistic.type:', basicData.logistic?.type);
    console.log('   newFormatData.logistic_type:', newFormatData.logistic_type);
    console.log('   newFormatData.logistic.type:', newFormatData.logistic?.type);

    console.log('\n2️⃣ ORDER_COST:');
    console.log('   basicData.order_cost:', basicData.order_cost);
    console.log('   newFormatData.order_cost:', newFormatData.order_cost);
    console.log('   costsData.order_cost:', costsData.order_cost);

    console.log('\n3️⃣ SPECIAL_DISCOUNT:');
    console.log('   basicData.cost_components?.special_discount:', basicData.cost_components?.special_discount);
    console.log('   newFormatData.cost_components?.special_discount:', newFormatData.cost_components?.special_discount);
    console.log('   costsData.cost_components?.special_discount:', costsData.cost_components?.special_discount);

    console.log(`\n${'='.repeat(80)}\n`);

    return new Response(
      JSON.stringify({
        ok: true,
        tests: {
          basic: basicData,
          newFormat: newFormatData,
          costs: costsData
        },
        analysis: {
          logistic_type: {
            'basicData.logistic_type': basicData.logistic_type,
            'basicData.logistic.type': basicData.logistic?.type,
            'newFormatData.logistic_type': newFormatData.logistic_type,
            'newFormatData.logistic.type': newFormatData.logistic?.type,
          },
          order_cost: {
            'basicData': basicData.order_cost,
            'newFormatData': newFormatData.order_cost,
            'costsData': costsData.order_cost,
          },
          special_discount: {
            'basicData': basicData.cost_components?.special_discount,
            'newFormatData': newFormatData.cost_components?.special_discount,
            'costsData': costsData.cost_components?.special_discount,
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
