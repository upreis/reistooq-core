/**
 * 🔍 EMPTY FIELD DETECTOR
 * Detecta e classifica tipos de campos vazios
 */

export type EmptyFieldType = 
  | 'not_in_api'        // Campo não existe na resposta da API ML
  | 'api_returned_null' // API retornou explicitamente null
  | 'mapping_error'     // Erro de mapeamento/transformação
  | 'populated';        // Campo está populado

export interface EmptyFieldAnalysis {
  type: EmptyFieldType;
  message: string;
  severity: 'success' | 'warning' | 'error' | 'info';
}

/**
 * Analisa um campo vazio e determina o motivo
 */
export function analyzeEmptyField(
  value: any,
  sourceData: any,
  sourcePath: string
): EmptyFieldAnalysis {
  // Campo está populado
  if (value !== null && value !== undefined && value !== '') {
    return {
      type: 'populated',
      message: 'Campo populado com dados',
      severity: 'success',
    };
  }

  // Verificar se o campo existe no source data (dados brutos da API)
  const pathParts = sourcePath.split('.');
  let current = sourceData;
  let fieldExists = true;

  for (const part of pathParts) {
    if (!current || typeof current !== 'object') {
      fieldExists = false;
      break;
    }
    if (!(part in current)) {
      fieldExists = false;
      break;
    }
    current = current[part];
  }

  // Campo não existe na API
  if (!fieldExists) {
    return {
      type: 'not_in_api',
      message: `Campo "${sourcePath}" não existe na resposta da API ML`,
      severity: 'info',
    };
  }

  // API retornou explicitamente null
  if (current === null) {
    return {
      type: 'api_returned_null',
      message: 'API ML retornou null para este campo',
      severity: 'warning',
    };
  }

  // Valor existe mas é undefined/vazio - possível erro de mapeamento
  return {
    type: 'mapping_error',
    message: 'Possível erro de mapeamento - verifique transformação de dados',
    severity: 'error',
  };
}

/**
 * Mapeia campos da tabela para seus paths nos dados brutos
 */
export const FIELD_SOURCE_MAP: Record<string, string> = {
  // Buyer Info
  'comprador_nome': 'dados_buyer_info.nome_completo',
  'comprador_cpf': 'dados_buyer_info.cpf',
  'comprador_nickname': 'dados_buyer_info.nickname',
  'comprador_email': 'dados_buyer_info.email',

  // Product Info
  'produto_titulo': 'dados_product_info.titulo',
  'sku': 'dados_product_info.sku',
  'variation_id': 'dados_product_info.variation_id',
  'category_id': 'dados_product_info.category_id',

  // Financial Info
  'valor_retido': 'dados_financial_info.total_amount',
  'metodo_pagamento': 'dados_financial_info.metodo_pagamento',
  'parcelas': 'dados_financial_info.parcelas',
  'valor_parcela': 'dados_financial_info.valor_parcela',

  // Tracking Info
  'codigo_rastreamento': 'dados_tracking_info.codigo_rastreamento',
  'status_rastreamento': 'dados_tracking_info.status_rastreamento',
  'transportadora': 'dados_tracking_info.transportadora',

  // Order
  'order_id': 'dados_order.id',
  'order_date': 'dados_order.date_created',

  // Claim
  'claim_id': 'claim_id',
  'status': 'dados_claim.status.id',
  'status_money': 'dados_claim.status_money.id',
  'subtype': 'dados_claim.subtype.id',
  'resource_type': 'dados_claim.resource_type',

  // Review
  'review_status': 'dados_review.status',
  'review_method': 'dados_review.method',
  'product_condition': 'dados_review.product_condition',
  'product_destination': 'dados_review.product_destination',

  // Quantities
  'quantidade': 'dados_quantities.quantidade',
};

/**
 * Helper para obter análise rápida de campo vazio
 */
export function getEmptyFieldInfo(
  fieldName: string,
  value: any,
  rawData: any
): EmptyFieldAnalysis {
  const sourcePath = FIELD_SOURCE_MAP[fieldName] || fieldName;
  return analyzeEmptyField(value, rawData, sourcePath);
}
