/**
 * 🛡️ SISTEMA INTEGRADO - PONTO DE ENTRADA BLINDADO
 * Centraliza todas as funcionalidades de integração entre:
 * Pedidos ↔ Estoque ↔ Histórico ↔ De-Para
 */

// Validações e tipos
export {
  validarPedidoParaBaixa,
  validarLotePedidos,
  validarContextoUI,
  validarFluxoCompleto,
  gerarEstatisticasLote,
  type ValidacaoFluxo,
  type PedidoEnriquecido
} from './FluxoValidacao';

// Monitoramento
export {
  MonitorIntegracao,
  type LogIntegracao,
  type StatusIntegracao
} from './MonitorIntegracao';

/**
 * 🔐 Configurações de segurança do sistema integrado
 */
export const CONFIG_SEGURANCA = {
  MAX_PEDIDOS_POR_LOTE: 100,
  MAX_TENTATIVAS_BAIXA: 3,
  TIMEOUT_OPERACAO_MS: 30000,
  VALIDACAO_OBRIGATORIA: true,
  LOG_DEBUG_ATIVO: true
} as const;

/**
 * 📋 Lista de operações críticas que requerem validação extra
 */
export const OPERACOES_CRITICAS = [
  'baixar_estoque_direto',
  'hv_insert',
  'criar_mapeamentos_automaticos',
  'fotografar_pedido_completo'
] as const;

/**
 * 🛡️ Status de blindagem do sistema
 */
export const STATUS_BLINDAGEM = {
  ativo: true,
  versao: '3.0',
  ultimaAtualizacao: '2025-08-29',
  componentesProtegidos: [
    'SimplePedidosPage',
    'BaixaEstoqueModal', 
    'useEstoqueBaixa',
    'MapeamentoService',
    'baixar_estoque_direto',
    'hv_insert'
  ],
  fluxosProtegidos: [
    'pedidos_para_estoque',
    'pedidos_para_historico', 
    'pedidos_para_depara',
    'enriquecimento_dados'
  ]
} as const;