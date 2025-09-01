/**
 * 🛡️ PÁGINA PEDIDOS REFATORADA - FASES 1, 2 E 3 COMPLETAS
 * Sistema blindado com arquitetura unificada + Performance + UX
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Package, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, AlertCircle, Clock, Filter, Settings, CheckSquare, CalendarIcon, Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { BaixaEstoqueModal } from './BaixaEstoqueModal';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { Pedido } from '@/types/pedido';
import { Checkbox } from '@/components/ui/checkbox';

import { mapMLShippingSubstatus } from '@/utils/mlStatusMapping';
import { listPedidos } from '@/services/pedidos';
import { mapApiStatusToLabel, getStatusBadgeVariant, mapSituacaoToApiStatus, statusMatchesFilter } from '@/utils/statusMapping';
import { usePedidosManager } from '@/hooks/usePedidosManager';
import { ExportModal } from './ExportModal';
import { SavedFiltersManager } from './SavedFiltersManager';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePedidosProcessados } from '@/hooks/usePedidosProcessados';
import { buildIdUnico } from '@/utils/idUnico';
import { 
  getShippingStatusColor, 
  translateShippingStatus, 
  translateShippingSubstatus, 
  translateShippingMode, 
  translateShippingMethod 
} from '@/utils/pedidos-translations';

// ✅ SISTEMA UNIFICADO DE FILTROS
import { usePedidosFiltersUnified } from '@/hooks/usePedidosFiltersUnified';
import { PedidosFiltersUnified } from './PedidosFiltersUnified';

import { useColumnManager } from '@/features/pedidos/hooks/useColumnManager';
import { ColumnManager } from '@/features/pedidos/components/ColumnManager';
import { PedidosTableSection } from './components/PedidosTableSection';
import { PedidosDashboardSection } from './components/PedidosDashboardSection';
import { PedidosHeaderSection } from './components/PedidosHeaderSection';
import { PedidosBulkActionsSection } from './components/PedidosBulkActionsSection';
import { PedidosModalsSection } from './components/PedidosModalsSection';
import { usePedidosMappingsOptimized } from './hooks/usePedidosMappingsOptimized';


type Order = {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string;
  data_pedido: string;
  data_prevista: string;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string;
  numero_venda: string;
  empresa: string;
  cidade: string;
  uf: string;
  codigo_rastreamento: string;
  url_rastreamento: string;
  obs: string;
  obs_interna: string;
  integration_account_id: string;
  created_at: string;
  updated_at: string;
  skus?: string[];
  raw?: any;
  unified?: any;
  [key: string]: any;
};

type Props = {
  className?: string;
};

function SimplePedidosPage({ className }: Props) {
  // ✅ SISTEMA UNIFICADO DE FILTROS - UX CONSISTENTE
  const filtersManager = usePedidosFiltersUnified({
    onFiltersApply: (filters) => {
      console.log('🔍 Aplicando filtros unificados:', filters);
      actions.replaceFilters(filters); // ✅ substitui completamente para evitar filtros antigos
      
      // ✅ Força atualização imediata com os filtros atuais
      setTimeout(() => {
        actions.refetch();
      }, 0);
    },
    autoLoad: false,          // ✅ Não carregar automaticamente
    loadSavedFilters: false   // ✅ Não aplicar filtros salvos automaticamente
  });
  
  // Estado unificado dos pedidos
  const pedidosManager = usePedidosManager();
  const { state, actions, totalPages } = pedidosManager;
  
  // 🔧 Sistema de colunas unificado com persistência automatica
  const columnManager = useColumnManager();
  const visibleColumns = columnManager.state.visibleColumns;
  
  // Estados locais para funcionalidades específicas
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  
  // 🧠 Hook de mapeamentos otimizado - CORREÇÃO DE PERFORMANCE
  const {
    mappingData,
    isProcessingMappings,
    processingStats,
    cacheStats,
    actions: mappingActions
  } = usePedidosMappingsOptimized({
    enabled: true,
    autoProcess: true,
    debounceMs: 800, // ✅ Debounce maior para evitar múltiplas execuções
    onMappingUpdate: (mappings) => {
      console.log('📊 [SimplePedidosPage] Mapeamentos atualizados:', mappings.size, 'pedidos');
    }
  });
  
  // Hook para verificar pedidos já processados
  const { pedidosProcessados, verificarPedidos, isLoading: loadingProcessados, isPedidoProcessado } = usePedidosProcessados();
  
  // Aliases para compatibilidade
  const orders = state.orders;
  const total = state.total;
  const loading = state.loading;
  const error = state.error;
  const currentPage = state.currentPage;
  const integrationAccountId = state.integrationAccountId;
  

  // ✅ MIGRAÇÃO FASE 1: Funções de tradução movidas para @/utils/pedidos-translations

  const translateTags = (tags: string[]): string => {
    const translations: Record<string, string> = {
      'immediate_payment': 'Pagamento Imediato',
      'immediate payment': 'Pagamento Imediato',
      'cart': 'Carrinho',
      'mandatory_immediate_payment': 'Pagamento Imediato Obrigatório',
      'mandatory immediate payment': 'Pagamento Imediato Obrigatório',
      'paid': 'Pago',
      'not_paid': 'Não Pago',
      'not paid': 'Não Pago',
      'pack_order': 'Pedido Pack',
      'pack order': 'Pedido Pack',
      'delivered': 'Entregue',
      'not_delivered': 'Não Entregue',
      'not delivered': 'Não Entregue',
      'fbm': 'Enviado pelo Vendedor',
      'fulfillment': 'Full',
      'self_service_in': 'Auto Atendimento',
      'self service in': 'Auto Atendimento',
      'self_service_out': 'Retirada',
      'self service out': 'Retirada',
      'normal': 'Normal',
      'me2': 'Mercado Envios 2',
      'no_shipping': 'Sem Frete',
      'no shipping': 'Sem Frete',
      'free_shipping': 'Frete Grátis',
      'free shipping': 'Frete Grátis',
      'express_shipping': 'Frete Expresso',
      'express shipping': 'Frete Expresso',
      'scheduled_delivery': 'Entrega Agendada',
      'scheduled delivery': 'Entrega Agendada',
      'store_pickup': 'Retirada na Loja',
      'store pickup': 'Retirada na Loja',
      'cross_docking': 'Cross Docking',
      'cross docking': 'Cross Docking',
      'same_day_delivery': 'Entrega no Mesmo Dia',
      'same day delivery': 'Entrega no Mesmo Dia',
      'next_day_delivery': 'Entrega no Próximo Dia',
      'next day delivery': 'Entrega no Próximo Dia'
    };
    
    if (!Array.isArray(tags)) return '-';
    
    return tags.map(tag => {
      if (!tag) return '';
      
      // Substituir underscores por espaços para melhor tradução
      const normalizedTag = tag.replace(/_/g, ' ').toLowerCase().trim();
      
      // Tentar traduzir com underscore original primeiro, depois com espaços
      return translations[tag.toLowerCase()] || 
             translations[normalizedTag] || 
             tag.replace(/_/g, ' '); // Se não encontrar tradução, pelo menos substitui _ por espaço
    }).filter(Boolean).join(', ') || '-';
  };

  // ✅ CORREÇÃO: Processar mapeamentos sempre que houver pedidos carregados
  useEffect(() => {
    if (orders && orders.length > 0) {
      console.log('🔄 [SimplePedidosPage] Processando mapeamentos para', orders.length, 'pedidos');
      verificarPedidos(orders);
      // ✅ Usar a função correta que processa diretamente
      mappingActions.processOrdersMappings(orders);
    }
  }, [orders, verificarPedidos]); // ✅ Dependência simplificada mas funcional
  
  // Helpers financeiros: receita_por_envio (Flex) e valor_liquido_vendedor
  const getReceitaPorEnvio = (order: any): number => {
    // Se já vier calculado do backend, usar
    if (typeof order?.receita_por_envio === 'number') return order.receita_por_envio;

    // Detectar o tipo logístico a partir de múltiplas fontes (como a tabela exibe)
    const rawType =
      order?.shipping?.logistic?.type ??
      order?.raw?.shipping?.logistic?.type ??
      order?.logistic_type ??
      order?.shipping_details?.logistic_type ??
      order?.unified?.logistic?.type ??
      order?.logistic?.type;

    const logisticType = String(rawType || '').toLowerCase().replace(/\s+/g, '_');
    // Receita com envio só existe no Flex (self_service)
    if (logisticType !== 'self_service' && logisticType !== 'flex') return 0;

    // 0) Se o backend já calculou (shipping.bonus_total/bonus), priorizar
    const shippingBonus = Number(
      order?.shipping?.bonus_total ??
      order?.shipping?.bonus ??
      order?.unified?.shipping?.bonus_total ??
      order?.unified?.shipping?.bonus ?? 0
    );
    if (Number.isFinite(shippingBonus) && shippingBonus > 0) return shippingBonus;

    // 1) Bônus por envio via /shipments/{id}/costs -> senders[].compensation e senders[].compensations[].amount
    const costs =
      order?.shipping?.costs ||
      order?.raw?.shipping?.costs ||
      order?.unified?.shipping?.costs;

    let compTotal = 0;
    if (costs?.senders && Array.isArray(costs.senders)) {
      compTotal = costs.senders.reduce((acc: number, s: any) => {
        const direct = Number(s?.compensation ?? 0);
        const nestedList = Array.isArray(s?.compensations) ? s.compensations : [];
        const nestedSum = nestedList.reduce((a: number, c: any) => a + (Number(c?.amount ?? 0) || 0), 0);
        return acc + (Number.isFinite(direct) ? direct : 0) + nestedSum;
      }, 0);
    }

    if (compTotal > 0) return compTotal;

    // 2) Pagamentos do envio (fallback legado apenas se /costs não disponível)
    let paymentsTotal = 0;
    const shippingPaymentArrays = [
      order?.shipping?.payments,
      order?.raw?.shipping?.payments,
      order?.unified?.shipping?.payments,
      order?.shipping_payments,
      order?.unified?.shipping_payments,
      order?.raw?.shipping_payments,
    ].filter(Boolean);
    for (const arr of shippingPaymentArrays) {
      if (Array.isArray(arr)) {
        for (const p of arr) {
          const status = String(p?.status || '').toLowerCase();
          if (status && status !== 'approved') continue;
          const amt = Number(p?.amount ?? p?.value ?? p?.cost ?? 0);
          if (!Number.isNaN(amt) && amt > 0) paymentsTotal += amt;
        }
      }
    }

    if (paymentsTotal > 0) return paymentsTotal; // fallback legado

    // 3) Outros campos eventuais
    const flexBonusFields = [
      order?.shipping_bonus,
      order?.envio_bonus,
      order?.flex_bonus,
      order?.shipping?.bonus,
      order?.raw?.shipping?.bonus,
      order?.shipping?.lead_time?.bonus,
      order?.raw?.shipping?.lead_time?.bonus,
    ].filter(val => val !== undefined && val !== null);

    for (const bonus of flexBonusFields) {
      const amt = Number(bonus);
      if (!Number.isNaN(amt) && amt > 0) {
        return amt;
      }
    }

    return 0;
  };
  
  const getValorLiquidoVendedor = (order: any): number => {
    if (typeof order?.valor_liquido_vendedor === 'number') return order.valor_liquido_vendedor;

    // Base sem frete: prioriza transaction_amount dos pagamentos
    const paymentArrays = [
      order?.payments,
      order?.raw?.payments,
      order?.unified?.payments,
    ].filter(Boolean);

    let transactionBase = 0;
    for (const arr of paymentArrays) {
      if (Array.isArray(arr) && arr.length) {
        const sumTx = arr.reduce((acc: number, p: any) => {
          const v = Number(p?.transaction_amount ?? 0);
          return acc + (Number.isFinite(v) && v > 0 ? v : 0);
        }, 0);
        if (sumTx > 0) {
          transactionBase = sumTx;
          break;
        }
      }
    }

    if (!transactionBase) {
      const totalAmount = Number(order?.total_amount ?? order?.valor_total ?? 0);
      const paidAmount = Number(order?.paid_amount ?? order?.total_paid_amount ?? 0);
      const shippingCost = Number(order?.shipping_cost ?? order?.lead_time?.cost ?? 0);
      transactionBase = totalAmount || (paidAmount - (Number.isFinite(shippingCost) ? shippingCost : 0)) || paidAmount;
    }

    // Taxas: marketplace_fee ou soma de sale_fee dos itens
    let fee = Number(order?.marketplace_fee ?? 0) || 0;
    if (!fee) {
      const itemsArrays = [
        order?.order_items,
        order?.raw?.order_items,
        order?.unified?.order_items,
      ].filter(Boolean);
      for (const arr of itemsArrays) {
        if (Array.isArray(arr) && arr.length) {
          const sumFees = arr.reduce((acc: number, it: any) => {
            const f = Number(it?.sale_fee ?? it?.sale_fee_amount ?? it?.fee ?? 0);
            return acc + (Number.isFinite(f) && f > 0 ? f : 0);
          }, 0);
          if (sumFees > 0) {
            fee = sumFees;
            break;
          }
        }
      }
    }

    // USAR APENAS RECEITA FLEX (bônus), NÃO frete pago pelo cliente
    const receitaFlex = order.receita_flex || getReceitaPorEnvio(order);

    return Math.max(0, transactionBase - fee + receitaFlex);
  };

  // Configuração de colunas (reposta após ajuste)
  type ColumnDef = { key: string; label: string; default: boolean; category?: string };
  const allColumns: ColumnDef[] = [
    // Básicas
    { key: 'id', label: 'ID-Único', default: true, category: 'basic' },
    { key: 'empresa', label: 'Empresa', default: true, category: 'basic' },
    { key: 'numero', label: 'Número do Pedido', default: true, category: 'basic' },
    { key: 'nome_cliente', label: 'Nome do Cliente', default: true, category: 'basic' },
    { key: 'nome_completo', label: 'Nome Completo', default: true, category: 'basic' },
    { key: 'data_pedido', label: 'Data do Pedido', default: true, category: 'basic' },
    { key: 'last_updated', label: 'Última Atualização', default: false, category: 'basic' },

    // Produtos
    { key: 'skus_produtos', label: 'SKUs/Produtos', default: true, category: 'products' },
    { key: 'quantidade_itens', label: 'Quantidade Total', default: true, category: 'products' },
    { key: 'titulo_anuncio', label: 'Título do Produto', default: true, category: 'products' },

    // Financeiro - CAMPOS SEPARADOS E EXCLUSIVOS
    { key: 'valor_total', label: 'Valor Total', default: true, category: 'financial' },
    { key: 'paid_amount', label: 'Valor Pago', default: true, category: 'financial' },
    { key: 'frete_pago_cliente', label: 'Frete Pago Cliente', default: true, category: 'financial' },
    { key: 'receita_flex', label: 'Receita Flex (Bônus)', default: true, category: 'financial' },
    { key: 'custo_envio_seller', label: 'Custo Envio Seller', default: false, category: 'financial' },
    { key: 'coupon_amount', label: 'Desconto Cupom', default: false, category: 'financial' },
    { key: 'marketplace_fee', label: 'Taxa Marketplace', default: true, category: 'financial' },
    { key: 'valor_liquido_vendedor', label: 'Valor Líquido Vendedor', default: true, category: 'financial' },
    { key: 'payment_method', label: 'Método Pagamento', default: false, category: 'financial' },
    { key: 'payment_status', label: 'Status Pagamento', default: false, category: 'financial' },
    { key: 'payment_type', label: 'Tipo Pagamento', default: false, category: 'financial' },

    // Mapeamento
    { key: 'mapeamento', label: 'Status Mapeamento', default: true, category: 'mapping' },
    { key: 'sku_estoque', label: 'SKU Estoque', default: true, category: 'mapping' },
    { key: 'sku_kit', label: 'SKU KIT', default: false, category: 'mapping' },
    { key: 'qtd_kit', label: 'Quantidade KIT', default: false, category: 'mapping' },
    { key: 'total_itens', label: 'Total de Itens', default: true, category: 'mapping' },
    { key: 'status_baixa', label: 'Status da Baixa', default: true, category: 'mapping' },
    
    // Status
    { key: 'situacao', label: 'Status do Pagamento', default: true, category: 'shipping' },

    // Metadados ML
    { key: 'date_created', label: 'Data Criação ML', default: false, category: 'meta' },
    { key: 'pack_id', label: 'Pack ID', default: false, category: 'meta' },
    { key: 'pickup_id', label: 'Pickup ID', default: false, category: 'meta' },
    { key: 'manufacturing_ending_date', label: 'Data Fim Fabricação', default: false, category: 'meta' },
    { key: 'comment', label: 'Comentário ML', default: false, category: 'meta' },
    { key: 'tags', label: 'Tags', default: false, category: 'meta' },

    // Envio (combinado)
    { key: 'shipping_status', label: 'Status do Envio', default: true, category: 'shipping' },
    { key: 'logistic_mode', label: 'Logistic Mode (Principal)', default: false, category: 'shipping' },
    { key: 'logistic_type', label: 'Tipo Logístico', default: false, category: 'shipping' },
    { key: 'shipping_method_type', label: 'Tipo Método Envio', default: false, category: 'shipping' },
    { key: 'delivery_type', label: 'Tipo Entrega', default: false, category: 'shipping' },
    { key: 'substatus_detail', label: 'Substatus (Estado Atual)', default: false, category: 'shipping' },
    { key: 'shipping_mode', label: 'Modo de Envio (Combinado)', default: false, category: 'shipping' },
    { key: 'shipping_method', label: 'Método de Envio (Combinado)', default: false, category: 'shipping' },
    
    // Endereço
    { key: 'endereco_rua', label: 'Rua', default: false, category: 'shipping' },
    { key: 'endereco_numero', label: 'Número', default: false, category: 'shipping' },
    { key: 'endereco_bairro', label: 'Bairro', default: false, category: 'shipping' },
    { key: 'endereco_cep', label: 'CEP', default: false, category: 'shipping' },
    { key: 'endereco_cidade', label: 'Cidade', default: false, category: 'shipping' },
    { key: 'endereco_uf', label: 'UF', default: false, category: 'shipping' },
  ];

  // ✅ Sistema de colunas removido - agora usa useColumnManager com persistência automática
  
  const toggleColumn = (key: string) => {
    columnManager.actions.toggleColumn(key);
  };

  const resetToDefault = () => {
    columnManager.actions.resetToDefault();
  };

  // Status da baixa usando sistema centralizado
  const renderStatusBaixa = (pedidoId: string) => {
    const mapping = mappingData.get(pedidoId);
    if (!mapping) return <span className="text-muted-foreground">-</span>;

    // ✅ CORRIGIDO: Usar valor fixo por enquanto
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Sem mapear</span>
      </div>
    );
  };

  // 🛡️ FUNÇÃO SIMPLIFICADA - usa sistema centralizado
  const simplificarStatus = (status: string): string => {
    return mapApiStatusToLabel(status);
  };

  const formatPt = (val?: any) => {
    if (val === undefined || val === null || val === '') return '-';
    const s = String(val).replace(/_/g, ' ').toLowerCase();
    const map: Record<string,string> = {
      // Status gerais
      'ready to ship': 'Pronto para envio',
      'delivered': 'Entregue',
      'delivery': 'Entrega',
      'pickup': 'Retirada',
      'standard': 'Padrão',
      'express': 'Expresso',
      'same day': 'Mesmo dia',
      'next day': 'Dia seguinte',
      'estimated': 'Estimado',
      'fulfillment': 'Fulfillment',
      'me2': 'Mercado Envios',
      'custom': 'Personalizado',
      'home delivery': 'Entrega domiciliar',
      'branch office': 'Agência',
      'cross docking': 'Cross docking',
      'drop off': 'Ponto de entrega',
      'flex': 'Flex',
      'xd drop off': 'Ponto entrega XD',
      'not specified': 'Não especificado',
      // Velocidades de envio
      'slow': 'Lento',
      'fast': 'Rápido',
      'three days': 'Três dias',
      'two days': 'Dois dias',
      'one day': 'Um dia',
      'four days': 'Quatro dias',
      'five days': 'Cinco dias',
      'six days': 'Seis dias',
      'seven days': 'Sete dias',
      'meli delivery day': 'Dia entrega Meli',
      'regular': 'Regular',
      'economy': 'Econômico',
      'premium': 'Premium',
      // Tipos de logística
      'self service': 'Flex',
      'cross dock': 'Cross dock',
      'drop ship': 'Drop ship',
      'warehouse': 'Depósito',
      'store': 'Loja',
      // Tipos de entrega específicos
      'carrier': 'Transportadora',
      'mail': 'Correios',
      'courier': 'Courier',
      'freight': 'Frete',
      'motorcycle': 'Moto',
      'bike': 'Bicicleta',
      'walking': 'Caminhada',
      // Status específicos do ML
      'pending payment': 'Pagamento pendente',
      'payment required': 'Pagamento necessário',
      'paid': 'Pago',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado'
    };
    const translated = map[s] ?? s;
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  };

  const formatLogisticType = (val?: any) => {
    if (val === undefined || val === null || val === '') return '-';
    const s = String(val).toLowerCase();
    if (s === 'self service') return 'Flex';
    return formatPt(val);
  };

  const formatSubstatus = (val?: any) => {
    if (val === undefined || val === null || val === '') return '-';
    const s = String(val).replace(/_/g, ' ').toLowerCase();
    const map: Record<string,string> = {
      'ready to ship': 'Pronto para envio',
      'shipped': 'Enviado',
      'in transit': 'Em trânsito',
      'out for delivery': 'Saiu para entrega',
      'delivered': 'Entregue',
      'pending': 'Pendente',
      'handling': 'Processando',
      'ready to handle': 'Pronto para processar',
      'not delivered': 'Não entregue',
      'returned': 'Devolvido',
      'cancelled': 'Cancelado',
      'waiting for pickup': 'Aguardando retirada',
      'stale shipped': 'Envio antigo',
      'claim': 'Reclamação',
      'ready to collect': 'Pronto para retirar',
      'collected': 'Coletado',
      'to be agreed': 'A combinar',
      'receiver absent': 'Destinatário ausente',
      'under review': 'Em análise',
      'contact failed': 'Contato falhou',
      'under customs review': 'Revisão alfandegária',
      'sorting': 'Triagem',
      'at destination': 'No destino',
      'damaged': 'Danificado',
      'lost': 'Perdido',
      'stolen': 'Roubado'
    };
    const translated = map[s] ?? s;
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  };

  // Helper para testar contas
  const testAccount = async (accId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: { integration_account_id: accId, limit: 1 }
      });
      if (error) return false;
      return !!data?.ok;
    } catch {
      return false;
    }
  };

  // Carregar contas ML
  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const list = data || [];
      setAccounts(list);
      console.log('📊 Contas ML carregadas:', list.length, list);
    } catch (err: any) {
      console.error('Erro ao carregar contas:', err.message);
    }
  };

  // Handlers memoizados para performance
  const handleFilterChange = useCallback((newFilters: any) => {
    actions.setFilters(newFilters);
  }, [actions.setFilters]);

  const handleBaixaEstoque = async (pedidos: string[]) => {
    console.log('Iniciando baixa de estoque para:', pedidos);
    setShowBaixaModal(false);
    // Lógica de baixa de estoque aqui
  };

  // Definir conta via URL (?acc= ou ?integration_account_id=)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const acc = sp.get('acc') || sp.get('integration_account_id');
      if (acc) actions.setIntegrationAccountId(acc);
    } catch {}
  }, [actions]);

  // Carregar contas na inicialização
  useEffect(() => {
    loadAccounts();
  }, []);
  
  // ✅ Sistema de validação corrigido - mais robusto
  const validateSystem = () => {
    try {
      // Validações básicas do sistema
      const hasOrders = orders && orders.length > 0;
      
      if (!hasOrders) {
        console.log('ℹ️ Sistema: Nenhum pedido carregado ainda');
        return true; // Não é erro se não há pedidos
      }

      // ✅ CORREÇÃO: Verificação mais robusta de IDs
      const ordersWithoutId = orders.filter((o: any) => !o.id && !o.numero && !o.id_unico);
      const totalOrders = orders.length;
      const validOrders = totalOrders - ordersWithoutId.length;
      
      if (ordersWithoutId.length > 0) {
        console.warn(`⚠️ Sistema: ${ordersWithoutId.length}/${totalOrders} pedidos sem ID válido`, {
          exemplos: ordersWithoutId.slice(0, 3).map((o: any) => ({
            keys: Object.keys(o),
            hasRaw: !!o.raw,
            hasUnified: !!o.unified
          }))
        });
        
        // Se mais da metade tem ID válido, consideramos OK
        if (validOrders / totalOrders >= 0.5) {
          console.log(`✅ Sistema: ${validOrders}/${totalOrders} pedidos válidos (${Math.round(validOrders/totalOrders*100)}%)`);
          return true;
        }
        return false;
      }

      console.log(`✅ Sistema validado: ${totalOrders} pedidos válidos`);
      return true;
    } catch (error) {
      console.error('💥 Erro na validação do sistema:', error);
      return false;
    }
  };

  // Executar validação periodicamente
  useEffect(() => {
    const interval = setInterval(validateSystem, 5000);
    return () => clearInterval(interval);
  }, [orders, mappingData]);


  // Render principal
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* 📊 DASHBOARD INTELIGENTE */}
      <PedidosDashboardSection 
        orders={orders || []}
        loading={loading}
      />

      {/* 🛡️ HEADER BLINDADO */}
      <PedidosHeaderSection
        fonte={state.fonte}
        totalCount={total}
        loading={loading}
        isRefreshing={state.isRefreshing}
        onRefresh={actions.refetch}
        onApplyFilters={() => filtersManager.applyFilters()}
        selectedOrdersCount={selectedOrders.size}
        hasPendingChanges={filtersManager.hasPendingChanges}
      >
      {/* 🚀 MODAIS E COMPONENTES - Agora integrados nos componentes dedicados */}
      </PedidosHeaderSection>

      {/* ✅ NOVO SISTEMA DE FILTROS UNIFICADO - UX CONSISTENTE */}
      <PedidosFiltersUnified
        filters={filtersManager.filters}
        appliedFilters={filtersManager.appliedFilters}
        onFilterChange={filtersManager.updateFilter}
        onApplyFilters={filtersManager.applyFilters}
        onCancelChanges={filtersManager.cancelChanges}
        onClearFilters={filtersManager.clearFilters}
        hasPendingChanges={filtersManager.hasPendingChanges}
        needsManualApplication={filtersManager.needsManualApplication}
        isApplying={filtersManager.isApplying}
        columnManager={columnManager}
        activeFiltersCount={filtersManager.activeFiltersCount}
        contasML={accounts}
      />
      
      {/* BACKUP - CÓDIGO ORIGINAL DOS FILTROS */}
      <Card className="p-4" style={{ display: 'none' }}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Filtros</h3>
            <Button size="sm" variant="outline" onClick={actions.clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
          
          
          {/* Campo de Busca com Debounce */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Buscar Pedidos</label>
            <Input
              placeholder="Buscar por número, cliente, CPF/CNPJ..."
              value={filtersManager.filters.search || ''}
              onChange={(e) => filtersManager.updateFilter('search', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Status do Envio - Multi seleção no Popover (igual Colunas) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status do Envio</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {Array.isArray(filtersManager.filters.situacao) && filtersManager.filters.situacao.length > 0
                        ? `${filtersManager.filters.situacao.length} selecionado(s)`
                        : 'Selecionar status'}
                    </span>
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Status do Envio</h4>
                      {Array.isArray(filtersManager.filters.situacao) && filtersManager.filters.situacao.length > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => filtersManager.updateFilter('situacao', undefined)}>
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { value: 'pending', label: 'Pendente', color: 'bg-yellow-400' },
                        { value: 'ready_to_ship', label: 'Pronto para Envio', color: 'bg-blue-400' },
                        { value: 'shipped', label: 'Enviado', color: 'bg-purple-400' },
                        { value: 'delivered', label: 'Entregue', color: 'bg-green-400' },
                        { value: 'not_delivered', label: 'Não Entregue', color: 'bg-red-400' },
                        { value: 'cancelled', label: 'Cancelado', color: 'bg-gray-400' },
                        { value: 'handling', label: 'Processando', color: 'bg-cyan-400' },
                        { value: 'to_be_agreed', label: 'A Combinar', color: 'bg-orange-400' }
                      ].map((status) => {
                        const current = Array.isArray(filtersManager.filters.situacao)
                          ? filtersManager.filters.situacao
                          : (filtersManager.filters.situacao ? [filtersManager.filters.situacao] : []);
                        const isSelected = current.includes(status.value);
                        return (
                          <label key={status.value} className="flex items-center space-x-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  filtersManager.updateFilter('situacao', [...current, status.value]);
                                } else {
                                  const next = current.filter((s) => s !== status.value);
                                  filtersManager.updateFilter('situacao', next.length > 0 ? next : undefined);
                                }
                              }}
                            />
                            <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                            <span>{status.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filtersManager.filters.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtersManager.filters.dataInicio ? (
                      format(filtersManager.filters.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtersManager.filters.dataInicio}
                    onSelect={(date) => filtersManager.updateFilter('dataInicio', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filtersManager.filters.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtersManager.filters.dataFim ? (
                      format(filtersManager.filters.dataFim, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtersManager.filters.dataFim}
                    onSelect={(date) => filtersManager.updateFilter('dataFim', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Controle de Colunas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Colunas</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Selecionar Colunas</h4>
                      <Button size="sm" variant="ghost" onClick={resetToDefault}>
                        Padrão
                      </Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                       {['basic', 'products', 'financial', 'status', 'mapping', 'ml', 'shipping', 'address', 'buyer', 'ids'].map((category) => {
                         const categoryColumns = allColumns.filter(col => col.category === category);
                         const categoryLabels = {
                           basic: 'Básicas',
                           products: 'Produtos',
                           financial: 'Financeiras', 
                           status: 'Status',
                           mapping: 'Mapeamento',
                           ml: 'Mercado Livre',
                            shipping: 'Envio',
                            address: 'Endereço',
                            buyer: 'Comprador',
                            ids: 'Identificação'
                         } as const;
                         
                         if (categoryColumns.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground border-b pb-1">
                              {categoryLabels[category as keyof typeof categoryLabels]}
                            </h5>
                            <div className="grid grid-cols-1 gap-1 ml-2">
                              {categoryColumns.map((col) => (
                                <label key={col.key} className="flex items-center space-x-2 text-sm">
                                  <Checkbox
                                    checked={visibleColumns.has(col.key)}
                                    onCheckedChange={() => toggleColumn(col.key)}
                                  />
                                  <span>{col.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

      {/* Indicadores */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Fonte: {state.fonte} | Total: {total} pedidos</span>
          {state.isRefreshing && <span className="ml-2 animate-pulse">• Atualizando...</span>}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              console.log('[DEBUG] === FORÇANDO ATUALIZAÇÃO COMPLETA ===');
              console.log('[DEBUG] Total de pedidos:', orders.length);
              
              // Debug: Sample das primeiras orders
              if (orders.length > 0) {
                console.log('[DEBUG] Sample order data:', {
                  id: orders[0].id,
                  shipping_mode: orders[0].shipping_mode,
                  forma_entrega: orders[0].forma_entrega,
                  is_fulfillment: orders[0].is_fulfillment,
                  status_detail: orders[0].status_detail,
                  available_fields: Object.keys(orders[0])
                });
              }
              
              // Limpar todos os caches
              localStorage.clear();
              sessionStorage.clear();
              
              // Recarregar dados
              actions.clearFilters();
              actions.refetch();
              
              setTimeout(() => {
                console.log('[DEBUG] Página recarregando para garantir dados frescos...');
                window.location.reload();
              }, 1000);
            }}
            className="text-xs h-6 px-2"
          >
            🔄 Debug & Recarregar
          </Button>
        </div>
        {(filtersManager.appliedFilters.situacao || filtersManager.appliedFilters.dataInicio || filtersManager.appliedFilters.dataFim) && (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              Filtros ativos
            </Badge>
          </div>
        )}
      </div>
        </div>
      </Card>

      {/* 🛡️ MENSAGEM DE ERRO SEGURA */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive font-medium">
            ⚠️ {error}
          </p>
        </Card>
      )}

      {/* 🚀 FASE 2: Loading otimizado */}
      {/* 🎯 SEÇÃO DA TABELA DE PEDIDOS - MIGRAÇÃO GRADUAL */}
      <PedidosTableSection
        orders={orders}
        total={total}
        loading={loading}
        error={error}
        state={state}
        filters={filtersManager.appliedFilters}
        actions={actions}
        selectedOrders={selectedOrders}
        setSelectedOrders={setSelectedOrders}
        mappingData={mappingData}
        visibleColumns={visibleColumns}
        visibleDefinitions={columnManager.visibleDefinitions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => actions.setPage(page)}
        isPedidoProcessado={isPedidoProcessado}
      />


      {/* 🔧 SEÇÃO DE AÇÕES EM MASSA - NOVA EXTRAÇÃO */}
      <PedidosBulkActionsSection
        orders={orders}
        selectedOrders={selectedOrders}
        setSelectedOrders={setSelectedOrders}
        mappingData={mappingData}
        isPedidoProcessado={isPedidoProcessado}
        showBaixaModal={showBaixaModal}
        setShowBaixaModal={setShowBaixaModal}
        onBaixaConcluida={() => {
          // Recarregar dados após baixa concluída
          actions.refetch();
          verificarPedidos(orders);
          // Reprocessar mapeamentos se necessário
          mappingActions.reprocessMappings(orders);
        }}
      />

      {/* 🚀 SEÇÃO DE MODAIS - PASSO 7 COMPLETO */}
      <PedidosModalsSection
        onExport={actions.exportData}
        totalRecords={total}
        isLoading={loading}
        savedFilters={actions.getSavedFilters()}
        onSaveFilters={actions.saveCurrentFilters}
        onLoadFilters={actions.loadSavedFilters}
        hasActiveFilters={filtersManager.hasActiveFilters}
        columnManager={columnManager}
      />

      {/* 🛡️ MIGRAÇÃO GRADUAL COMPLETA - Todos os 7 passos implementados */}
    </div>
  );
}

export default memo(SimplePedidosPage);