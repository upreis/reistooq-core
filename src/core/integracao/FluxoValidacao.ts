/**
 * 🛡️ SISTEMA DE VALIDAÇÃO DOS FLUXOS INTEGRADOS
 * Garante que todos os fluxos entre Pedidos ↔ Estoque ↔ Histórico ↔ De-Para funcionem corretamente
 */

import { Pedido } from '@/types/pedido';

export interface ValidacaoFluxo {
  valido: boolean;
  erros: string[];
  avisos: string[];
}

export interface PedidoEnriquecido extends Pedido {
  sku_kit: string | null;
  total_itens: number;
  status_estoque?: 'pronto_baixar' | 'sem_estoque' | 'pedido_baixado';
}

/**
 * 🔍 Valida se um pedido está pronto para baixa de estoque
 */
export function validarPedidoParaBaixa(pedido: PedidoEnriquecido): ValidacaoFluxo {
  const erros: string[] = [];
  const avisos: string[] = [];

  // Validações obrigatórias
  if (!pedido.sku_kit || pedido.sku_kit.trim() === '') {
    erros.push(`Pedido ${pedido.numero}: SKU Kit não informado`);
  }

  if (!pedido.total_itens || pedido.total_itens <= 0) {
    erros.push(`Pedido ${pedido.numero}: Total de itens deve ser maior que zero`);
  }

  if (!pedido.id || pedido.id.trim() === '') {
    erros.push(`Pedido ${pedido.numero}: ID do pedido não informado`);
  }

  // Validações de aviso
  if (pedido.sku_kit && pedido.sku_kit.length > 50) {
    avisos.push(`Pedido ${pedido.numero}: SKU Kit muito longo (${pedido.sku_kit.length} caracteres)`);
  }

  if (pedido.total_itens && pedido.total_itens > 1000) {
    avisos.push(`Pedido ${pedido.numero}: Quantidade muito alta (${pedido.total_itens} itens)`);
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos
  };
}

/**
 * 🔍 Valida um lote de pedidos para baixa de estoque
 */
export function validarLotePedidos(pedidos: PedidoEnriquecido[]): ValidacaoFluxo {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (!pedidos || pedidos.length === 0) {
    erros.push('Nenhum pedido selecionado para baixa');
    return { valido: false, erros, avisos };
  }

  if (pedidos.length > 100) {
    avisos.push(`Lote muito grande: ${pedidos.length} pedidos (recomendado: até 100)`);
  }

  // Validar cada pedido individualmente
  pedidos.forEach(pedido => {
    const validacao = validarPedidoParaBaixa(pedido);
    erros.push(...validacao.erros);
    avisos.push(...validacao.avisos);
  });

  // Verificar SKUs duplicados
  const skuCounts = new Map<string, number>();
  pedidos.forEach(pedido => {
    if (pedido.sku_kit) {
      const count = skuCounts.get(pedido.sku_kit) || 0;
      skuCounts.set(pedido.sku_kit, count + 1);
    }
  });

  skuCounts.forEach((count, sku) => {
    if (count > 1) {
      avisos.push(`SKU "${sku}" aparece em ${count} pedidos (será somado)`);
    }
  });

  return {
    valido: erros.length === 0,
    erros,
    avisos
  };
}

/**
 * 🔍 Valida se os dados de contexto da UI estão completos
 */
export function validarContextoUI(contexto?: {
  mappingData?: Map<string, any>;
  accounts?: any[];
  selectedAccounts?: string[];
  integrationAccountId?: string;
}): ValidacaoFluxo {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (!contexto) {
    avisos.push('Contexto da UI não fornecido');
    return { valido: true, erros, avisos };
  }

  if (!contexto.mappingData || contexto.mappingData.size === 0) {
    avisos.push('Dados de mapeamento não encontrados');
  }

  if (!contexto.accounts || contexto.accounts.length === 0) {
    avisos.push('Contas de integração não encontradas');
  }

  if (!contexto.integrationAccountId) {
    avisos.push('ID da conta de integração não especificado');
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos
  };
}

/**
 * 🛡️ Função principal de validação completa do fluxo
 */
export function validarFluxoCompleto(
  pedidos: PedidoEnriquecido[],
  contexto?: {
    mappingData?: Map<string, any>;
    accounts?: any[];
    selectedAccounts?: string[];
    integrationAccountId?: string;
  }
): ValidacaoFluxo {
  const erros: string[] = [];
  const avisos: string[] = [];

  console.log('🛡️ Iniciando validação completa do fluxo');

  // Validar lote de pedidos
  const validacaoLote = validarLotePedidos(pedidos);
  erros.push(...validacaoLote.erros);
  avisos.push(...validacaoLote.avisos);

  // Validar contexto da UI
  const validacaoContexto = validarContextoUI(contexto);
  erros.push(...validacaoContexto.erros);
  avisos.push(...validacaoContexto.avisos);

  // Log dos resultados
  if (erros.length > 0) {
    console.error('❌ Validação falhou:', erros);
  }
  if (avisos.length > 0) {
    console.warn('⚠️ Avisos encontrados:', avisos);
  }
  if (erros.length === 0 && avisos.length === 0) {
    console.log('✅ Validação completa bem-sucedida');
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos
  };
}

/**
 * 📊 Gera estatísticas do lote de pedidos
 */
export function gerarEstatisticasLote(pedidos: PedidoEnriquecido[]) {
  const stats = {
    totalPedidos: pedidos.length,
    totalItens: pedidos.reduce((sum, p) => sum + (p.total_itens || 0), 0),
    valorTotal: pedidos.reduce((sum, p) => sum + (p.valor_total || 0), 0),
    skusUnicos: new Set(pedidos.map(p => p.sku_kit).filter(Boolean)).size,
    pedidosSemSku: pedidos.filter(p => !p.sku_kit).length,
    pedidosSemItens: pedidos.filter(p => !p.total_itens || p.total_itens <= 0).length
  };

  console.log('📊 Estatísticas do lote:', stats);
  return stats;
}