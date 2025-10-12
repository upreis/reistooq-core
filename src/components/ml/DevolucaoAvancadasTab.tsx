import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { translateCancelReason } from '@/lib/translations';
import { useDevolucoes } from '@/features/devolucoes/hooks/useDevolucoes';
import TimelineVisualization from '@/components/ml/TimelineVisualization';
import { useDevolucoesDemostracao } from '@/features/devolucoes/hooks/useDevolucoesDemostracao';
import { useDevolucaoAnalytics } from '@/features/devolucoes/hooks/useDevolucaoAnalytics';
import { useDevolucaoExportacao } from '@/features/devolucoes/hooks/useDevolucaoExportacao';
import { useDevolucoesFase2 } from '@/features/devolucoes/hooks/useDevolucoesFase2';
import { useDevolucoesBusca } from '@/features/devolucoes/hooks/useDevolucoesBusca';
import DevolucaoAnalyticsDashboard from '@/features/devolucoes/components/DevolucaoAnalyticsDashboard';
import DevolucaoExportDialog from '@/features/devolucoes/components/DevolucaoExportDialog';
import { auditarLoteIndicadores, debugIndicadores } from '@/dev/auditIndicadoresDevoluções';
import { rodarAuditoriaCompleta } from '@/dev/auditoriaCompleta';
import { supabase } from '@/integrations/supabase/client';
import {
  RefreshCw, 
  Download, 
  Filter, 
  Eye, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Loader2,
  FileText,
  CheckSquare,
  Search,
  Wrench,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  FileDown,
  Calendar,
  MessageCircle,
  Truck,
  Calculator,
  Zap
} from 'lucide-react';

interface DevolucaoAvancada {
  // Campos existentes básicos
  id: string;
  integration_account_id: string;
  claim_id?: string;
  order_id: string;
  data_criacao: string;
  status_devolucao?: string;
  claim_status?: string;
  valor_retido?: number;
  produto_titulo?: string;
  sku?: string;
  quantidade?: number;
  comprador_nickname?: string;
  account_name?: string;
  dados_order?: any;
  dados_claim?: any;
  dados_mensagens?: any;
  dados_return?: any;
  created_at: string;
  updated_at: string;
  
  // Novas colunas PHASE 1 - Mensagens e Comunicação
  timeline_mensagens?: any;
  ultima_mensagem_data?: string;
  ultima_mensagem_remetente?: string;
  mensagens_nao_lidas?: number;
  numero_interacoes?: number;
  anexos_count?: number;
  anexos_comprador?: any;
  anexos_vendedor?: any;
  anexos_ml?: any;
  
  // Datas e Prazos
  data_inicio_mediacao?: string;
  data_primeira_acao?: string;
  data_estimada_troca?: string;
  data_limite_troca?: string;
  data_vencimento_acao?: string;
  dias_restantes_acao?: number;
  prazo_revisao_dias?: number;
  
  // Rastreamento e Logística
  codigo_rastreamento?: string;
  transportadora?: string;
  status_rastreamento?: string;
  url_rastreamento?: string;
  endereco_destino?: any;
  
  // Custos e Financeiro
  moeda_custo?: string;
  custo_envio_devolucao?: number;
  valor_compensacao?: number;
  valor_diferenca_troca?: number;
  descricao_custos?: any;
  responsavel_custo?: string;
  
  // Classificação e Resolução
  tipo_claim?: string;
  subtipo_claim?: string;
  motivo_categoria?: string;
  nivel_prioridade?: string;
  tags_automaticas?: string[];
  metodo_resolucao?: string;
  resultado_final?: string;
  resultado_mediacao?: string;
  status_moderacao?: string;
  impacto_reputacao?: string;
  
  // Métricas e KPIs
  tempo_resposta_medio?: number;
  tempo_total_resolucao?: number;
  total_evidencias?: number;
  taxa_satisfacao?: number;
  satisfacao_comprador?: string;
  seller_reputation?: any;
  buyer_reputation?: any;
  
  // Estados e Flags
  escalado_para_ml?: boolean;
  em_mediacao?: boolean;
  acao_seller_necessaria?: boolean;
  eh_troca?: boolean;
  
  // Dados Detalhados
  detalhes_mediacao?: any;
  historico_status?: any;
  proxima_acao_requerida?: string;
  produto_troca_id?: string;
  status_produto_novo?: string;
  mediador_ml?: string;
  usuario_ultima_acao?: string;
  marketplace_origem?: string;

  // === 42 NOVAS COLUNAS IMPLEMENTADAS ===
  // Timeline e Eventos
  timeline_events?: any[];
  timeline_consolidado?: any;
  data_criacao_claim?: string;
  data_inicio_return?: string;
  data_finalizacao_timeline?: string;
  eventos_sistema?: any[];
  marcos_temporais?: any;
  
  // Tracking e Logística Avançada
  tracking_history?: any[];
  shipment_costs?: any;
  shipment_delays?: any[];
  carrier_info?: any;
  tracking_events?: any[];
  data_ultima_movimentacao?: string;
  previsao_entrega_vendedor?: string;
  historico_localizacoes?: any[];
  tempo_transito_dias?: number;
  
  // Análise de Qualidade e Review
  problemas_encontrados?: any[];
  acoes_necessarias_review?: any[];
  data_inicio_review?: string;
  score_qualidade?: number;
  necessita_acao_manual?: boolean;
  revisor_responsavel?: string;
  observacoes_review?: string;
  review_result?: string;
  review_status?: string;
  review_id?: string;
  
  // Análise Temporal e Performance
  tempo_primeira_resposta_vendedor?: number;
  tempo_resposta_comprador?: number;
  tempo_analise_ml?: number;
  dias_ate_resolucao?: number;
  sla_cumprido?: boolean;
  tempo_limite_acao?: string;
  score_satisfacao_final?: number;
  eficiencia_resolucao?: string;
  
  // Dados Financeiros Expandidos
  valor_reembolso_total?: number;
  valor_reembolso_produto?: number;
  valor_reembolso_frete?: number;
  taxa_ml_reembolso?: number;
  custo_logistico_total?: number;
  impacto_financeiro_vendedor?: number;
  data_processamento_reembolso?: string;
  moeda_reembolso?: string;
  metodo_reembolso?: string;
  
  // Metadados e Controle
  dados_incompletos?: boolean;
  ultima_sincronizacao?: string;
  shipment_id?: string;
  fonte_dados_primaria?: string;
  confiabilidade_dados?: string;
  versao_api_utilizada?: string;
  hash_verificacao?: string;
}

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  organization_id: string;
  is_active: boolean;
}

interface DevolucaoAvancadasTabProps {
  mlAccounts: MLAccount[];
  selectedAccountId?: string;
  refetch: () => Promise<void>;
  existingDevolucoes: DevolucaoAvancada[];
}

const DevolucaoAvancadasTab: React.FC<DevolucaoAvancadasTabProps> = ({
  mlAccounts,
  selectedAccountId,
  refetch,
  existingDevolucoes
}) => {
  const [selectedDevolucao, setSelectedDevolucao] = React.useState<DevolucaoAvancada | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showExportDialog, setShowExportDialog] = React.useState(false);

  // Hook principal consolidado com otimizações
  const {
    devolucoes,
    devolucoesFiltradas,
    stats,
    loading,
    currentPage,
    totalPages,
    showAnalytics,
    filters,
    advancedFilters,
    performanceSettings,
    updateFilters,
    updateAdvancedFilters,
    clearFilters,
    buscarComFiltros,
    setCurrentPage,
    toggleAnalytics,
    hasPersistedData,
    autoRefresh,
    lazyLoading
  } = useDevolucoes(mlAccounts, selectedAccountId);

  // Analytics e exportação
  const analytics = useDevolucaoAnalytics(devolucoesFiltradas);
  const exportacao = useDevolucaoExportacao();

  // 🔍 HOOK DE BUSCA AVANÇADA
  const devolucoesBusca = useDevolucoesBusca();

  // 🚀 FASE 2: HOOK PARA AS 42 NOVAS COLUNAS
  const fase2 = useDevolucoesFase2({
    integration_account_id: mlAccounts?.[0]?.id || '',
    auto_enrich: false, // Desabilitado por padrão para não interferir no sistema atual
    batch_size: 25,
    enable_real_time: false
  });

  // Função para extrair motivo do cancelamento completo (garantindo string)
  const getMotivoCancelamento = useCallback((devolucao: DevolucaoAvancada) => {
    try {
      // Buscar primeiro a descrição completa do motivo
      if (devolucao.dados_claim) {
        const claim = devolucao.dados_claim;
        
        // Buscar descrição detalhada primeiro
        if (claim.reason?.description && typeof claim.reason.description === 'string') {
          return claim.reason.description;
        }
        if (claim.resolution?.description && typeof claim.resolution.description === 'string') {
          return claim.resolution.description;
        }
        if (claim.cancel_detail?.description && typeof claim.cancel_detail.description === 'string') {
          return claim.cancel_detail.description;
        }
        if (claim.cancellation_description && typeof claim.cancellation_description === 'string') {
          return claim.cancellation_description;
        }
        if (claim.reason_description && typeof claim.reason_description === 'string') {
          return claim.reason_description;
        }
        if (claim.description && typeof claim.description === 'string') {
          return claim.description;
        }
        
        // Se não tiver descrição, usar o código/motivo simples
        if (claim.reason && typeof claim.reason === 'string') return claim.reason;
        if (claim.cancel_reason && typeof claim.cancel_reason === 'string') return claim.cancel_reason;
        if (claim.cancellation_reason && typeof claim.cancellation_reason === 'string') return claim.cancellation_reason;
        if (claim.resolution?.reason && typeof claim.resolution.reason === 'string') return claim.resolution.reason;
      }
      
      if (devolucao.dados_order) {
        const order = devolucao.dados_order;
        
        // Buscar descrição detalhada primeiro
        if (order.cancel_detail?.description && typeof order.cancel_detail.description === 'string') {
          return order.cancel_detail.description;
        }
        if (order.cancellation_description && typeof order.cancellation_description === 'string') {
          return order.cancellation_description;
        }
        if (order.cancel_description && typeof order.cancel_description === 'string') {
          return order.cancel_description;
        }
        
        // Se não tiver descrição, usar o código simples
        if (order.cancel_reason && typeof order.cancel_reason === 'string') return order.cancel_reason;
        if (order.cancellation_reason && typeof order.cancellation_reason === 'string') return order.cancellation_reason;
      }
      
      if (devolucao.dados_return) {
        const returnData = devolucao.dados_return;
        
        // Buscar descrição detalhada primeiro
        if (returnData.reason_description && typeof returnData.reason_description === 'string') {
          return returnData.reason_description;
        }
        if (returnData.description && typeof returnData.description === 'string') {
          return returnData.description;
        }
        
        // Se não tiver descrição, usar o código simples
        if (returnData.reason && typeof returnData.reason === 'string') return returnData.reason;
        if (returnData.cancel_reason && typeof returnData.cancel_reason === 'string') return returnData.cancel_reason;
        if (returnData.cancellation_reason && typeof returnData.cancellation_reason === 'string') return returnData.cancellation_reason;
      }

      // Se não tiver motivo específico mas estiver cancelado
      if (devolucao.status_devolucao === 'cancelled') {
        return 'Cancelado - motivo não especificado';
      }
      
      return 'N/A';
    } catch (error) {
      console.error('Erro ao extrair motivo:', error);
      return 'N/A';
    }
  }, []);

  // Função para extrair texto detalhado do motivo (garantindo string)
  const getTextoMotivoDetalhado = useCallback((devolucao: DevolucaoAvancada) => {
    try {
      // Buscar texto mais detalhado nos dados JSON
      if (devolucao.dados_claim) {
        const claim = devolucao.dados_claim;
        if (claim.reason_description && typeof claim.reason_description === 'string') return claim.reason_description;
        if (claim.resolution?.description && typeof claim.resolution.description === 'string') return claim.resolution.description;
        if (claim.resolution?.comments && typeof claim.resolution.comments === 'string') return claim.resolution.comments;
        if (claim.reason_detail && typeof claim.reason_detail === 'string') return claim.reason_detail;
        if (claim.description && typeof claim.description === 'string') return claim.description;
        if (claim.comments && typeof claim.comments === 'string') return claim.comments;
        if (claim.explanation && typeof claim.explanation === 'string') return claim.explanation;
      }
      
      if (devolucao.dados_return) {
        const returnData = devolucao.dados_return;
        if (returnData.reason_description && typeof returnData.reason_description === 'string') return returnData.reason_description;
        if (returnData.description && typeof returnData.description === 'string') return returnData.description;
        if (returnData.comments && typeof returnData.comments === 'string') return returnData.comments;
        if (returnData.explanation && typeof returnData.explanation === 'string') return returnData.explanation;
        if (returnData.details && typeof returnData.details === 'string') return returnData.details;
      }

      if (devolucao.dados_order) {
        const order = devolucao.dados_order;
        if (order.cancel_description && typeof order.cancel_description === 'string') return order.cancel_description;
        if (order.cancellation_description && typeof order.cancellation_description === 'string') return order.cancellation_description;
         if (order.cancel_detail && typeof order.cancel_detail === 'string') return order.cancel_detail;
        if (order.comments && typeof order.comments === 'string') return order.comments;
      }

      // Buscar em mensagens se disponível
      if (devolucao.dados_mensagens && Array.isArray(devolucao.dados_mensagens) && devolucao.dados_mensagens.length > 0) {
        const ultimaMensagem = devolucao.dados_mensagens[devolucao.dados_mensagens.length - 1];
        if (ultimaMensagem?.text && typeof ultimaMensagem.text === 'string') return ultimaMensagem.text;
        if (ultimaMensagem?.message && typeof ultimaMensagem.message === 'string') return ultimaMensagem.message;
      }
      
      return 'Sem detalhes disponíveis';
    } catch (error) {
      console.error('Erro ao extrair texto detalhado:', error);
      return 'Sem detalhes disponíveis';
    }
  }, []);

  // Função para extrair mensagens de texto das conversas
  const getTextoMensagens = useCallback((devolucao: DevolucaoAvancada) => {
    try {
      const mensagens = [];
      
      // Debug log para identificar o problema
      console.log('🔍 DEBUG dados_mensagens structure:', {
        type: typeof devolucao.dados_mensagens,
        isArray: Array.isArray(devolucao.dados_mensagens),
        keys: devolucao.dados_mensagens ? Object.keys(devolucao.dados_mensagens) : [],
        value: devolucao.dados_mensagens
      });
      
      // Buscar mensagens nos dados_mensagens
      if (devolucao.dados_mensagens?.messages && Array.isArray(devolucao.dados_mensagens.messages)) {
        for (const msg of devolucao.dados_mensagens.messages) {
          if (msg && typeof msg === 'object' && msg.text && typeof msg.text === 'string') {
            const remetente = msg.sender || msg.from || 'Não identificado';
            mensagens.push(`[${String(remetente)}]: ${String(msg.text).substring(0, 100)}...`);
          }
        }
      }
      
      // Se não encontrou mensagens, buscar em outros lugares
      if (mensagens.length === 0) {
        // Buscar em dados_claim
        if (devolucao.dados_claim?.messages && Array.isArray(devolucao.dados_claim.messages)) {
          for (const msg of devolucao.dados_claim.messages) {
            if (msg && typeof msg === 'object' && msg.text && typeof msg.text === 'string') {
              const remetente = msg.sender || msg.from || 'Não identificado';
              mensagens.push(`[${String(remetente)}]: ${String(msg.text).substring(0, 100)}...`);
            }
          }
        }
        
        // Buscar em dados_return
        if (devolucao.dados_return?.messages && Array.isArray(devolucao.dados_return.messages)) {
          for (const msg of devolucao.dados_return.messages) {
            if (msg && typeof msg === 'object' && msg.text && typeof msg.text === 'string') {
              const remetente = msg.sender || msg.from || 'Não identificado';
              mensagens.push(`[${String(remetente)}]: ${String(msg.text).substring(0, 100)}...`);
            }
          }
        }
      }
      
      const resultado = mensagens.length > 0 ? String(mensagens.join(' | ')) : 'Sem mensagens de texto';
      console.log('🔍 DEBUG resultado getTextoMensagens:', typeof resultado, resultado);
      return resultado;
    } catch (error) {
      console.error('Erro ao extrair mensagens:', error);
      return 'Erro ao carregar mensagens';
    }
  }, []);

  // Função para extrair última mensagem completa
  const getUltimaMensagemTexto = useCallback((devolucao: DevolucaoAvancada) => {
    try {
      // Debug log
      console.log('🔍 DEBUG getUltimaMensagemTexto entrada:', {
        hasDados: !!devolucao.dados_mensagens,
        hasMessages: !!(devolucao.dados_mensagens?.messages),
        messagesCount: devolucao.dados_mensagens?.messages?.length || 0
      });
      
      // Buscar última mensagem nos dados_mensagens
      if (devolucao.dados_mensagens?.messages && Array.isArray(devolucao.dados_mensagens.messages) && devolucao.dados_mensagens.messages.length > 0) {
        const ultimaMensagem = devolucao.dados_mensagens.messages[devolucao.dados_mensagens.messages.length - 1];
        console.log('🔍 DEBUG última mensagem:', typeof ultimaMensagem, ultimaMensagem);
        
        if (ultimaMensagem && typeof ultimaMensagem === 'object' && ultimaMensagem.text && typeof ultimaMensagem.text === 'string') {
          const texto = String(ultimaMensagem.text);
          return texto.substring(0, 200) + (texto.length > 200 ? '...' : '');
        }
      }
      
      // Se não encontrou, buscar em timeline_mensagens
      if (devolucao.timeline_mensagens && Array.isArray(devolucao.timeline_mensagens) && devolucao.timeline_mensagens.length > 0) {
        const ultimaMensagem = devolucao.timeline_mensagens[devolucao.timeline_mensagens.length - 1];
        if (ultimaMensagem && typeof ultimaMensagem === 'object' && ultimaMensagem.text && typeof ultimaMensagem.text === 'string') {
          const texto = String(ultimaMensagem.text);
          return texto.substring(0, 200) + (texto.length > 200 ? '...' : '');
        }
      }
      
      return 'Sem texto da última mensagem';
    } catch (error) {
      console.error('Erro ao extrair última mensagem:', error);
      return 'Erro ao carregar última mensagem';
    }
  }, []);

  // Tempo real para demonstração - corrigir dependências
  useDevolucoesDemostracao(
    advancedFilters.buscarEmTempoReal,
    useCallback((payload) => {
      // Atualização automática será implementada se necessário
      console.log('📡 Atualização tempo real:', payload);
    }, [])
  );

  const exportarCSV = useCallback(() => {
    if (!devolucoesFiltradas.length) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'ID Claim',
      'ID Pedido',
      'SKU',
      'Produto',
      'Quantidade',
      'Valor Reclamado',
      'Status Claim',
      'Estágio',
      'Tipo',
      'Data da Venda',
      'Data Fechamento',
      'Última Atualização',
      'Número Mensagens',
      'Mensagens Não Lidas',
      'Dias Restantes Ação',
      'Código Rastreamento',
      'Transportadora',
      'Anexos Count',
      'Em Mediação',
      'Nível Prioridade',
      'Método Resolução'
    ];

    const csvData = devolucoesFiltradas.map(dev => [
      dev.claim_id || '',
      dev.order_id || '',
      dev.sku || '',
      dev.produto_titulo || '',
      dev.quantidade || '',
      dev.valor_retido || '',
      dev.status_devolucao || '',
      'N/A',
      dev.tipo_claim || 'N/A',
      dev.data_criacao ? (() => { try { return new Date(dev.data_criacao).toLocaleDateString(); } catch { return dev.data_criacao; } })() : '',
      'N/A',
      dev.updated_at ? (() => { try { return new Date(dev.updated_at).toLocaleDateString(); } catch { return dev.updated_at; } })() : '',
      dev.numero_interacoes || 0,
      dev.mensagens_nao_lidas || 0,
      dev.dias_restantes_acao || '',
      dev.codigo_rastreamento || '',
      dev.transportadora || '',
      dev.anexos_count || 0,
      dev.em_mediacao ? 'Sim' : 'Não',
      dev.nivel_prioridade || '',
      dev.metodo_resolucao || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `devolucoes_ml_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Arquivo CSV exportado com sucesso!');
  }, [devolucoesFiltradas]);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas melhoradas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {performanceSettings.enableLazyLoading && `${stats.visible} visíveis`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pendentes</p>
                <p className="text-2xl font-bold dark:text-white">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Concluídas</p>
                <p className="text-2xl font-bold dark:text-white">{stats.concluidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Canceladas</p>
                <p className="text-2xl font-bold dark:text-white">{stats.canceladas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Wrench className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">API ML</p>
                <p className="text-2xl font-bold dark:text-white">{stats.totalLoaded}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dados em tempo real</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de ação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            type="button"
            onClick={buscarComFiltros}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Buscar da API ML
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">

          {/* Auto Refresh Control - Enhanced */}
          <div className="flex items-center gap-2">
            <Button
              variant={advancedFilters.autoRefreshEnabled ? "default" : "outline"}
              onClick={() => updateAdvancedFilters({ autoRefreshEnabled: !advancedFilters.autoRefreshEnabled })}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${advancedFilters.autoRefreshEnabled ? 'animate-spin' : ''}`} />
              Auto-refresh
            </Button>
            
            {/* Minutos Input */}
            <Input
              type="number"
              min="1"
              max="1440"
              value={advancedFilters.autoRefreshEnabled ? Math.floor(advancedFilters.autoRefreshInterval / 60) : ""}
              onChange={(e) => {
                const minutes = parseInt(e.target.value) || 0;
                const seconds = minutes * 60;
                updateAdvancedFilters({
                  autoRefreshEnabled: minutes > 0,
                  autoRefreshInterval: seconds > 0 ? seconds : 3600
                });
              }}
              placeholder="Minutos"
              className="w-20 text-sm"
            />
            <span className="text-sm text-muted-foreground">min</span>
            
            {/* Desativar Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateAdvancedFilters({ autoRefreshEnabled: false })}
              disabled={!advancedFilters.autoRefreshEnabled}
            >
              Desativar
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={exportarCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* FILTROS E FERRAMENTAS DE ANÁLISE - Modularizado */}
      <DevolucaoFilters
        advancedFilters={advancedFilters}
        mlAccounts={mlAccounts}
        loading={loading}
        updateAdvancedFilters={updateAdvancedFilters}
        buscarComFiltros={buscarComFiltros}
        toggleAnalytics={toggleAnalytics}
        fase2={fase2}
      />

      {/* Dashboard de Analytics */}
      {showAnalytics && (
        <DevolucaoAnalyticsDashboard analytics={analytics} />
      )}

      {/* Tabela de devoluções */}
      <Card>
        <CardContent className="p-0">
          {loading && devolucoes.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : devolucoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">Nenhuma devolução encontrada</p>
              <p className="text-sm text-muted-foreground">Clique em "Buscar da API ML" para carregar os dados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    {/* Colunas da tabela - mantidas exatamente como estavam */}
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Order ID</th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">Produto</th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Claim ID</th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">SKU</th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Comprador</th>
                    <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">Qtd</th>
                    <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Valor Retido</th>
                    <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Status</th>
                    <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">Conta ML</th>
                  </tr>
                </thead>
                <tbody>
                  {devolucoes.map((devolucao, index) => (
                    <tr key={`${devolucao.order_id}-${index}`} className="border-b hover:bg-muted/50 dark:border-border">
                      <td className="px-3 py-3 font-medium text-blue-600 dark:text-blue-400">{devolucao.order_id}</td>
                      <td className="px-3 py-3">{devolucao.produto_titulo || 'N/A'}</td>
                      <td className="px-3 py-3">{devolucao.claim_id || 'N/A'}</td>
                      <td className="px-3 py-3">{devolucao.sku || 'N/A'}</td>
                      <td className="px-3 py-3">{devolucao.comprador_nickname || 'N/A'}</td>
                      <td className="px-3 py-3 text-center">{devolucao.quantidade || 1}</td>
                      <td className="px-3 py-3 text-right">R$ {devolucao.valor_retido?.toFixed(2) || '0.00'}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          devolucao.status_devolucao === 'completed' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : devolucao.status_devolucao === 'cancelled'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {devolucao.status_devolucao}
                        </span>
                      </td>
                      <td className="px-3 py-3">{devolucao.account_name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm">Página {currentPage} de {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modal de detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes da Devolução - Order {selectedDevolucao?.order_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDevolucao && (
            <div className="space-y-6">
              {/* Informações básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Order ID</Label>
                      <p className="font-medium">{selectedDevolucao.order_id}</p>
                    </div>
                    <div>
                      <Label>Claim ID</Label>
                      <p className="font-medium">{selectedDevolucao.claim_id || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedDevolucao.status_devolucao === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : selectedDevolucao.status_devolucao === 'cancelled'
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedDevolucao.status_devolucao}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Produto com ícone */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{selectedDevolucao.produto_titulo}</h3>
                      <p className="text-muted-foreground">SKU: {selectedDevolucao.sku || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados do pedido */}
              {selectedDevolucao.dados_order && Object.keys(selectedDevolucao.dados_order).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-auto max-h-60 text-foreground">
                      {JSON.stringify(selectedDevolucao.dados_order, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Timeline Visualização */}
              {selectedDevolucao.timeline_consolidado && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Timeline Completo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimelineVisualization timelineData={selectedDevolucao.timeline_consolidado} />
                  </CardContent>
                </Card>
              )}

              {/* Novas Colunas - Métricas Temporais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Análise Temporal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Tempo Primeira Resposta</Label>
                      <p className="font-medium">{selectedDevolucao.tempo_primeira_resposta_vendedor || 'N/A'} min</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Tempo Total Resolução</Label>
                      <p className="font-medium">{selectedDevolucao.tempo_total_resolucao || 'N/A'} min</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Dias para Resolução</Label>
                      <p className="font-medium">{selectedDevolucao.dias_ate_resolucao || 'N/A'} dias</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">SLA Cumprido</Label>
                      <Badge variant={selectedDevolucao.sla_cumprido ? "default" : "destructive"}>
                        {selectedDevolucao.sla_cumprido ? "Sim" : "Não"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Eficiência Resolução</Label>
                      <p className="font-medium">{selectedDevolucao.eficiencia_resolucao || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Score Qualidade</Label>
                      <p className="font-medium">{selectedDevolucao.score_qualidade || 'N/A'}/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking e Logística */}
              {selectedDevolucao.tracking_history && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Histórico de Rastreamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground">Transportadora</Label>
                          <p className="font-medium">{selectedDevolucao.transportadora || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground">Código Rastreamento</Label>
                          <p className="font-medium">{selectedDevolucao.codigo_rastreamento || 'N/A'}</p>
                        </div>
                      </div>
                      <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-auto max-h-40 text-foreground">
                        {JSON.stringify(selectedDevolucao.tracking_history, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Análise Financeira Expandida */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Análise Financeira Detalhada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Reembolso Total</Label>
                      <p className="font-medium">{selectedDevolucao.valor_reembolso_total ? `R$ ${selectedDevolucao.valor_reembolso_total}` : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Reembolso Produto</Label>
                      <p className="font-medium">{selectedDevolucao.valor_reembolso_produto ? `R$ ${selectedDevolucao.valor_reembolso_produto}` : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Reembolso Frete</Label>
                      <p className="font-medium">{selectedDevolucao.valor_reembolso_frete ? `R$ ${selectedDevolucao.valor_reembolso_frete}` : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Taxa ML</Label>
                      <p className="font-medium">{selectedDevolucao.taxa_ml_reembolso ? `R$ ${selectedDevolucao.taxa_ml_reembolso}` : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Custo Logístico</Label>
                      <p className="font-medium">{selectedDevolucao.custo_logistico_total ? `R$ ${selectedDevolucao.custo_logistico_total}` : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Impacto Vendedor</Label>
                      <p className="font-medium">{selectedDevolucao.impacto_financeiro_vendedor ? `R$ ${selectedDevolucao.impacto_financeiro_vendedor}` : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mensagens e Comunicação */}
              {selectedDevolucao.timeline_mensagens && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Timeline de Mensagens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground">Total Interações</Label>
                          <p className="font-medium">{selectedDevolucao.numero_interacoes || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground">Não Lidas</Label>
                          <p className="font-medium">{selectedDevolucao.mensagens_nao_lidas || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground">Total Evidências</Label>
                          <p className="font-medium">{selectedDevolucao.total_evidencias || 0}</p>
                        </div>
                      </div>
                      <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-auto max-h-40 text-foreground">
                        {JSON.stringify(selectedDevolucao.timeline_mensagens, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dados do claim */}
              {selectedDevolucao.dados_claim && Object.keys(selectedDevolucao.dados_claim).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados do Claim</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-auto max-h-60 text-foreground">
                      {JSON.stringify(selectedDevolucao.dados_claim, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DevolucaoAvancadasTab;