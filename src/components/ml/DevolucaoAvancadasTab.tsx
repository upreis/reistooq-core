import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { translateCancelReason } from '@/lib/translations';
import { useDevolucoes } from '@/features/devolucoes/hooks/useDevolucoes';
import { useDevolucoesDemostracao } from '@/features/devolucoes/hooks/useDevolucoesDemostracao';
import { useDevolucaoAnalytics } from '@/features/devolucoes/hooks/useDevolucaoAnalytics';
import { useDevolucaoExportacao } from '@/features/devolucoes/hooks/useDevolucaoExportacao';
import { useDevolucoesFase2 } from '@/features/devolucoes/hooks/useDevolucoesFase2';
import { useDevolucoesBusca } from '@/features/devolucoes/hooks/useDevolucoesBusca';
import DevolucaoAnalyticsDashboard from '@/features/devolucoes/components/DevolucaoAnalyticsDashboard';
import DevolucaoExportDialog from '@/features/devolucoes/components/DevolucaoExportDialog';
import { auditarLoteIndicadores, debugIndicadores } from '@/dev/auditIndicadoresDevoluções';
import { rodarAuditoriaCompleta } from '@/dev/auditoriaCompleta';
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
  FileDown
} from 'lucide-react';

interface DevolucaoAvancada {
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
  refetch: () => Promise<void>;
  existingDevolucoes: DevolucaoAvancada[];
}

const DevolucaoAvancadasTab: React.FC<DevolucaoAvancadasTabProps> = ({
  mlAccounts,
  refetch,
  existingDevolucoes
}) => {
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoAvancada | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

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
  } = useDevolucoes(mlAccounts);

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
      
      // Buscar mensagens nos dados_mensagens
      if (devolucao.dados_mensagens?.messages && Array.isArray(devolucao.dados_mensagens.messages)) {
        for (const msg of devolucao.dados_mensagens.messages) {
          if (msg.text && typeof msg.text === 'string') {
            const remetente = msg.sender || msg.from || 'Não identificado';
            const data = msg.date_created || msg.created_at || '';
            mensagens.push(`[${remetente}]: ${msg.text.substring(0, 100)}...`);
          }
        }
      }
      
      // Se não encontrou mensagens, buscar em outros lugares
      if (mensagens.length === 0) {
        // Buscar em dados_claim
        if (devolucao.dados_claim?.messages && Array.isArray(devolucao.dados_claim.messages)) {
          for (const msg of devolucao.dados_claim.messages) {
            if (msg.text && typeof msg.text === 'string') {
              const remetente = msg.sender || msg.from || 'Não identificado';
              mensagens.push(`[${remetente}]: ${msg.text.substring(0, 100)}...`);
            }
          }
        }
        
        // Buscar em dados_return
        if (devolucao.dados_return?.messages && Array.isArray(devolucao.dados_return.messages)) {
          for (const msg of devolucao.dados_return.messages) {
            if (msg.text && typeof msg.text === 'string') {
              const remetente = msg.sender || msg.from || 'Não identificado';
              mensagens.push(`[${remetente}]: ${msg.text.substring(0, 100)}...`);
            }
          }
        }
      }
      
      return mensagens.length > 0 ? mensagens.join(' | ') : 'Sem mensagens de texto';
    } catch (error) {
      console.error('Erro ao extrair mensagens:', error);
      return 'Erro ao carregar mensagens';
    }
  }, []);

  // Função para extrair última mensagem completa
  const getUltimaMensagemTexto = useCallback((devolucao: DevolucaoAvancada) => {
    try {
      // Buscar última mensagem nos dados_mensagens
      if (devolucao.dados_mensagens?.messages && Array.isArray(devolucao.dados_mensagens.messages) && devolucao.dados_mensagens.messages.length > 0) {
        const ultimaMensagem = devolucao.dados_mensagens.messages[devolucao.dados_mensagens.messages.length - 1];
        if (ultimaMensagem.text && typeof ultimaMensagem.text === 'string') {
          return ultimaMensagem.text.substring(0, 200) + (ultimaMensagem.text.length > 200 ? '...' : '');
        }
      }
      
      // Se não encontrou, buscar em timeline_mensagens
      if (devolucao.timeline_mensagens && Array.isArray(devolucao.timeline_mensagens) && devolucao.timeline_mensagens.length > 0) {
        const ultimaMensagem = devolucao.timeline_mensagens[devolucao.timeline_mensagens.length - 1];
        if (ultimaMensagem.text && typeof ultimaMensagem.text === 'string') {
          return ultimaMensagem.text.substring(0, 200) + (ultimaMensagem.text.length > 200 ? '...' : '');
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
      'Data Criação',
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

      {/* FILTROS E FERRAMENTAS DE ANÁLISE */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-foreground">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filtros e Ferramentas de Análise</span>
            </div>
          </div>
          
          {/* Linha de filtros horizontais */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Campo de busca */}
            <div className="flex items-center relative min-w-[250px]">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Order ID, comprador..."
                value={advancedFilters.searchTerm || ''}
                onChange={(e) => updateAdvancedFilters({
                  searchTerm: e.target.value
                })}
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
            </div>

            {/* Status */}
            <Select 
              value={advancedFilters.statusClaim || ''} 
              onValueChange={(value) => updateAdvancedFilters({
                statusClaim: value
              })}
            >
              <SelectTrigger className="w-[160px] bg-background border-border text-foreground">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="">Todos os Status</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="with_claims">Com Claims</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>

            {/* Contas ML - Seleção múltipla */}
            <div className="relative">
              <Select 
                value={advancedFilters.contasSelecionadas.length === 0 ? "nenhuma" : 
                       advancedFilters.contasSelecionadas.length === mlAccounts?.length ? "todas" : "multiplas"}
                onValueChange={() => {}} // Controlado via menu customizado
              >
                <SelectTrigger className="min-w-[200px] bg-background border-border text-foreground">
                  <SelectValue>
                    {advancedFilters.contasSelecionadas.length === 0 ? "Nenhuma conta" :
                     advancedFilters.contasSelecionadas.length === mlAccounts?.length ? "Todas as contas" :
                     `${advancedFilters.contasSelecionadas.length} conta${advancedFilters.contasSelecionadas.length > 1 ? 's' : ''} selecionada${advancedFilters.contasSelecionadas.length > 1 ? 's' : ''}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border min-w-[300px] z-50">
                  <div className="p-2">
                    <div className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                      <input
                        type="checkbox"
                        id="todas-contas"
                        checked={advancedFilters.contasSelecionadas.length === mlAccounts?.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateAdvancedFilters({
                              contasSelecionadas: mlAccounts?.map(acc => acc.id) || []
                            });
                          } else {
                            updateAdvancedFilters({
                              contasSelecionadas: []
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor="todas-contas" className="text-sm text-foreground font-medium cursor-pointer">
                        Todas as contas
                      </label>
                    </div>
                    <div className="h-px bg-border my-2"></div>
                    {mlAccounts?.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                        <input
                          type="checkbox"
                          id={`conta-${account.id}`}
                          checked={advancedFilters.contasSelecionadas.includes(account.id)}
                          onChange={(e) => {
                            const currentAccounts = advancedFilters.contasSelecionadas;
                            const newAccounts = e.target.checked
                              ? [...currentAccounts, account.id]
                              : currentAccounts.filter(id => id !== account.id);
                            
                            updateAdvancedFilters({
                              contasSelecionadas: newAccounts
                            });
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`conta-${account.id}`} className="text-sm text-foreground cursor-pointer">
                          {account.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <Input
              type="date"
              value={advancedFilters.dataInicio || ''}
              onChange={(e) => updateAdvancedFilters({
                dataInicio: e.target.value
              })}
              className="w-[140px] bg-background border-border text-foreground [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
            />

            {/* Data Fim */}
            <Input
              type="date"
              value={advancedFilters.dataFim || ''}
              onChange={(e) => updateAdvancedFilters({
                dataFim: e.target.value
              })}
              className="w-[140px] bg-background border-border text-foreground [&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:invert-0"
            />

            {/* Botão Atualizar */}
            <Button 
              onClick={buscarComFiltros}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>

            {/* Botão Análise API */}
            <Button 
              variant="outline"
              onClick={toggleAnalytics}
              className="border-border text-foreground hover:bg-muted flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Análise API
            </Button>

            {/* 🚀 BOTÕES FASE 2: 42 NOVAS COLUNAS */}
            <Button
              variant="outline"
              onClick={() => fase2.enrichExistingData(50)}
              disabled={fase2.loading}
              className="border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
            >
              {fase2.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Enriquecer Fase 2
            </Button>

            <Button
              variant="outline"
              onClick={() => fase2.fetchAdvancedMetrics()}
              disabled={fase2.loading}
              className="border-green-500 text-green-600 hover:bg-green-50 flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Métricas Avançadas
            </Button>

            {/* 🔍 BOTÃO AUDITORIA COMPLETA - FIXO E VISÍVEL */}
            <Button
              variant="outline"
              onClick={() => {
                console.log('🔍 Clicou no botão Auditoria Completa');
                
                if (devolucoesFiltradas.length === 0) {
                  toast.error('Nenhuma devolução para auditar. Faça uma busca primeiro.');
                  return;
                }
                
                console.log('🔍 Executando auditoria completa...');
                const auditoriaCompleta = rodarAuditoriaCompleta(devolucoesFiltradas);
                
                toast.success(`🔍 Auditoria completa! ${auditoriaCompleta.problemas_identificados.length} problemas identificados. Veja o console para detalhes.`);
              }}
              className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-2 px-4 py-2"
            >
              <Wrench className="h-4 w-4" />
              🔍 Auditoria Completa
            </Button>

            {/* 🚀 BOTÃO TESTE ENRIQUECIMENTO - ATUALIZADO */}
            <Button
              variant="outline"
              onClick={async () => {
                console.log('🚀 Testando enriquecimento com exibição direta...');
                
                if (!mlAccounts || mlAccounts.length === 0) {
                  toast.error('Nenhuma conta ML configurada para teste');
                  return;
                }
                
                toast.info('🔄 Buscando dados enriquecidos da API...');
                
                try {
                  // BUSCAR DIRETAMENTE DA API (sem sincronizar no banco)
                  const filtros = {
                    contasSelecionadas: mlAccounts.map(acc => acc.id),
                    dataInicio: '',
                    dataFim: '',
                    statusClaim: '',
                    searchTerm: ''
                  };
                  
                  const dadosEnriquecidos = await devolucoesBusca.buscarDaAPI(filtros, mlAccounts);
                  
                  if (dadosEnriquecidos.length > 0) {
                    console.log('🎉 Dados enriquecidos obtidos:', dadosEnriquecidos);
                    
                    // AUDITORIA COMPLETA DOS DADOS ENRIQUECIDOS
                    const auditoria = {
                      total_devolucoes: dadosEnriquecidos.length,
                      contas_processadas: [...new Set(dadosEnriquecidos.map(d => d.account_name))],
                      campos_enriquecidos: {},
                      campos_faltando: {},
                      problemas_identificados: []
                    };
                    
                    // Analisar cada devolução para auditoria
                    dadosEnriquecidos.forEach((dev, idx) => {
                      const camposPresentes = Object.keys(dev).filter(key => 
                        dev[key] !== null && dev[key] !== undefined && dev[key] !== ''
                      );
                      
                      const camposFaltando = [
                        'claim_id', 'tipo_claim', 'subtipo_claim', 'dados_mensagens',
                        'anexos_count', 'codigo_rastreamento', 'em_mediacao', 
                        'acao_seller_necessaria', 'nivel_prioridade', 'transportadora',
                        'custo_envio_devolucao', 'valor_compensacao', 'responsavel_custo'
                      ].filter(campo => !dev[campo] || dev[campo] === null);
                      
                      auditoria.campos_enriquecidos[`devolucao_${idx}`] = camposPresentes.length;
                      auditoria.campos_faltando[`devolucao_${idx}`] = camposFaltando;
                      
                      // Identificar problemas específicos
                      if (!dev.claim_id) auditoria.problemas_identificados.push(`Devolução ${idx}: Sem claim_id`);
                      if (!dev.dados_claim || Object.keys(dev.dados_claim).length === 0) {
                        auditoria.problemas_identificados.push(`Devolução ${idx}: Sem dados_claim estruturados`);
                      }
                      if (!dev.dados_mensagens || Object.keys(dev.dados_mensagens).length === 0) {
                        auditoria.problemas_identificados.push(`Devolução ${idx}: Sem dados_mensagens`);
                      }
                    });
                    
                    // Criar relatório de auditoria
                    const primeiraDevol = dadosEnriquecidos[0];
                    const relatorioAuditoria = `
📊 AUDITORIA COMPLETA DOS DADOS DE ENRIQUECIMENTO

🎯 RESUMO GERAL:
• Total de devoluções: ${auditoria.total_devolucoes}
• Contas processadas: ${auditoria.contas_processadas.join(', ')}

🔍 PRIMEIRA DEVOLUÇÃO (EXEMPLO):
• Order ID: ${primeiraDevol.order_id}
• Claim ID: ${primeiraDevol.claim_id || '❌ FALTANDO'}
• Tem dados_claim: ${primeiraDevol.dados_claim && Object.keys(primeiraDevol.dados_claim).length > 0 ? '✅ SIM' : '❌ NÃO'}
• Tem dados_mensagens: ${primeiraDevol.dados_mensagens && Object.keys(primeiraDevol.dados_mensagens).length > 0 ? '✅ SIM' : '❌ NÃO'}
• Tem dados_return: ${primeiraDevol.dados_return && Object.keys(primeiraDevol.dados_return).length > 0 ? '✅ SIM' : '❌ NÃO'}

📋 CAMPOS PRESENTES NA PRIMEIRA DEVOLUÇÃO:
${Object.keys(primeiraDevol).filter(k => primeiraDevol[k] !== null && primeiraDevol[k] !== undefined && primeiraDevol[k] !== '').join(', ')}

❌ PROBLEMAS IDENTIFICADOS:
${auditoria.problemas_identificados.slice(0, 10).join('\n')}

🔧 PRÓXIMOS PASSOS:
1. Verificar por que alguns claims não têm claim_id
2. Melhorar extração de dados_mensagens
3. Otimizar mapeamento de campos enriquecidos
4. Implementar fallbacks para dados faltantes
                    `;
                    
                    console.log('📊 AUDITORIA COMPLETA:', auditoria);
                    console.log('🔍 PRIMEIRA DEVOLUÇÃO COMPLETA:', primeiraDevol);
                    
                    // Exibir auditoria
                    alert(relatorioAuditoria);
                    
                    // Log estruturado para análise técnica
                    console.log('🧩 ESTRUTURA COMPLETA DA PRIMEIRA DEVOLUÇÃO:', JSON.stringify(primeiraDevol, null, 2));
                    
                    toast.success(`✅ Auditoria concluída: ${dadosEnriquecidos.length} devoluções analisadas`);
                    
                  } else {
                    toast.warning('⚠️ Nenhuma devolução enriquecida encontrada');
                  }
                  
                } catch (error) {
                  console.error('❌ Erro no teste:', error);
                  toast.error('Erro ao buscar dados enriquecidos');
                }
              }}
              className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-2 px-4 py-2"
              disabled={devolucoesBusca.loading}
            >
              <RefreshCw className={`h-4 w-4 ${devolucoesBusca.loading ? 'animate-spin' : ''}`} />
              📊 Auditoria de Enriquecimento
            </Button>
          </div>

        </CardContent>
      </Card>

        {/* Lista de devoluções - Cards ou Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Devoluções Encontradas ({devolucoesFiltradas.length})</CardTitle>
            {hasPersistedData && (
              <CardDescription>
                🔄 Dados restaurados do cache. Use os botões de sincronização para atualizar.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin dark:text-white" />
              </div>
            ) : devolucoes.length === 0 ? (
              <div className="text-center p-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma devolução encontrada</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Use os filtros para buscar da API ML
                </p>
              </div>
            ) : (
              /* Visualização em Tabela Detalhada */
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50 dark:bg-muted border-b">
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Order ID</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">Produto</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Claim ID</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">SKU</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Comprador</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">Qtd</th>
                       <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Valor Retido</th>
                         <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">Status</th>
                         <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Conta ML</th>
                         
                         {/* COLUNAS ORIGINAIS MANTIDAS */}
                        <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📋 Claim</th>
                        <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📦 Return</th>
                        <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">⚖️ Mediação</th>
                        <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📎 Anexos</th>
                        
                        {/* MENSAGENS E COMUNICAÇÃO (novas) */}
                        <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[300px]">💬 Mensagens (Texto)</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🔔 Não Lidas</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[90px]">👮 Moderação</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Últ Msg</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[250px]">💬 Última Mensagem (Texto)</th>
                       
                       {/* DATAS E PRAZOS (novas) */}
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⏰ Dias Rest.</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Venc. Ação</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Est. Troca</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">📅 Lim. Troca</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📝 Prazo Rev.</th>
                       
                       {/* RASTREAMENTO E LOGÍSTICA (novas) */}
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[90px]">🚛 Rastreio</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🚚 Transport.</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📍 Status Env.</th>
                       
                       {/* CUSTOS E FINANCEIRO (novas) */}
                       <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💰 Custo Env.</th>
                       <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">💸 Compensação</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">💱 Moeda</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🏢 Resp. Custo</th>
                       
                        {/* CLASSIFICAÇÃO E RESOLUÇÃO (novas) */}
                        <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🏷️ Tipo</th>
                        <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🏷️ Subtipo</th>
                        <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⚖️ Em Mediação</th>
                        <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">🎯 Método Resolução</th>
                        <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🚨 Prioridade</th>
                       
                       {/* MÉTRICAS E KPIS (novas) */}
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">⏱️ Resp (min)</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">🏁 Total (min)</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">📊 Evidências</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">😊 Satisfação</th>
                       
                       {/* ESTADOS E FLAGS (novas) */}
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">🔄 Troca</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">🚀 ML</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">✋ Ação Req.</th>
                       
                       {/* COLUNAS ORIGINAIS MANTIDAS */}
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Data Criação</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">Data Atualização</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">Tipo Original</th>
                       <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">Motivo Cancelamento</th>
                       <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devolucoes.map((devolucao, index) => {
                      const claimData = devolucao.dados_claim || {};
                      const orderData = devolucao.dados_order || {};
                      const returnData = devolucao.dados_return || {};
                      const mensagensData = devolucao.dados_mensagens || {};

                      // 🔍 VERIFICAÇÕES CORRIGIDAS BASEADAS NO PDF E DADOS REAIS
                      
                      // 📋 CLAIM (Azul) - Baseado na análise do PDF
                      const temClaimData = !!(
                        // Dados primários de claim
                        (claimData && Object.keys(claimData).length > 0) ||
                        // Mediações do order (confirmado nos dados reais)
                        (orderData?.mediations && Array.isArray(orderData.mediations) && orderData.mediations.length > 0) ||
                        // Claim ID presente
                        devolucao.claim_id ||
                        // Status de cancelamento com reason
                        (claimData?.reason?.code) ||
                        // Cancellation type
                        (claimData?.type === 'cancellation') ||
                        // Cancel detail presente
                        (orderData?.cancel_detail?.code)
                      );

                      // 📦 RETURN (Verde) - Baseado nos endpoints do PDF
                      const temReturnData = !!(
                        // Dados primários de return
                        (returnData && Object.keys(returnData).length > 0) ||
                         (orderData?.order_request?.return && typeof orderData.order_request.return === 'object') ||
                         (orderData?.tags && Array.isArray(orderData.tags) && (
                           orderData.tags.some(tag => typeof tag === 'string' && ['return', 'refund', 'not_delivered', 'fraud_risk_detected'].includes(tag))
                         )) ||
                        // Status indicando devolução
                        (devolucao.status_devolucao && devolucao.status_devolucao !== 'N/A') ||
                        // Dados de rastreamento de devolução
                        devolucao.codigo_rastreamento
                      );

                      // ⚖️ MEDIAÇÃO (Laranja) - Baseado na estrutura do PDF
                      const temMediationData = !!(
                         (orderData?.mediations && Array.isArray(orderData.mediations) && 
                          orderData.mediations.length > 0 && 
                          orderData.mediations.every(m => typeof m === 'object' && m.id)) ||
                        // Detalhes de mediação no claim
                        (claimData?.mediation_details) ||
                        // Códigos específicos de mediação do PDF
                        (claimData?.reason?.code === 'buyer_cancel_express') ||
                        (claimData?.reason?.code === 'fraud') ||
                        (claimData?.reason?.group === 'buyer') ||
                        // Flag de mediação
                        devolucao.em_mediacao ||
                        // Status de moderação
                        devolucao.status_moderacao
                      );

                      // 📎 ANEXOS/MENSAGENS (Cinza/Azul) - Baseado nos endpoints do PDF
                      const temAttachmentsData = !!(
                        // Attachments no claim (endpoint /claims/{claim_id}/attachments)
                        (claimData?.attachments && Array.isArray(claimData.attachments) && claimData.attachments.length > 0) ||
                        (claimData?.claim_attachments && Array.isArray(claimData.claim_attachments) && claimData.claim_attachments.length > 0) ||
                        // Mensagens (endpoint /claims/{claim_id}/messages)
                        (mensagensData && Object.keys(mensagensData).length > 0) ||
                        (devolucao.timeline_mensagens && Array.isArray(devolucao.timeline_mensagens) && devolucao.timeline_mensagens.length > 0) ||
                        // Contadores de anexos/mensagens
                        (devolucao.anexos_count && devolucao.anexos_count > 0) ||
                        (devolucao.numero_interacoes && devolucao.numero_interacoes > 0) ||
                        // Anexos específicos por tipo
                        (devolucao.anexos_comprador && Array.isArray(devolucao.anexos_comprador) && devolucao.anexos_comprador.length > 0) ||
                        (devolucao.anexos_vendedor && Array.isArray(devolucao.anexos_vendedor) && devolucao.anexos_vendedor.length > 0) ||
                        (devolucao.anexos_ml && Array.isArray(devolucao.anexos_ml) && devolucao.anexos_ml.length > 0)
                      );

                       // 🔍 DEBUG: Log simplificado para evitar renderização de objetos + verificação de shipping
                       if (index === 0) {
                         console.log('🔍 DEBUG PRIMEIRA DEVOLUÇÃO:', {
                           order_id: devolucao.order_id,
                           claim_id: devolucao.claim_id,
                           temClaimData,
                           temReturnData, 
                           temMediationData,
                           temAttachmentsData,
                           dados_claim_keys: Object.keys(claimData),
                           dados_return_keys: Object.keys(returnData),
                           dados_order_keys: Object.keys(orderData),
                           dados_mensagens_keys: Object.keys(mensagensData),
                           orderData_mediations_count: orderData?.mediations?.length || 0,
                           orderData_tags_count: orderData?.tags?.length || 0,
                           status_devolucao: devolucao.status_devolucao
                         });
                         
                         // 🚨 DEBUG ESPECÍFICO: Verificar dados de shipping que podem estar causando erro
                         if (orderData?.shipping) {
                           console.log('🚨 SHIPPING DATA FOUND:', typeof orderData.shipping, Object.keys(orderData.shipping));
                         }
                         if (orderData?.cancel_detail) {
                           console.log('🚨 CANCEL DETAIL:', typeof orderData.cancel_detail, orderData.cancel_detail);
                         }
                         if (claimData?.status_detail) {
                           console.log('🚨 CLAIM STATUS DETAIL:', typeof claimData.status_detail, claimData.status_detail);
                         }
                       }

                      return (
                        <tr key={`${devolucao.order_id}-${index}`} className="border-b hover:bg-muted/50 dark:border-border">
                          {/* Order ID */}
                          <td className="px-3 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {devolucao.order_id}
                          </td>
                          
                          {/* Produto */}
                          <td className="px-3 py-3">
                            <div className="max-w-[200px]">
                              <div className="font-medium text-foreground truncate" title={devolucao.produto_titulo}>
                                {devolucao.produto_titulo || 'N/A'}
                              </div>
                            </div>
                          </td>

                          {/* Claim ID */}
                          <td className="px-3 py-3 font-medium text-purple-600 dark:text-purple-400 whitespace-nowrap">
                            {devolucao.claim_id || 'N/A'}
                          </td>
                          
                          {/* SKU */}
                          <td className="px-3 py-3 text-foreground font-mono text-sm whitespace-nowrap">
                            {devolucao.sku || 'N/A'}
                          </td>
                          
                          {/* Comprador */}
                          <td className="px-3 py-3 text-foreground whitespace-nowrap">
                            {devolucao.comprador_nickname || 'N/A'}
                          </td>
                          
                          {/* Quantidade */}
                          <td className="px-3 py-3 text-center text-foreground font-medium">
                            {devolucao.quantidade || 1}
                          </td>
                          
                          {/* Valor Retido */}
                          <td className="px-3 py-3 text-right text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                            R$ {devolucao.valor_retido?.toFixed(2) || '0.00'}
                          </td>
                          
                          {/* Status */}
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              devolucao.status_devolucao === 'completed' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : devolucao.status_devolucao === 'cancelled'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            }`}>
                              {devolucao.status_devolucao}
                            </span>
                          </td>
                          
                          {/* Conta ML */}
                          <td className="px-3 py-3 text-foreground text-sm">
                            {devolucao.account_name || 'N/A'}
                          </td>
                          
                          {/* COLUNAS ORIGINAIS MANTIDAS */}
                          
                          {/* Claim */}
                          <td className="px-3 py-3 text-left">
                            {temClaimData ? (
                              <div className="text-sm">
                                <div className="text-blue-600 dark:text-blue-400 font-medium">
                                  Ativo: {typeof claimData?.status === 'string' ? claimData.status : 'closed'}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  Tipo: {typeof claimData?.type === 'string' ? claimData.type : 'cancel_purchase'}
                                </div>
                                {claimData?.reason_id && typeof claimData.reason_id === 'string' && (
                                  <div className="text-muted-foreground text-xs">
                                    Código: {claimData.reason_id}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sem dados</span>
                            )}
                          </td>
                          
                          {/* Return */}
                          <td className="px-3 py-3 text-left">
                            {temReturnData ? (
                              <div className="text-sm">
                                <div className="text-orange-600 dark:text-orange-400 font-medium">
                                  {Object.keys(returnData).length > 0 ? 'Dados Return' : 'Tags/Status'}
                                </div>
                                 {orderData?.tags && Array.isArray(orderData.tags) && (
                                   <div className="text-muted-foreground text-xs">
                                     {orderData.tags.filter(tag => 
                                       typeof tag === 'string' && ['return', 'refund', 'not_delivered', 'fraud_risk_detected'].includes(tag)
                                     ).join(', ') || 'Outros'}
                                   </div>
                                 )}
                                {devolucao.codigo_rastreamento && (
                                  <div className="text-muted-foreground text-xs">
                                    Rastreio ativo
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sem dados</span>
                            )}
                          </td>
                          
                          {/* Mediação Original */}
                          <td className="px-3 py-3 text-left">
                            {temMediationData ? (
                              <div className="text-sm">
                                <div className="text-purple-600 dark:text-purple-400 font-medium">
                                   {(orderData?.mediations && Array.isArray(orderData.mediations) && orderData.mediations.length > 0) 
                                     ? `${orderData.mediations.length} Mediação(ões)` : 'Em mediação'}
                                </div>
                                {devolucao.em_mediacao && (
                                  <div className="text-muted-foreground text-xs">Ativa</div>
                                )}
                                {devolucao.status_moderacao && (
                                  <div className="text-muted-foreground text-xs">
                                    Mod: {devolucao.status_moderacao}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sem mediação</span>
                            )}
                          </td>
                          
                          {/* Anexos Original */}
                          <td className="px-3 py-3 text-left">
                            {temAttachmentsData ? (
                              <div className="text-sm">
                                <div className="text-green-600 dark:text-green-400 font-medium">
                                  {devolucao.anexos_count || 0} Anexo(s)
                                </div>
                                {devolucao.anexos_comprador?.length > 0 && (
                                  <div className="text-muted-foreground text-xs">
                                    {devolucao.anexos_comprador.length} do comprador
                                  </div>
                                )}
                                {devolucao.anexos_vendedor?.length > 0 && (
                                  <div className="text-muted-foreground text-xs">
                                    {devolucao.anexos_vendedor.length} do vendedor
                                  </div>
                                )}
                                {devolucao.anexos_ml?.length > 0 && (
                                  <div className="text-muted-foreground text-xs">
                                    {devolucao.anexos_ml.length} do ML
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sem anexos</span>
                            )}
                          </td>
                          
                          {/* MENSAGENS E COMUNICAÇÃO (novas colunas) */}
                          
                           {/* Mensagens */}
                           <td className="px-3 py-3 text-left">
                             {(devolucao.numero_interacoes && devolucao.numero_interacoes > 0) ? (
                               <div className="text-sm max-w-[300px]">
                                 <div className="text-blue-600 dark:text-blue-400 font-medium mb-1">
                                   {devolucao.numero_interacoes} Mensagem(ns)
                                 </div>
                                 <div className="text-foreground text-xs border-l-2 border-blue-200 pl-2 line-clamp-3">
                                   {getTextoMensagens(devolucao)}
                                 </div>
                                 {devolucao.ultima_mensagem_remetente && (
                                   <div className="text-muted-foreground text-xs mt-1">
                                     Última por: {devolucao.ultima_mensagem_remetente}
                                   </div>
                                 )}
                               </div>
                             ) : (
                               <span className="text-muted-foreground">Sem mensagens</span>
                             )}
                           </td>
                          
                          {/* Mensagens Não Lidas */}
                          <td className="px-3 py-3 text-center">
                            {(devolucao.mensagens_nao_lidas && devolucao.mensagens_nao_lidas > 0) ? (
                              <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs font-semibold">
                                {devolucao.mensagens_nao_lidas}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                           {/* Status Moderação */}
                           <td className="px-3 py-3 text-center">
                             {devolucao.status_moderacao ? (
                               <span className={`px-2 py-1 rounded text-xs ${
                                 String(devolucao.status_moderacao) === 'approved' ? 'bg-green-100 text-green-800' :
                                 String(devolucao.status_moderacao) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                 'bg-red-100 text-red-800'
                               }`}>
                                 {String(devolucao.status_moderacao)}
                               </span>
                             ) : (
                               <span className="text-muted-foreground">-</span>
                             )}
                           </td>
                          
                           {/* Última Mensagem Data */}
                           <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
                             {devolucao.ultima_mensagem_data ? (() => {
                               try {
                                 return new Date(devolucao.ultima_mensagem_data).toLocaleDateString('pt-BR', {
                                   day: '2-digit',
                                   month: '2-digit',
                                   year: 'numeric',
                                   hour: '2-digit',
                                   minute: '2-digit'
                                 });
                               } catch (error) {
                                 return devolucao.ultima_mensagem_data;
                               }
                             })() : '-'}
                           </td>
                          
                           {/* Última Mensagem Texto */}
                           <td className="px-3 py-3 text-foreground text-sm">
                             <div className="max-w-[250px]">
                               <div className="text-xs text-muted-foreground mb-1">
                                 De: {devolucao.ultima_mensagem_remetente || 'N/A'}
                               </div>
                               <div className="text-foreground line-clamp-3 border-l-2 border-gray-200 pl-2">
                                 {getUltimaMensagemTexto(devolucao)}
                               </div>
                             </div>
                           </td>
                          
                          {/* DATAS E PRAZOS (5 colunas) */}
                          
                          {/* Dias Restantes */}
                          <td className="px-3 py-3 text-center">
                            {devolucao.dias_restantes_acao !== null && devolucao.dias_restantes_acao !== undefined ? (
                              <span className={`font-medium ${
                                devolucao.dias_restantes_acao <= 3 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : devolucao.dias_restantes_acao <= 7 
                                  ? 'text-yellow-600 dark:text-yellow-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {devolucao.dias_restantes_acao}d
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                           {/* Data Vencimento Ação */}
                           <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
                             {devolucao.data_vencimento_acao ? (() => {
                               try {
                                 return new Date(devolucao.data_vencimento_acao).toLocaleDateString('pt-BR');
                               } catch (error) {
                                 return devolucao.data_vencimento_acao;
                               }
                             })() : '-'}
                           </td>
                          
                           {/* Data Estimada Troca */}
                           <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
                             {devolucao.data_estimada_troca ? (() => { try { return new Date(devolucao.data_estimada_troca).toLocaleDateString('pt-BR'); } catch { return devolucao.data_estimada_troca; } })() : '-'}
                           </td>
                          
                           {/* Data Limite Troca */}
                           <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
                             {devolucao.data_limite_troca ? (() => { try { return new Date(devolucao.data_limite_troca).toLocaleDateString('pt-BR'); } catch { return devolucao.data_limite_troca; } })() : '-'}
                           </td>
                          
                          {/* Prazo Revisão Dias */}
                          <td className="px-3 py-3 text-center">
                            {devolucao.prazo_revisao_dias || '-'}
                          </td>
                          
                          {/* RASTREAMENTO E LOGÍSTICA (3 colunas) */}
                          
                          {/* Rastreamento */}
                          <td className="px-3 py-3 text-center">
                             {devolucao.codigo_rastreamento ? (
                              <div className="text-xs">
                                <div className="font-mono text-blue-600 dark:text-blue-400" title={String(devolucao.codigo_rastreamento)}>
                                  {String(devolucao.codigo_rastreamento).substring(0, 8)}...
                                </div>
                                <div className="text-muted-foreground">
                                  {String(devolucao.transportadora || 'N/A')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          {/* Transportadora */}
                           <td className="px-3 py-3 text-foreground text-sm">
                             {String(devolucao.transportadora || '-')}
                           </td>
                          
                          {/* Status Rastreamento */}
                          <td className="px-3 py-3 text-center">
                             {devolucao.status_rastreamento ? (
                              <span className={`px-2 py-1 rounded text-xs ${
                                String(devolucao.status_rastreamento) === 'delivered' ? 'bg-green-100 text-green-800' :
                                String(devolucao.status_rastreamento) === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                String(devolucao.status_rastreamento) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {String(devolucao.status_rastreamento)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          {/* CUSTOS E FINANCEIRO (4 colunas) */}
                          
                          {/* Custo Envio */}
                          <td className="px-3 py-3 text-right text-red-600 dark:text-red-400 font-semibold whitespace-nowrap">
                            {devolucao.custo_envio_devolucao ? `R$ ${devolucao.custo_envio_devolucao.toFixed(2)}` : '-'}
                          </td>
                          
                          {/* Valor Compensação */}
                          <td className="px-3 py-3 text-right text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                            {devolucao.valor_compensacao ? `R$ ${devolucao.valor_compensacao.toFixed(2)}` : '-'}
                          </td>
                          
                          {/* Moeda */}
                          <td className="px-3 py-3 text-center font-medium">
                            {devolucao.moeda_custo || 'BRL'}
                          </td>
                          
                          {/* Responsável Custo */}
                          <td className="px-3 py-3 text-foreground text-sm">
                            {devolucao.responsavel_custo || '-'}
                          </td>
                          
                          {/* CLASSIFICAÇÃO E RESOLUÇÃO (5 colunas) */}
                          
                          {/* Tipo Claim */}
                          <td className="px-3 py-3 text-foreground text-sm">
                            {devolucao.tipo_claim || '-'}
                          </td>
                          
                          {/* Subtipo Claim */}
                          <td className="px-3 py-3 text-foreground text-sm">
                            {devolucao.subtipo_claim || '-'}
                          </td>
                          
                          {/* Em Mediação */}
                          <td className="px-3 py-3 text-center">
                            {devolucao.em_mediacao ? (
                              <span className="text-orange-600 dark:text-orange-400">⚖️</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          {/* Método Resolução */}
                          <td className="px-3 py-3 text-foreground text-sm">
                            {devolucao.metodo_resolucao || '-'}
                          </td>
                          
                          {/* Nível Prioridade */}
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              devolucao.nivel_prioridade === 'critical' ? 'bg-red-100 text-red-800' :
                              devolucao.nivel_prioridade === 'high' ? 'bg-orange-100 text-orange-800' :
                              devolucao.nivel_prioridade === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {devolucao.nivel_prioridade || 'medium'}
                            </span>
                          </td>
                          
                          {/* MÉTRICAS E KPIS (4 colunas) */}
                          
                          {/* Tempo Resposta */}
                          <td className="px-3 py-3 text-center text-sm">
                            {devolucao.tempo_resposta_medio ? `${devolucao.tempo_resposta_medio}min` : '-'}
                          </td>
                          
                          {/* Tempo Total */}
                          <td className="px-3 py-3 text-center text-sm">
                            {devolucao.tempo_total_resolucao ? `${devolucao.tempo_total_resolucao}min` : '-'}
                          </td>
                          
                          {/* Total Evidências */}
                          <td className="px-3 py-3 text-center">
                            {devolucao.total_evidencias || 0}
                          </td>
                          
                          {/* Taxa Satisfação */}
                          <td className="px-3 py-3 text-center">
                            {devolucao.taxa_satisfacao ? (
                              <span className={`font-medium ${
                                devolucao.taxa_satisfacao >= 80 ? 'text-green-600' :
                                devolucao.taxa_satisfacao >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {devolucao.taxa_satisfacao}%
                              </span>
                            ) : '-'}
                          </td>
                          
                          {/* ESTADOS E FLAGS (3 colunas) */}
                          
                          {/* É Troca */}
                          <td className="px-3 py-3 text-center">
                            {devolucao.eh_troca ? (
                              <span className="text-blue-600 dark:text-blue-400">🔄</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          {/* Escalado para ML */}
                          <td className="px-3 py-3 text-center">
                            {devolucao.escalado_para_ml ? (
                              <span className="text-purple-600 dark:text-purple-400">🚀</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                          {/* Ação Seller Necessária */}
                          <td className="px-3 py-3 text-center">
                            {devolucao.acao_seller_necessaria ? (
                              <span className="text-orange-600 dark:text-orange-400">✋</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          
                           {/* Data Criação */}
                           <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
                             {(() => {
                               try {
                                 return new Date(devolucao.data_criacao).toLocaleDateString('pt-BR', {
                                   day: '2-digit',
                                   month: '2-digit',
                                   year: 'numeric'
                                 });
                               } catch {
                                 return devolucao.data_criacao;
                               }
                             })()}
                           </td>
                          
                           {/* Data Atualização (ORIGINAL RESTAURADA) */}
                           <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
                             {(() => {
                               try {
                                 return new Date(devolucao.updated_at).toLocaleDateString('pt-BR', {
                                   day: '2-digit',
                                   month: '2-digit',
                                   year: 'numeric'
                                 });
                               } catch {
                                 return devolucao.updated_at;
                               }
                             })()}
                           </td>
                          
                          {/* Tipo Original (ORIGINAL RESTAURADA) */}
                          <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
                            {claimData.type || 'N/A'}
                          </td>
                          
                          {/* Motivo Cancelamento (ORIGINAL RESTAURADA) */}
                          <td className="px-3 py-3">
                            <div className="max-w-[200px] text-sm text-foreground line-clamp-2" title={String(getMotivoCancelamento(devolucao))}>
                              {String(getMotivoCancelamento(devolucao))}
                            </div>
                          </td>
                          
                          {/* Ações */}
                          <td className="px-3 py-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDevolucao(devolucao);
                                setShowDetails(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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
            className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
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
              {/* Informações básicas com ícones */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <Label className="text-sm text-gray-500 dark:text-gray-400">Order ID</Label>
                        <p className="font-medium text-lg dark:text-white">{selectedDevolucao.order_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <Label className="text-sm text-gray-500 dark:text-gray-400">Claim ID</Label>
                        <p className="font-medium dark:text-white">{selectedDevolucao.claim_id || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <Label className="text-sm text-gray-500 dark:text-gray-400">Status</Label>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedDevolucao.status_devolucao === 'completed' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : selectedDevolucao.status_devolucao === 'cancelled'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {selectedDevolucao.status_devolucao}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <Label className="text-sm text-muted-foreground">SKU</Label>
                        <p className="font-medium text-foreground">{selectedDevolucao.sku || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <Label className="text-sm text-muted-foreground">Quantidade</Label>
                        <p className="font-medium text-foreground">{selectedDevolucao.quantidade}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <Label className="text-sm text-muted-foreground">Valor Retido</Label>
                        <p className="font-medium text-lg text-green-600 dark:text-green-400">R$ {selectedDevolucao.valor_retido?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <div>
                        <Label className="text-sm text-muted-foreground">Comprador</Label>
                        <p className="font-medium text-foreground">{selectedDevolucao.comprador_nickname}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-sm text-muted-foreground">Data Criação</Label>
                        <p className="font-medium text-foreground">{(() => { try { return new Date(selectedDevolucao.data_criacao).toLocaleString(); } catch { return selectedDevolucao.data_criacao; } })()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <div>
                        <Label className="text-sm text-muted-foreground">Motivo do Cancelamento</Label>
                        <p className="font-medium text-foreground">{String(getMotivoCancelamento(selectedDevolucao))}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">Descrição Detalhada do Motivo</Label>
                        <p className="font-medium text-sm leading-relaxed text-foreground">
                          {String(getTextoMotivoDetalhado(selectedDevolucao))}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      <div>
                        <Label className="text-sm text-muted-foreground">Conta ML</Label>
                        <p className="font-medium text-foreground">{selectedDevolucao.account_name || 'N/A'}</p>
                      </div>
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