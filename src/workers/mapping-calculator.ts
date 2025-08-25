/**
 * 🔧 WEB WORKER PARA CÁLCULOS DE MAPEAMENTO
 * Otimização de performance para verificações pesadas
 */

// Interface para mensagens do worker
interface WorkerMessage {
  type: 'CALCULATE_MAPPINGS' | 'CALCULATE_FINANCIAL' | 'VALIDATE_ORDERS';
  payload: any;
  id: string;
}

interface WorkerResponse {
  type: 'MAPPING_RESULT' | 'FINANCIAL_RESULT' | 'VALIDATION_RESULT' | 'ERROR';
  payload: any;
  id: string;
}

// Tipagem para mapeamentos
interface MapeamentoData {
  sku_pedido: string;
  sku_correspondente?: string;
  quantidade: number;
  ativo: boolean;
}

interface OrderItem {
  id: string;
  numero: string;
  skus: string[];
  valor_total: number;
  shipping?: any;
  payments?: any[];
}

// Cache interno do worker
const mappingCache = new Map<string, boolean>();
const financialCache = new Map<string, any>();

/**
 * Verificar mapeamentos de SKUs
 */
function calculateMappings(orders: OrderItem[], mapeamentos: MapeamentoData[]) {
  const mapeamentoMap = new Map<string, MapeamentoData>();
  
  // Indexar mapeamentos para busca rápida
  mapeamentos.forEach(map => {
    mapeamentoMap.set(map.sku_pedido.toLowerCase().trim(), map);
  });

  const results = orders.map(order => {
    const orderSkus = order.skus || [];
    const mappedSkus: string[] = [];
    const unmappedSkus: string[] = [];
    
    orderSkus.forEach(sku => {
      const normalizedSku = sku.toLowerCase().trim();
      const mapping = mapeamentoMap.get(normalizedSku);
      
      if (mapping && mapping.ativo && mapping.sku_correspondente) {
        mappedSkus.push(sku);
      } else {
        unmappedSkus.push(sku);
      }
    });

    const temMapeamento = mappedSkus.length === orderSkus.length && orderSkus.length > 0;
    
    // Cache do resultado
    const cacheKey = `${order.id}-${orderSkus.join(',')}`;
    mappingCache.set(cacheKey, temMapeamento);

    return {
      orderId: order.id,
      numero: order.numero,
      temMapeamento,
      mappedSkus,
      unmappedSkus,
      mappingPercentage: orderSkus.length > 0 ? (mappedSkus.length / orderSkus.length) * 100 : 0
    };
  });

  return results;
}

/**
 * Cálculos financeiros complexos
 */
function calculateFinancialMetrics(orders: OrderItem[]) {
  const results = orders.map(order => {
    const cacheKey = `financial-${order.id}`;
    const cached = financialCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Cálculos financeiros pesados
    const valorTotal = Number(order.valor_total) || 0;
    const payments = order.payments || [];
    
    // Receita Flex (bônus de envio)
    let receitaFlex = 0;
    const shipping = order.shipping;
    
    if (shipping?.logistic?.type === 'self_service') {
      // Cálculo complexo de receita Flex
      const costs = shipping.costs;
      if (costs?.senders) {
        receitaFlex = costs.senders.reduce((acc: number, sender: any) => {
          const compensation = Number(sender.compensation) || 0;
          const compensations = sender.compensations || [];
          const nestedComp = compensations.reduce((a: number, c: any) => 
            a + (Number(c.amount) || 0), 0);
          return acc + compensation + nestedComp;
        }, 0);
      }
    }

    // Taxa do marketplace
    let marketplaceFee = 0;
    payments.forEach(payment => {
      if (payment.fee_details) {
        marketplaceFee += payment.fee_details.reduce((acc: number, fee: any) => 
          acc + (Number(fee.amount) || 0), 0);
      }
    });

    // Valor líquido vendedor
    const valorLiquido = valorTotal - marketplaceFee;

    // Análise de lucratividade
    const margin = valorTotal > 0 ? ((valorLiquido / valorTotal) * 100) : 0;
    
    const result = {
      orderId: order.id,
      valorTotal,
      receitaFlex,
      marketplaceFee,
      valorLiquido,
      margin,
      isFlexOrder: receitaFlex > 0,
      profitabilityScore: margin > 20 ? 'alta' : margin > 10 ? 'media' : 'baixa'
    };

    // Cache do resultado
    financialCache.set(cacheKey, result);
    
    return result;
  });

  return results;
}

/**
 * Validações de integridade dos pedidos
 */
function validateOrders(orders: OrderItem[]) {
  return orders.map(order => {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Validações básicas
    if (!order.numero) issues.push('Número do pedido ausente');
    if (!order.skus || order.skus.length === 0) issues.push('SKUs não encontrados');
    if (!order.valor_total || order.valor_total <= 0) warnings.push('Valor total inválido');

    // Validações de shipping
    if (order.shipping) {
      if (!order.shipping.status) warnings.push('Status de envio ausente');
      if (!order.shipping.tracking_number) warnings.push('Código de rastreamento ausente');
    }

    // Validações de pagamento
    if (!order.payments || order.payments.length === 0) {
      issues.push('Informações de pagamento ausentes');
    } else {
      const approvedPayments = order.payments.filter(p => p.status === 'approved');
      if (approvedPayments.length === 0) {
        warnings.push('Nenhum pagamento aprovado');
      }
    }

    return {
      orderId: order.id,
      isValid: issues.length === 0,
      hasWarnings: warnings.length > 0,
      issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 25) - (warnings.length * 10))
    };
  });
}

/**
 * Handler principal das mensagens
 */
self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const { type, payload, id } = e.data;

  try {
    let result: any;

    switch (type) {
      case 'CALCULATE_MAPPINGS':
        result = calculateMappings(payload.orders, payload.mapeamentos);
        self.postMessage({
          type: 'MAPPING_RESULT',
          payload: {
            mappings: result,
            totalOrders: payload.orders.length,
            mappedOrders: result.filter((r: any) => r.temMapeamento).length,
            processingTime: Date.now() - payload.startTime
          },
          id
        } as WorkerResponse);
        break;

      case 'CALCULATE_FINANCIAL':
        result = calculateFinancialMetrics(payload.orders);
        
        // Calcular métricas agregadas
        const totalRevenue = result.reduce((acc: number, r: any) => acc + r.valorTotal, 0);
        const totalFlex = result.reduce((acc: number, r: any) => acc + r.receitaFlex, 0);
        const totalFees = result.reduce((acc: number, r: any) => acc + r.marketplaceFee, 0);
        const avgMargin = result.reduce((acc: number, r: any) => acc + r.margin, 0) / result.length;

        self.postMessage({
          type: 'FINANCIAL_RESULT',
          payload: {
            financials: result,
            aggregates: {
              totalRevenue,
              totalFlex,
              totalFees,
              avgMargin,
              flexOrdersCount: result.filter((r: any) => r.isFlexOrder).length
            },
            processingTime: Date.now() - payload.startTime
          },
          id
        } as WorkerResponse);
        break;

      case 'VALIDATE_ORDERS':
        result = validateOrders(payload.orders);
        
        // Estatísticas de validação
        const validOrders = result.filter((r: any) => r.isValid).length;
        const ordersWithWarnings = result.filter((r: any) => r.hasWarnings).length;
        const avgScore = result.reduce((acc: number, r: any) => acc + r.score, 0) / result.length;

        self.postMessage({
          type: 'VALIDATION_RESULT',
          payload: {
            validations: result,
            stats: {
              validOrders,
              ordersWithWarnings,
              invalidOrders: result.length - validOrders,
              avgScore: Math.round(avgScore)
            },
            processingTime: Date.now() - payload.startTime
          },
          id
        } as WorkerResponse);
        break;

      default:
        throw new Error(`Tipo de mensagem desconhecido: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      id
    } as WorkerResponse);
  }
};

// Limpeza periódica do cache
setInterval(() => {
  // Manter apenas os últimos 1000 itens no cache
  if (mappingCache.size > 1000) {
    const entries = Array.from(mappingCache.entries());
    mappingCache.clear();
    entries.slice(-500).forEach(([key, value]) => {
      mappingCache.set(key, value);
    });
  }
  
  if (financialCache.size > 1000) {
    const entries = Array.from(financialCache.entries());
    financialCache.clear();
    entries.slice(-500).forEach(([key, value]) => {
      financialCache.set(key, value);
    });
  }
}, 60000); // Limpeza a cada minuto

export {};