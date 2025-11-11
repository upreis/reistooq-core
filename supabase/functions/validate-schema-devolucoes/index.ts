/**
 * 🔍 VALIDATE SCHEMA DEVOLUCOES
 * Valida campos da API ML contra schema da tabela devolucoes_avancadas
 */

import { corsHeaders, makeServiceClient, ok, fail } from '../_shared/client.ts';

const VALID_COLUMNS = [
  'claim_id', 'order_id', 'return_id', 'integration_account_id',
  'data_criacao_claim', 'data_criacao_devolucao', 'data_atualizacao_devolucao',
  'data_fechamento_devolucao', 'data_fechamento_claim', 'data_inicio_return',
  'claim_stage', 'status_devolucao', 'tipo_claim', 'subtipo_claim',
  'motivo_categoria', 'reason_id', 'reason_name', 'reason_detail',
  'reason_category', 'reason_type', 'reason_priority',
  'produto_titulo', 'sku', 'quantidade', 'valor_original_produto',
  'comprador_nickname', 'comprador_nome_completo', 'comprador_cpf',
  'status_money', 'resource_type', 'shipment_type', 'shipment_destination',
  'delivery_limit', 'refund_at', 'review_status', 'review_method', 'review_stage',
  'product_condition', 'product_destination',
  // JSONB fields
  'dados_claim', 'dados_order', 'dados_return', 'dados_review',
  'dados_buyer_info', 'dados_product_info', 'dados_financial_info',
  'dados_tracking_info', 'dados_quantities', 'dados_available_actions',
  'dados_shipping_costs', 'dados_refund_info', 'dados_lead_time',
  'dados_deadlines', 'dados_acoes_disponiveis', 'dados_custos_logistica',
  'dados_fulfillment', 'dados_comunicacao', 'dados_costs', 'dados_reasons',
  'dados_reviews', 'dados_mensagens', 'dados_product_condition',
  // Metadata
  'created_at', 'updated_at', 'ultima_sincronizacao',
  'id', 'status_analise', 'data_status_analise', 'usuario_status_analise',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = makeServiceClient();

    // 1️⃣ Buscar schema real da tabela
    const { data: columns, error: schemaError } = await serviceClient
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'devolucoes_avancadas');

    if (schemaError) {
      console.error('❌ Erro ao buscar schema:', schemaError);
      return fail('Erro ao buscar schema da tabela');
    }

    const dbColumns = new Set(columns?.map((c: any) => c.column_name) || []);
    
    // 2️⃣ Buscar sample data da API ML para detectar campos
    const { data: sampleClaims } = await serviceClient
      .from('devolucoes_avancadas')
      .select('*')
      .limit(10);

    const apiFields = new Set<string>();
    
    if (sampleClaims && sampleClaims.length > 0) {
      sampleClaims.forEach((claim: any) => {
        Object.keys(claim).forEach(key => apiFields.add(key));
        
        // Extrair campos de JSONB
        ['dados_claim', 'dados_order', 'dados_return'].forEach(jsonbField => {
          if (claim[jsonbField] && typeof claim[jsonbField] === 'object') {
            Object.keys(claim[jsonbField]).forEach(subKey => {
              apiFields.add(`${jsonbField}.${subKey}`);
            });
          }
        });
      });
    }

    // 3️⃣ Comparar e identificar discrepâncias
    const missingInDb: string[] = [];
    const missingInValidList: string[] = [];
    const extraInDb: string[] = [];

    // Campos que aparecem na API mas não na tabela
    apiFields.forEach(field => {
      if (!field.includes('.') && !dbColumns.has(field)) {
        missingInDb.push(field);
      }
    });

    // Campos que estão na validação mas não no DB
    VALID_COLUMNS.forEach(col => {
      if (!dbColumns.has(col)) {
        missingInValidList.push(col);
      }
    });

    // Campos que estão no DB mas não na lista de validação
    dbColumns.forEach(col => {
      if (!VALID_COLUMNS.includes(col) && !col.startsWith('dados_')) {
        extraInDb.push(col);
      }
    });

    // 4️⃣ Gerar sugestões de migration
    const suggestions: string[] = [];

    if (missingInDb.length > 0) {
      suggestions.push('-- Campos detectados na API ML mas ausentes na tabela:');
      missingInDb.forEach(field => {
        const sqlType = inferSqlType(field);
        suggestions.push(
          `ALTER TABLE public.devolucoes_avancadas ADD COLUMN IF NOT EXISTS ${field} ${sqlType};`
        );
      });
    }

    if (missingInValidList.length > 0) {
      suggestions.push('\n-- ⚠️ Campos na lista de validação mas ausentes no DB:');
      suggestions.push(`-- Remover da lista ou criar na tabela: ${missingInValidList.join(', ')}`);
    }

    // 5️⃣ Retornar relatório
    return ok({
      validation: {
        total_db_columns: dbColumns.size,
        total_valid_columns: VALID_COLUMNS.length,
        total_api_fields: apiFields.size,
        discrepancies: {
          missing_in_db: missingInDb.length,
          missing_in_validation: missingInValidList.length,
          extra_in_db: extraInDb.length,
        },
      },
      report: {
        missing_in_db: missingInDb,
        missing_in_validation: missingInValidList,
        extra_in_db: extraInDb,
      },
      migration_suggestions: suggestions.join('\n'),
      recommended_action: suggestions.length > 0 
        ? 'Execute as migrations sugeridas para sincronizar o schema'
        : 'Schema está sincronizado ✅',
    });

  } catch (error: any) {
    console.error('❌ Erro fatal:', error);
    return fail(error.message, 500);
  }
});

function inferSqlType(fieldName: string): string {
  if (fieldName.includes('data_') || fieldName.includes('_at')) {
    return 'timestamp with time zone';
  }
  if (fieldName.includes('valor_') || fieldName.includes('price') || fieldName.includes('amount')) {
    return 'numeric';
  }
  if (fieldName.includes('quantidade') || fieldName.includes('count') || fieldName.includes('total')) {
    return 'integer';
  }
  if (fieldName.includes('dados_') || fieldName.includes('_info') || fieldName.includes('_data')) {
    return 'jsonb DEFAULT \'{}\'::jsonb';
  }
  if (fieldName.includes('id') && !fieldName.includes('_id')) {
    return 'uuid';
  }
  if (fieldName.startsWith('is_') || fieldName.startsWith('has_') || fieldName.startsWith('tem_')) {
    return 'boolean DEFAULT false';
  }
  return 'text';
}
