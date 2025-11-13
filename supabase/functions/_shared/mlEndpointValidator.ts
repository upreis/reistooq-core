/**
 * 🔍 ML ENDPOINT VALIDATOR
 * Valida endpoints da API do Mercado Livre automaticamente
 * Detecta mudanças de versão e tenta fallbacks
 */

interface EndpointConfig {
  name: string;
  primary: string;
  fallbacks?: string[];
  method?: 'GET' | 'POST';
  requiresAuth?: boolean;
}

interface ValidationResult {
  success: boolean;
  endpoint: string;
  version: string;
  statusCode?: number;
  error?: string;
  fallbackUsed?: boolean;
}

// 📋 Configuração centralizada de endpoints conhecidos
export const ML_ENDPOINTS = {
  claims: {
    name: 'Claims List',
    primary: '/marketplace/v2/claims/search',
    fallbacks: ['/post-purchase/v1/claims/search'],
    method: 'GET' as const,
    requiresAuth: true
  },
  claimMessages: {
    name: 'Claim Messages',
    primary: '/marketplace/v2/claims/{id}/messages',
    fallbacks: ['/post-purchase/v1/claims/{id}/messages'],
    method: 'GET' as const,
    requiresAuth: true
  },
  claimDetails: {
    name: 'Claim Details',
    primary: '/marketplace/v2/claims/{id}',
    fallbacks: ['/post-purchase/v1/claims/{id}'],
    method: 'GET' as const,
    requiresAuth: true
  },
  returnDetails: {
    name: 'Return Details',
    primary: '/marketplace/v2/returns/{id}',
    fallbacks: ['/post-purchase/v1/returns/{id}'],
    method: 'GET' as const,
    requiresAuth: true
  },
  orders: {
    name: 'Orders',
    primary: '/orders/{id}',
    fallbacks: [],
    method: 'GET' as const,
    requiresAuth: true
  },
  shipments: {
    name: 'Shipments',
    primary: '/shipments/{id}',
    fallbacks: [],
    method: 'GET' as const,
    requiresAuth: true
  }
} as const;

/**
 * Valida um endpoint e tenta fallbacks se necessário
 */
export async function validateAndFetch(
  endpointKey: keyof typeof ML_ENDPOINTS,
  accessToken: string,
  pathParams: Record<string, string> = {},
  options: {
    retryOnFail?: boolean;
    logResults?: boolean;
  } = {}
): Promise<{
  response: Response | null;
  endpointUsed: string;
  fallbackUsed: boolean;
  validationResult: ValidationResult;
}> {
  const config = ML_ENDPOINTS[endpointKey];
  const { retryOnFail = true, logResults = true } = options;
  
  // Substituir parâmetros no path
  const buildUrl = (template: string) => {
    let url = template;
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`{${key}}`, value);
    }
    return `https://api.mercadolibre.com${url}`;
  };

  const primaryUrl = buildUrl(config.primary);
  
  if (logResults) {
    console.log(`🔍 [ML Endpoint Validator] Validando ${config.name}`);
    console.log(`   Primary: ${config.primary}`);
    console.log(`   Full URL: ${primaryUrl}`);
  }

  // Tentar endpoint primário
  try {
    const response = await fetch(primaryUrl, {
      method: config.method,
      headers: config.requiresAuth ? {
        'Authorization': `Bearer ${accessToken}`
      } : {}
    });

    // ✅ Sucesso com endpoint primário
    if (response.ok) {
      const result: ValidationResult = {
        success: true,
        endpoint: config.primary,
        version: extractVersion(config.primary),
        statusCode: response.status,
        fallbackUsed: false
      };

      if (logResults) {
        console.log(`✅ [ML Endpoint Validator] ${config.name} OK (${response.status})`);
        console.log(`   Versão: ${result.version}`);
      }

      return {
        response,
        endpointUsed: config.primary,
        fallbackUsed: false,
        validationResult: result
      };
    }

    // ⚠️ Erro no endpoint primário
    if (logResults) {
      console.warn(`⚠️ [ML Endpoint Validator] ${config.name} falhou (${response.status})`);
      console.warn(`   Endpoint: ${config.primary}`);
      console.warn(`   Tentando fallbacks...`);
    }

    // Tentar fallbacks se configurados
    if (retryOnFail && config.fallbacks && config.fallbacks.length > 0) {
      for (const fallback of config.fallbacks) {
        const fallbackUrl = buildUrl(fallback);
        
        if (logResults) {
          console.log(`🔄 [ML Endpoint Validator] Tentando fallback: ${fallback}`);
        }

        try {
          const fallbackResponse = await fetch(fallbackUrl, {
            method: config.method,
            headers: config.requiresAuth ? {
              'Authorization': `Bearer ${accessToken}`
            } : {}
          });

          if (fallbackResponse.ok) {
            const result: ValidationResult = {
              success: true,
              endpoint: fallback,
              version: extractVersion(fallback),
              statusCode: fallbackResponse.status,
              fallbackUsed: true
            };

            if (logResults) {
              console.log(`✅ [ML Endpoint Validator] Fallback ${fallback} funcionou!`);
              console.log(`   ⚠️ IMPORTANTE: Endpoint primário ${config.primary} está quebrado`);
              console.log(`   Considere atualizar para ${fallback}`);
            }

            // 🚨 Alertar sobre necessidade de atualização
            await logEndpointIssue(config.name, config.primary, fallback, response.status);

            return {
              response: fallbackResponse,
              endpointUsed: fallback,
              fallbackUsed: true,
              validationResult: result
            };
          }
        } catch (fallbackError) {
          if (logResults) {
            console.warn(`❌ Fallback ${fallback} também falhou:`, fallbackError);
          }
        }
      }
    }

    // Nenhum endpoint funcionou
    const result: ValidationResult = {
      success: false,
      endpoint: config.primary,
      version: extractVersion(config.primary),
      statusCode: response.status,
      error: `HTTP ${response.status}`,
      fallbackUsed: false
    };

    return {
      response,
      endpointUsed: config.primary,
      fallbackUsed: false,
      validationResult: result
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (logResults) {
      console.error(`❌ [ML Endpoint Validator] Erro ao validar ${config.name}:`, errorMsg);
    }

    const result: ValidationResult = {
      success: false,
      endpoint: config.primary,
      version: extractVersion(config.primary),
      error: errorMsg,
      fallbackUsed: false
    };

    return {
      response: null,
      endpointUsed: config.primary,
      fallbackUsed: false,
      validationResult: result
    };
  }
}

/**
 * Extrai versão do endpoint
 */
function extractVersion(endpoint: string): string {
  const match = endpoint.match(/\/(v\d+)\//);
  return match ? match[1] : 'unknown';
}

/**
 * Registra problema de endpoint no banco para monitoramento
 */
async function logEndpointIssue(
  endpointName: string,
  brokenEndpoint: string,
  workingFallback: string,
  statusCode: number
): Promise<void> {
  try {
    // Pode ser expandido para salvar no banco de dados
    console.error('🚨 [ML ENDPOINT ISSUE DETECTED]', {
      timestamp: new Date().toISOString(),
      endpoint_name: endpointName,
      broken_endpoint: brokenEndpoint,
      working_fallback: workingFallback,
      status_code: statusCode,
      action_required: 'UPDATE_ENDPOINT_IN_CODE'
    });

    // TODO: Enviar alerta via webhook ou salvar no banco
    // await notifyEndpointIssue({ endpointName, brokenEndpoint, workingFallback });
  } catch (error) {
    console.error('Erro ao registrar issue de endpoint:', error);
  }
}

/**
 * Valida múltiplos endpoints em batch
 */
export async function validateEndpointHealth(
  accessToken: string,
  testClaimId?: string
): Promise<Record<string, ValidationResult>> {
  const results: Record<string, ValidationResult> = {};
  
  console.log('🔍 [ML Endpoint Validator] Iniciando health check dos endpoints...');

  // Testar endpoints que não precisam de ID
  for (const [key, config] of Object.entries(ML_ENDPOINTS)) {
    if (!config.primary.includes('{id}')) {
      const { validationResult } = await validateAndFetch(
        key as keyof typeof ML_ENDPOINTS,
        accessToken,
        {},
        { logResults: false }
      );
      results[key] = validationResult;
    }
  }

  // Testar endpoints que precisam de ID (se fornecido)
  if (testClaimId) {
    const endpointsWithId = ['claimMessages', 'claimDetails'] as const;
    
    for (const key of endpointsWithId) {
      const { validationResult } = await validateAndFetch(
        key,
        accessToken,
        { id: testClaimId },
        { logResults: false }
      );
      results[key] = validationResult;
    }
  }

  // Resumo
  const total = Object.keys(results).length;
  const successful = Object.values(results).filter(r => r.success).length;
  const withFallback = Object.values(results).filter(r => r.fallbackUsed).length;

  console.log('📊 [ML Endpoint Validator] Health Check Completo:');
  console.log(`   Total testado: ${total}`);
  console.log(`   Sucesso: ${successful}/${total}`);
  console.log(`   Usando fallback: ${withFallback}`);

  if (withFallback > 0) {
    console.warn('⚠️ [ML Endpoint Validator] Alguns endpoints primários estão quebrados!');
    console.warn('   Verifique os logs acima para detalhes.');
  }

  return results;
}
