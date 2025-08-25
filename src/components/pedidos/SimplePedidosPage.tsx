/**
 * 🛡️ PÁGINA PEDIDOS REFATORADA - FASES 1, 2 E 3 COMPLETAS
 * Sistema blindado com arquitetura unificada + Performance + UX
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Package, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Clock, Filter, Settings, CheckSquare, CalendarIcon } from 'lucide-react';
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

export default function SimplePedidosPage({ className }: Props) {
  // 🛡️ SISTEMA UNIFICADO
  const pedidosManager = usePedidosManager();
  const { filters, state, actions } = pedidosManager;
  
  // Estados locais para funcionalidades específicas
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [mappingData, setMappingData] = useState<Map<string, any>>(new Map());
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  
  // Aliases para compatibilidade
  const orders = state.orders;
  const total = state.total;
  const loading = state.loading;
  const error = state.error;
  const currentPage = state.currentPage;
  const integrationAccountId = state.integrationAccountId;

  // Funções de tradução e mapeamento de status
  const getShippingStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ready_to_ship': 'bg-blue-100 text-blue-800 border-blue-200',
      'shipped': 'bg-purple-100 text-purple-800 border-purple-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'not_delivered': 'bg-red-100 text-red-800 border-red-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
      'to_be_agreed': 'bg-orange-100 text-orange-800 border-orange-200',
      'handling': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'ready_to_print': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'printed': 'bg-slate-100 text-slate-800 border-slate-200',
      'stale': 'bg-amber-100 text-amber-800 border-amber-200',
      'delayed': 'bg-amber-100 text-amber-800 border-amber-200',
      'lost': 'bg-red-100 text-red-800 border-red-200',
      'damaged': 'bg-red-100 text-red-800 border-red-200',
      'measures_not_correspond': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const translateShippingStatus = (status: string): string => {
    const translations: Record<string, string> = {
      'pending': 'Pendente',
      'ready_to_ship': 'Pronto para Envio',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'not_delivered': 'Não Entregue',
      'cancelled': 'Cancelado',
      'to_be_agreed': 'A Combinar',
      'handling': 'Processando',
      'ready_to_print': 'Pronto para Imprimir',
      'printed': 'Impresso',
      'stale': 'Atrasado',
      'delayed': 'Atrasado',
      'lost': 'Perdido',
      'damaged': 'Danificado',
      'measures_not_correspond': 'Medidas Não Correspondem'
    };
    return translations[status?.toLowerCase()] || status || '-';
  };

  const translateShippingSubstatus = (substatus: string): string => {
    if (!substatus) return '-';
    
    // Debug log para verificar valores reais
    console.log('[SUBSTATUS DEBUG] Raw value:', substatus, 'Type:', typeof substatus);
    
    const translations: Record<string, string> = {
      // Status comuns do ML
      'ready_to_print': 'Pronto para Imprimir',
      'printed': 'Impresso',
      'stale': 'Atrasado',
      'delayed': 'Atrasado',
      'receiver_absent': 'Destinatário Ausente',
      'returning_to_sender': 'Retornando ao Remetente',
      'out_for_delivery': 'Saiu para Entrega',
      'in_hub': 'No Centro de Distribuição',
      'in_transit': 'Em Trânsito',
      'arrived_at_unit': 'Chegou na Unidade',
      'contact_customer': 'Contatar Cliente',
      'need_review': 'Precisa Revisão',
      'forwarded': 'Encaminhado',
      'preparing': 'Preparando',
      'ready_to_ship': 'Pronto para Envio',
      'waiting_for_withdrawal': 'Aguardando Retirada',
      'withdrawal_in_progress': 'Retirada em Andamento',
      'delivered_to_agent': 'Entregue ao Agente',
      'exception': 'Exceção',
      'failed_delivery': 'Falha na Entrega',
      'customs_pending': 'Pendente na Alfândega',
      'customs_released': 'Liberado pela Alfândega',
      
      // ADICIONANDO VALORES ESPECÍFICOS QUE ESTÃO APARECENDO
      'in_warehouse': 'No Armazém',
      'in warehouse': 'No Armazém',
      'at_warehouse': 'No Armazém',
      'at warehouse': 'No Armazém',
      'warehouse': 'Armazém',
      
      // Adicionando mais status específicos do ML
      'handling': 'Em Processamento',
      'ready_to_pickup': 'Pronto para Retirada',
      'claim_pending': 'Reclamação Pendente',
      'claimed': 'Reclamado',
      'measures_not_correspond': 'Medidas Não Correspondem',
      'damaged': 'Danificado',
      'lost': 'Perdido',
      'canceled': 'Cancelado',
      'not_delivered': 'Não Entregue',
      'delivered': 'Entregue',
      'to_be_agreed': 'A Combinar',
      'pending': 'Pendente',
      'shipped': 'Enviado',
      
      // Variações com espaços
      'ready to print': 'Pronto para Imprimir',
      'ready to ship': 'Pronto para Envio',
      'out for delivery': 'Saiu para Entrega',
      'in transit': 'Em Trânsito',
      'not delivered': 'Não Entregue',
      'to be agreed': 'A Combinar',
      'contact customer': 'Contatar Cliente',
      'need review': 'Precisa Revisão',
      'ready to pickup': 'Pronto para Retirada',
      'waiting for withdrawal': 'Aguardando Retirada',
      'withdrawal in progress': 'Retirada em Andamento',
      'delivered to agent': 'Entregue ao Agente',
      'failed delivery': 'Falha na Entrega',
      'customs pending': 'Pendente na Alfândega',
      'customs released': 'Liberado pela Alfândega',
      'claim pending': 'Reclamação Pendente',
      'measures not correspond': 'Medidas Não Correspondem'
    };
    
    // Normalize: lowercase, trim, and handle different formats
    const originalKey = substatus.toLowerCase().trim();
    const withSpacesKey = originalKey.replace(/_/g, ' ');
    const withUnderscoresKey = originalKey.replace(/\s+/g, '_');
    
    console.log('[SUBSTATUS DEBUG] Trying keys:', {
      original: originalKey,
      withSpaces: withSpacesKey,
      withUnderscores: withUnderscoresKey
    });
    
    // Tentar diferentes variações
    if (translations[originalKey]) {
      console.log('[SUBSTATUS DEBUG] Found translation (original):', translations[originalKey]);
      return translations[originalKey];
    }
    
    if (translations[withSpacesKey]) {
      console.log('[SUBSTATUS DEBUG] Found translation (spaces):', translations[withSpacesKey]);
      return translations[withSpacesKey];
    }
    
    if (translations[withUnderscoresKey]) {
      console.log('[SUBSTATUS DEBUG] Found translation (underscores):', translations[withUnderscoresKey]);
      return translations[withUnderscoresKey];
    }
    
    console.log('[SUBSTATUS DEBUG] No translation found, using fallback for:', substatus);
    // Se não encontrar, substitui _ por espaços e capitaliza
    return substatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const translateShippingMode = (mode: string): string => {
    if (!mode) return '-';
    
    const translations: Record<string, string> = {
      // Mercado Envios
      'me1': 'Mercado Envios 1',
      'me2': 'Mercado Envios 2', 
      'flex': 'Mercado Envios Flex',
      'self_service': 'Mercado Envios Flex',
      'cross_docking': 'Cross Docking',
      'xd_drop_off': 'Cross Docking',
      'xd_pick_up': 'Cross Docking',
      
      // Outros modos
      'standard': 'Padrão',
      'express': 'Expresso',
      'scheduled': 'Agendado',
      'pickup': 'Retirada',
      'drop_off': 'Ponto de Despacho',
      
      // SLA / Service hints
      'same_day': 'Mesmo Dia',
      'next_day': 'Próximo Dia',
      'custom': 'Personalizado',
      'normal': 'Normal',
      'free': 'Grátis',
      'paid': 'Pago',
      'store_pickup': 'Retirada na Loja',
      'fulfillment': 'Fulfillment',
      'fbm': 'Enviado pelo Vendedor'
    };
    
    const normalizedKey = mode.toLowerCase();
    
    // Primeiro tenta traduzir diretamente
    if (translations[normalizedKey]) {
      return translations[normalizedKey];
    }
    
    // Se não encontrar, substitui _ por espaços e capitaliza
    return mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const translateShippingMethod = (method: any): string => {
    if (!method) return '-';
    
    // Se for string, traduzir diretamente
    if (typeof method === 'string') {
      return translateShippingMode(method);
    }
    
    // Se for objeto com name, usar o name
    if (method.name) {
      const methodTranslations: Record<string, string> = {
        'Prioritario': 'Prioritário',
        'Standard': 'Padrão',
        'Express': 'Expresso',
        'Next Day': 'Próximo Dia',
        'Same Day': 'Mesmo Dia'
      };
      
      return methodTranslations[method.name] || method.name;
    }
    
    return '-';
  };

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

  // Função para gerar ID-Único (SKUs/Produtos + Número do Pedido)
  const generateUniqueId = (order: any): string => {
    const numeropedido = order.numero || order.id || '';
    
    // Extrair SKUs dos itens do pedido
    let skus: string[] = [];
    
    if (order.order_items && Array.isArray(order.order_items)) {
      skus = order.order_items.map((item: any) => 
        item.sku || item.seller_sku || item.item?.seller_sku || item.item?.id
      ).filter(Boolean);
    } else if (order.skus && Array.isArray(order.skus)) {
      skus = order.skus;
    } else if (order.sku) {
      skus = [order.sku];
    }
    
    // Montar ID único
    const skusPart = skus.length > 0 ? skus.join('+') : 'NO-SKU';
    return `${skusPart}-${numeropedido}`;
  };
  
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

    // NOVA ABORDAGEM: Buscar em múltiplas localizações de pagamentos de envio
    const shippingPaymentArrays = [
      // Direto do shipping
      order?.shipping?.payments,
      order?.raw?.shipping?.payments,
      order?.unified?.shipping?.payments,
      // Como propriedade direta
      order?.shipping_payments,
      order?.unified?.shipping_payments,
      order?.raw?.shipping_payments,
      // Dentro de lead_time ou outros objetos
      order?.shipping?.lead_time?.payments,
      order?.raw?.shipping?.lead_time?.payments,
      // Estruturas aninhadas do ML
      order?.shipping?.logistic?.payments,
      order?.raw?.shipping?.logistic?.payments,
    ].filter(Boolean);

    let totalAmount = 0;
    for (const arr of shippingPaymentArrays) {
      if (Array.isArray(arr)) {
        for (const p of arr) {
          const amt = Number(p?.amount ?? p?.value ?? p?.cost ?? 0);
          if (!Number.isNaN(amt) && amt > 0) {
            console.log(`[RECEITA ENVIO] Encontrado: ${amt} em`, p);
            totalAmount += amt;
          }
        }
      }
    }

    // Se não encontrar nos payments, tentar em outras estruturas financeiras do Flex
    if (!totalAmount) {
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
          console.log(`[RECEITA ENVIO] Encontrado bonus: ${amt}`);
          totalAmount += amt;
        }
      }
    }

    return totalAmount || 0;
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

    // Receita com envio (Flex) a partir de shipments payments (evita dupla contagem)
    const receita = getReceitaPorEnvio(order);

    return Math.max(0, transactionBase - fee + receita);
  };

  // Configuração de colunas (reposta após ajuste)
  type ColumnDef = { key: string; label: string; default: boolean; category?: string };
  const allColumns: ColumnDef[] = [
    // Básicas
    { key: 'id', label: 'ID-Único', default: true, category: 'basic' },
    { key: 'empresa', label: 'Empresa', default: true, category: 'basic' },
    { key: 'numero', label: 'Número do Pedido', default: true, category: 'basic' },
    { key: 'nome_cliente', label: 'Nome do Cliente', default: true, category: 'basic' },
    { key: 'data_pedido', label: 'Data do Pedido', default: true, category: 'basic' },
    { key: 'last_updated', label: 'Última Atualização', default: false, category: 'basic' },

    // Produtos
    { key: 'skus_produtos', label: 'SKUs/Produtos', default: true, category: 'products' },
    { key: 'quantidade_itens', label: 'Quantidade Total', default: true, category: 'products' },
    { key: 'titulo_anuncio', label: 'Título do Produto', default: true, category: 'products' },

    // Financeiro
    { key: 'valor_total', label: 'Valor Total', default: true, category: 'financial' },
    { key: 'paid_amount', label: 'Valor Pago', default: true, category: 'financial' },
    { key: 'shipping_cost', label: 'Custo do Frete', default: false, category: 'financial' },
    { key: 'coupon_amount', label: 'Desconto Cupom', default: false, category: 'financial' },
    { key: 'receita_por_envio', label: 'Receita com Envio', default: false, category: 'financial' },
    { key: 'valor_liquido_vendedor', label: 'Valor Líquido Vendedor', default: false, category: 'financial' },
    { key: 'payment_method', label: 'Método Pagamento', default: false, category: 'financial' },
    { key: 'payment_status', label: 'Status Pagamento', default: false, category: 'financial' },
    { key: 'payment_type', label: 'Tipo Pagamento', default: false, category: 'financial' },
    { key: 'marketplace_fee', label: 'Taxa Marketplace', default: false, category: 'financial' },

    // Status
    { key: 'situacao', label: 'Situação', default: true, category: 'shipping' },

    // Mapeamento
    { key: 'mapeamento', label: 'Status Mapeamento', default: true, category: 'mapping' },
    { key: 'sku_estoque', label: 'SKU Estoque', default: true, category: 'mapping' },
    { key: 'sku_kit', label: 'SKU KIT', default: false, category: 'mapping' },
    { key: 'qtd_kit', label: 'Quantidade KIT', default: false, category: 'mapping' },
    { key: 'status_baixa', label: 'Status da Baixa', default: true, category: 'mapping' },

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
    { key: 'logistic_type', label: 'Logistic Type', default: false, category: 'shipping' },
    { key: 'shipping_method_type', label: 'Shipping Method Type', default: false, category: 'shipping' },
    { key: 'delivery_type', label: 'Delivery Type', default: false, category: 'shipping' },
    { key: 'substatus_detail', label: 'Substatus (Estado Atual)', default: false, category: 'shipping' },
    { key: 'shipping_mode', label: 'Modo de Envio (Combinado)', default: false, category: 'shipping' },
    { key: 'shipping_method', label: 'Método de Envio (Combinado)', default: false, category: 'shipping' },
  ];

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(allColumns.filter(col => col.default).map(col => col.key))
  );

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const resetToDefault = () => {
    setVisibleColumns(new Set(allColumns.filter(col => col.default).map(col => col.key)));
  };

  // Status da baixa usando sistema centralizado
  const renderStatusBaixa = (pedidoId: string) => {
    const mapping = mappingData.get(pedidoId);
    if (!mapping) return <span className="text-muted-foreground">-</span>;

    const { statusBaixa } = mapping;
    
    switch (statusBaixa) {
      case 'pronto_baixar':
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Pronto p/ baixar</span>
          </div>
        );
      case 'sem_estoque':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Sem estoque</span>
          </div>
        );
      case 'pedido_baixado':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Já baixado</span>
          </div>
        );
      default:
        return <span className="text-muted-foreground">-</span>;
    }
  };

  // 🛡️ FUNÇÃO SIMPLIFICADA - usa sistema centralizado
  const simplificarStatus = (status: string): string => {
    return mapApiStatusToLabel(status);
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

  // Carregar contas
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

      if (list.length > 0) {
        // Selecionar automaticamente todas as contas válidas
        const validAccounts = [];
        for (const acc of list) {
          const ok = await testAccount(acc.id);
          if (ok) {
            validAccounts.push(acc.id);
          }
        }
        
        if (validAccounts.length > 0) {
          setSelectedAccounts(validAccounts);
          // Para compatibilidade, manter a primeira conta no sistema antigo
          actions.setIntegrationAccountId(validAccounts[0]);
        } else if (list.length > 0) {
          // Se nenhuma válida, selecionar a mais recente
          setSelectedAccounts([list[0].id]);
          actions.setIntegrationAccountId(list[0].id);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar contas:', err.message);
    }
  };

  // Processar mapeamentos
  useEffect(() => {
    const processarMapeamentos = async () => {
      if (orders.length === 0) return;
      
      const novosMapping = new Map();
      
      for (const pedido of orders) {
        try {
          // Extrair SKUs dos dados recebidos
          const skusPedido = pedido.skus?.filter(Boolean) || 
                            pedido.order_items?.map((item: any) => item.item?.seller_sku).filter(Boolean) || 
                            [];
          
          if (skusPedido.length > 0) {
            // Buscar mapeamentos
            const { data: mapeamentos } = await supabase
              .from('mapeamentos_depara')
              .select('sku_pedido, sku_correspondente, sku_simples, quantidade')
              .in('sku_pedido', skusPedido)
              .eq('ativo', true);

            // Verificar se já foi baixado no histórico
            const { data: historicoCheck } = await supabase
              .rpc('get_historico_vendas_safe', {
                _search: pedido.id,
                _limit: 1
              });

            const jaProcessado = !!historicoCheck && historicoCheck.length > 0;
            
            let skuEstoque = null;
            let skuKit = null;
            let qtdKit = 0;
            let totalItens = pedido.quantidade_itens || 0;
            let statusBaixa = 'sem_estoque';

            if (mapeamentos && mapeamentos.length > 0) {
              const mapeamento = mapeamentos[0];
              skuEstoque = mapeamento.sku_correspondente || mapeamento.sku_simples;
              skuKit = mapeamento.sku_pedido;
              qtdKit = mapeamento.quantidade || 1;
              
              if (jaProcessado) {
                statusBaixa = 'pedido_baixado';
              } else if (skuEstoque) {
                // Verificar estoque do produto
                const { data: produto } = await supabase
                  .from('produtos')
                  .select('quantidade_atual')
                  .eq('sku_interno', skuEstoque)
                  .eq('ativo', true)
                  .maybeSingle();
                
                if (produto && produto.quantidade_atual >= qtdKit) {
                  statusBaixa = 'pronto_baixar';
                } else {
                  statusBaixa = 'sem_estoque';
                }
              }
            }

            novosMapping.set(pedido.id, {
              skuEstoque,
              skuKit,
              qtdKit,
              totalItens,
              statusBaixa,
              jaProcessado
            });
          }
        } catch (error) {
          console.error('Erro ao processar mapeamento para pedido:', pedido.id, error);
        }
      }
      
      setMappingData(novosMapping);
    };

    processarMapeamentos();
  }, [orders]);

  // Handlers
  const handleFilterChange = (newFilters: any) => {
    actions.setFilters(newFilters);
  };

  const handleBaixaEstoque = async (pedidos: string[]) => {
    console.log('Iniciando baixa de estoque para:', pedidos);
    setShowBaixaModal(false);
    // Lógica de baixa de estoque aqui
  };

  // Effects
  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (integrationAccountId) {
      actions.setIntegrationAccountId(integrationAccountId);
    }
  }, [integrationAccountId, actions]);

  // Effect para buscar pedidos de múltiplas contas
  useEffect(() => {
    if (selectedAccounts.length > 0) {
      // Se múltiplas contas selecionadas, buscar pedidos de todas
      if (selectedAccounts.length > 1) {
        // Implementar busca de múltiplas contas aqui
        // Por enquanto mantém a primeira conta para compatibilidade
        actions.setIntegrationAccountId(selectedAccounts[0]);
      } else {
        actions.setIntegrationAccountId(selectedAccounts[0]);
      }
    }
  }, [selectedAccounts, actions]);

  // Render principal
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* 🛡️ HEADER BLINDADO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie seus pedidos do Mercado Livre
            {state.fonte && (
              <Badge variant="outline" className="ml-2">
                Fonte: {state.fonte}
              </Badge>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* 🚀 FASE 3: Filtros salvos */}
          <SavedFiltersManager
            savedFilters={actions.getSavedFilters()}
            onSaveFilters={actions.saveCurrentFilters}
            onLoadFilters={actions.loadSavedFilters}
            hasActiveFilters={pedidosManager.hasActiveFilters}
          />
          
          {/* 🚀 FASE 3: Exportação */}
          <ExportModal
            onExport={actions.exportData}
            totalRecords={total}
            isLoading={loading}
          />
          
          <Button
            variant="outline"
            onClick={actions.refetch}
            disabled={loading || state.isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || state.isRefreshing) ? 'animate-spin' : ''}`} />
            {state.isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
          
          {selectedOrders.size > 0 && (
            <Button onClick={() => setShowBaixaModal(true)}>
              <Package className="h-4 w-4 mr-2" />
              Baixar Estoque ({selectedOrders.size})
            </Button>
          )}
        </div>
      </div>

      {/* 🛡️ SELEÇÃO MÚLTIPLA DE CONTAS */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Contas do Mercado Livre:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (selectedAccounts.length === accounts.length) {
                  setSelectedAccounts([]);
                  actions.setIntegrationAccountId('');
                } else {
                  const allAccountIds = accounts.map(acc => acc.id);
                  setSelectedAccounts(allAccountIds);
                  if (allAccountIds.length > 0) {
                    actions.setIntegrationAccountId(allAccountIds[0]);
                  }
                }
              }}
            >
              {selectedAccounts.length === accounts.length ? 'Desselecionar Todas' : 'Selecionar Todas'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((acc) => (
              <label
                key={acc.id}
                className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedAccounts.includes(acc.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const newSelected = [...selectedAccounts, acc.id];
                      setSelectedAccounts(newSelected);
                      if (!integrationAccountId) {
                        actions.setIntegrationAccountId(acc.id);
                      }
                    } else {
                      const newSelected = selectedAccounts.filter(id => id !== acc.id);
                      setSelectedAccounts(newSelected);
                      if (integrationAccountId === acc.id && newSelected.length > 0) {
                        actions.setIntegrationAccountId(newSelected[0]);
                      } else if (newSelected.length === 0) {
                        actions.setIntegrationAccountId('');
                      }
                    }
                  }}
                />
                <div className="flex-1">
                  <div className="font-medium">{acc.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {acc.account_identifier || 'ID não disponível'}
                  </div>
                </div>
              </label>
            ))}
          </div>
          
          {selectedAccounts.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedAccounts.length} conta(s) selecionada(s)
            </div>
          )}
        </div>
      </Card>

      {/* 🛡️ FILTROS SIMPLES E FUNCIONAIS */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Filtros</h3>
            <Button size="sm" variant="outline" onClick={actions.clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Status do Envio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status do Envio</label>
              <Select 
                value={Array.isArray(filters.situacao) ? filters.situacao[0] || 'all' : filters.situacao || 'all'} 
                onValueChange={(value) => actions.setFilters({ situacao: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      Pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="ready_to_ship">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      Pronto para Envio
                    </div>
                  </SelectItem>
                  <SelectItem value="shipped">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                      Enviado
                    </div>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      Entregue
                    </div>
                  </SelectItem>
                  <SelectItem value="not_delivered">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      Não Entregue
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      Cancelado
                    </div>
                  </SelectItem>
                  <SelectItem value="handling">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                      Processando
                    </div>
                  </SelectItem>
                  <SelectItem value="to_be_agreed">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                      A Combinar
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
                      !filters.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dataInicio ? (
                      format(filters.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataInicio}
                    onSelect={(date) => actions.setFilters({ dataInicio: date })}
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
                      !filters.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dataFim ? (
                      format(filters.dataFim, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataFim}
                    onSelect={(date) => actions.setFilters({ dataFim: date })}
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
        {(filters.situacao || filters.dataInicio || filters.dataFim) && (
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
      <Card>
        {loading && !state.isRefreshing ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Carregando pedidos...</p>
            <p className="text-xs text-muted-foreground mt-1">
              {state.cachedAt ? 'Verificando atualizações...' : 'Buscando dados...'}
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {pedidosManager.hasActiveFilters 
                ? 'Nenhum pedido encontrado com os filtros aplicados' 
                : 'Nenhum pedido encontrado'
              }
            </p>
            {pedidosManager.hasActiveFilters && (
              <Button
                variant="link"
                onClick={actions.clearFilters}
                className="mt-2"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-3">
                    <Checkbox
                      checked={selectedOrders.size === orders.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOrders(new Set(orders.map(o => o.id)));
                        } else {
                          setSelectedOrders(new Set());
                        }
                      }}
                    />
                  </th>
                   {/* Colunas básicas */}
                   {visibleColumns.has('id') && <th className="text-left p-3">ID-Único</th>}
                   {visibleColumns.has('empresa') && <th className="text-left p-3">Empresa</th>}
                   {visibleColumns.has('numero') && <th className="text-left p-3">Número do Pedido</th>}
                  {visibleColumns.has('nome_cliente') && <th className="text-left p-3">Nome do Cliente</th>}
                   {visibleColumns.has('data_pedido') && <th className="text-left p-3">Data do Pedido</th>}
                   {visibleColumns.has('last_updated') && <th className="text-left p-3">Última Atualização</th>}
                  
                  {/* Colunas de produtos */}
                  {visibleColumns.has('skus_produtos') && <th className="text-left p-3">SKUs/Produtos</th>}
                  {visibleColumns.has('quantidade_itens') && <th className="text-left p-3">Quantidade Total</th>}
                  {visibleColumns.has('titulo_anuncio') && <th className="text-left p-3">Título do Produto</th>}
                  
                   {/* Colunas financeiras */}
                   {visibleColumns.has('valor_total') && <th className="text-left p-3">Valor Total</th>}
                   {visibleColumns.has('paid_amount') && <th className="text-left p-3">Valor Pago</th>}
                   {visibleColumns.has('shipping_cost') && <th className="text-left p-3">Custo do Frete</th>}
                   {visibleColumns.has('coupon_amount') && <th className="text-left p-3">Desconto Cupom</th>}
                   {visibleColumns.has('receita_por_envio') && <th className="text-left p-3">Receita com Envio</th>}
                   {visibleColumns.has('valor_liquido_vendedor') && <th className="text-left p-3">Valor Líquido Vendedor</th>}
                   {visibleColumns.has('payment_method') && <th className="text-left p-3">Método Pagamento</th>}
                   {visibleColumns.has('payment_status') && <th className="text-left p-3">Status Pagamento</th>}
                   {visibleColumns.has('payment_type') && <th className="text-left p-3">Tipo Pagamento</th>}
                   {visibleColumns.has('marketplace_fee') && <th className="text-left p-3">Taxa Marketplace</th>}
                  
                  {/* Colunas de status */}
                  {visibleColumns.has('situacao') && <th className="text-left p-3">Situação</th>}
                  
                  
                  {/* Colunas de mapeamento */}
                  {visibleColumns.has('mapeamento') && <th className="text-left p-3">Status Mapeamento</th>}
                  {visibleColumns.has('sku_estoque') && <th className="text-left p-3">SKU Estoque</th>}
                  {visibleColumns.has('sku_kit') && <th className="text-left p-3">SKU KIT</th>}
                  {visibleColumns.has('qtd_kit') && <th className="text-left p-3">Quantidade KIT</th>}
                  {visibleColumns.has('status_baixa') && <th className="text-left p-3">Status da Baixa</th>}
                  
                  {/* Colunas do Mercado Livre */}
                  {visibleColumns.has('date_created') && <th className="text-left p-3">Data Criação ML</th>}
                  {visibleColumns.has('pack_id') && <th className="text-left p-3">Pack ID</th>}
                  {visibleColumns.has('pickup_id') && <th className="text-left p-3">Pickup ID</th>}
                  {visibleColumns.has('manufacturing_ending_date') && <th className="text-left p-3">Data Fim Fabricação</th>}
                  {visibleColumns.has('comment') && <th className="text-left p-3">Comentário ML</th>}
                  {visibleColumns.has('tags') && <th className="text-left p-3">Tags</th>}
                  
                   {/* Colunas de envio específicas da API */}
                   {visibleColumns.has('shipping_status') && <th className="text-left p-3">Status do Envio</th>}
                   {visibleColumns.has('logistic_mode') && <th className="text-left p-3">Logistic Mode (Principal)</th>}
                   {visibleColumns.has('logistic_type') && <th className="text-left p-3">Logistic Type</th>}
                   {visibleColumns.has('shipping_method_type') && <th className="text-left p-3">Shipping Method Type</th>}
                   {visibleColumns.has('delivery_type') && <th className="text-left p-3">Delivery Type</th>}
                   {visibleColumns.has('substatus_detail') && <th className="text-left p-3">Substatus (Estado Atual)</th>}
                   
                   {/* Colunas de envio combinadas (mantidas para compatibilidade) */}
                   {visibleColumns.has('shipping_mode') && <th className="text-left p-3">Modo de Envio (Combinado)</th>}
                   {visibleColumns.has('shipping_method') && <th className="text-left p-3">Método de Envio (Combinado)</th>}
                   {visibleColumns.has('shipping_substatus') && <th className="text-left p-3">Sub-status Envio (Combinado)</th>}
                   {visibleColumns.has('forma_entrega') && <th className="text-left p-3">Forma de Entrega (Combinado)</th>}
                   {visibleColumns.has('codigo_rastreamento') && <th className="text-left p-3">Código Rastreamento</th>}
                   {visibleColumns.has('url_rastreamento') && <th className="text-left p-3">URL Rastreamento</th>}
                   {visibleColumns.has('nome_destinatario') && <th className="text-left p-3">Nome Destinatário</th>}
                  
                   
                   {/* Colunas de identificação */}
                   {visibleColumns.has('integration_account_id') && <th className="text-left p-3">ID Conta Integração</th>}
                   
                   {/* Colunas de identificação do comprador */}
                   
                   {/* Colunas de endereço de entrega */}
                   
                   {visibleColumns.has('destination_street_name') && <th className="text-left p-3">Rua</th>}
                   {visibleColumns.has('destination_street_number') && <th className="text-left p-3">Número</th>}
                   
                   {visibleColumns.has('destination_comment') && <th className="text-left p-3">Complemento</th>}
                   {visibleColumns.has('destination_zip_code') && <th className="text-left p-3">CEP</th>}
                   {visibleColumns.has('destination_city_name') && <th className="text-left p-3">Cidade</th>}
                   {visibleColumns.has('destination_state_name') && <th className="text-left p-3">Estado</th>}
                   {visibleColumns.has('destination_state_id') && <th className="text-left p-3">Estado (Sigla)</th>}
                   {visibleColumns.has('destination_neighborhood_name') && <th className="text-left p-3">Bairro</th>}
                   
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const mapping = mappingData.get(order.id);
                  const skus = order.skus || order.order_items?.map((item: any) => item.item?.seller_sku) || [];
                  const quantidadeItens = order.quantidade_itens || order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
                  
                  return (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedOrders);
                            if (checked) {
                              newSelected.add(order.id);
                            } else {
                              newSelected.delete(order.id);
                            }
                            setSelectedOrders(newSelected);
                          }}
                        />
                      </td>
                      
                      {visibleColumns.has('id') && (
                        <td className="p-3 font-mono text-sm">{generateUniqueId(order)}</td>
                      )}
                      
                      {visibleColumns.has('empresa') && (
                        <td className="p-3">
                          {(() => {
                            // Buscar o nome da empresa baseado no integration_account_id
                            let accountId = order.integration_account_id;
                            
                            // Se não tiver integration_account_id, tentar outras formas de identificar
                            if (!accountId && selectedAccounts.length === 1) {
                              accountId = selectedAccounts[0];
                            }
                            
                            // Se ainda não tiver, tentar pegar da conta selecionada no manager
                            if (!accountId && integrationAccountId) {
                              accountId = integrationAccountId;
                            }
                            
                            if (!accountId) return 'Conta não informada';
                            
                             const account = accounts.find(acc => acc.id === accountId);
                             if (!account) return `Conta ${accountId.substring(0, 8)}...`;
                             
                             const companyName = account.name || account.settings?.store_name || `Conta ${account.id.substring(0, 8)}...`;
                             const isFulfillment = order.is_fulfillment || 
                               order.logistic_type === 'fulfillment' ||
                               order.shipping?.logistic?.type === 'fulfillment' ||
                               order.raw?.shipping?.logistic?.type === 'fulfillment';
                             
                             return (
                               <div className="flex items-center gap-2">
                                 <span>{companyName}</span>
                                 {isFulfillment && (
                                   <Badge variant="outline" className="text-xs px-1 py-0">
                                     MLF
                                   </Badge>
                                 )}
                               </div>
                             );
                          })()}
                        </td>
                      )}
                      
                      {visibleColumns.has('numero') && (
                        <td className="p-3 font-mono text-sm">{order.numero || order.id}</td>
                      )}
                      
                      {visibleColumns.has('nome_cliente') && (
                        <td className="p-3">
                          {order.nome_cliente 
                            || [order.buyer?.first_name, order.buyer?.last_name].filter(Boolean).join(' ')
                            || order.buyer?.nickname 
                            || '-'}
                        </td>
                      )}
                      
                       {visibleColumns.has('data_pedido') && (
                         <td className="p-3">{formatDate(order.data_pedido || order.date_created)}</td>
                       )}
                       
                       {visibleColumns.has('last_updated') && (
                         <td className="p-3">{order.last_updated ? formatDate(order.last_updated) : '-'}</td>
                       )}
                      
                      {/* Colunas de produtos */}
                      {visibleColumns.has('skus_produtos') && (
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={skus.join(', ')}>
                            {skus.length > 0 ? skus.join(', ') : '-'}
                          </div>
                        </td>
                      )}
                      
                      {visibleColumns.has('quantidade_itens') && (
                        <td className="p-3">{quantidadeItens}</td>
                      )}
                      
                      {visibleColumns.has('titulo_anuncio') && (
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={order.order_items?.[0]?.item?.title || order.titulo_anuncio}>
                            {order.order_items?.[0]?.item?.title || order.titulo_anuncio || '-'}
                          </div>
                        </td>
                      )}
                      
                      {/* Colunas financeiras */}
                      {visibleColumns.has('valor_total') && (
                        <td className="p-3">{formatMoney(order.valor_total || order.total_amount || 0)}</td>
                      )}
                      
                      {visibleColumns.has('paid_amount') && (
                        <td className="p-3">{formatMoney(order.paid_amount || 0)}</td>
                      )}
                      
                        {visibleColumns.has('shipping_cost') && (
                          <td className="p-3">
                            {(() => {
                              // Priorizar dados dos payments (mais confiável para frete)
                              const shippingCost = 
                                order.payments?.[0]?.shipping_cost ||
                                order.raw?.payments?.[0]?.shipping_cost ||
                                order.valor_frete ||
                                order.shipping_cost ||
                                order.shipping?.cost ||
                                0;
                              return formatMoney(shippingCost);
                            })()}
                          </td>
                        )}
                      
                      
                       {visibleColumns.has('coupon_amount') && (
                         <td className="p-3">{formatMoney(order.coupon_amount || order.coupon?.amount || 0)}</td>
                       )}
                       
                       {visibleColumns.has('receita_por_envio') && (
                         <td className="p-3">{formatMoney(getReceitaPorEnvio(order))}</td>
                       )}
                       
                       {visibleColumns.has('valor_liquido_vendedor') && (
                         <td className="p-3">{formatMoney(getValorLiquidoVendedor(order))}</td>
                       )}
                      
                      {/* Colunas de pagamento */}
                      {visibleColumns.has('payment_method') && (
                        <td className="p-3">
                          <span className="text-xs">
                            {(() => {
                              const method = order.payments?.[0]?.payment_method_id || 
                                           order.raw?.payments?.[0]?.payment_method_id || 
                                           order.payment_method || 
                                           order.forma_pagamento;
                              
                              const methodMapping: Record<string, string> = {
                                'account_money': 'Dinheiro em Conta',
                                'visa': 'Visa',
                                'master': 'Mastercard',
                                'amex': 'American Express',
                                'pix': 'PIX',
                                'bolbradesco': 'Boleto Bradesco',
                                'pec': 'Pagamento na Entrega'
                              };
                              
                              return methodMapping[method] || method || '-';
                            })()}
                          </span>
                        </td>
                      )}
                      
                      {visibleColumns.has('payment_status') && (
                        <td className="p-3">
                          <span className="text-xs">
                            {order.payments?.[0]?.status || 
                             order.raw?.payments?.[0]?.status || 
                             order.payment_status || 
                             '-'}
                          </span>
                        </td>
                      )}
                      
                      {visibleColumns.has('payment_type') && (
                        <td className="p-3">
                          <span className="text-xs">
                            {(() => {
                              const paymentType = order.payments?.[0]?.payment_type_id || 
                                                order.raw?.payments?.[0]?.payment_type_id || 
                                                order.payment_type;
                              
                              const typeMapping: Record<string, string> = {
                                'account_money': 'Dinheiro em Conta',
                                'credit_card': 'Cartão de Crédito',
                                'debit_card': 'Cartão de Débito',
                                'bank_transfer': 'Transferência Bancária',
                                'digital_wallet': 'Carteira Digital',
                                'cryptocurrency': 'Criptomoeda',
                                'ticket': 'Boleto',
                                'atm': 'Caixa Eletrônico',
                                'prepaid_card': 'Cartão Pré-pago'
                              };
                              
                              return typeMapping[paymentType] || paymentType || '-';
                            })()}
                          </span>
                        </td>
                      )}
                      
                      {visibleColumns.has('marketplace_fee') && (
                        <td className="p-3">
                          {(() => {
                            // Taxa do marketplace - geralmente está no sale_fee dos order_items
                            const fee = 
                              order.order_items?.[0]?.sale_fee ||
                              order.raw?.order_items?.[0]?.sale_fee ||
                              order.marketplace_fee || 
                              order.fees?.[0]?.value || 
                              order.raw?.fees?.[0]?.value ||
                              0;
                            return fee > 0 ? formatMoney(fee) : '-';
                          })()}
                        </td>
                      )}
                      
                      {/* Colunas de status */}
                      {visibleColumns.has('situacao') && (
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(order.situacao || order.status)}>
                            {order.situacao || order.status || '-'}
                          </Badge>
                        </td>
                      )}
                      
                      
                      {/* Colunas de mapeamento */}
                      {visibleColumns.has('mapeamento') && (
                        <td className="p-3">
                          {mapping ? (
                            <Badge variant="secondary">
                              {mapping.statusBaixa === 'pronto_baixar' ? 'Mapeado' : 'Parcial'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Não mapeado</Badge>
                          )}
                        </td>
                      )}
                      
                      {visibleColumns.has('sku_estoque') && (
                        <td className="p-3">{mapping?.skuEstoque || '-'}</td>
                      )}
                      
                      {visibleColumns.has('sku_kit') && (
                        <td className="p-3">{mapping?.skuKit || '-'}</td>
                      )}
                      
                      {visibleColumns.has('qtd_kit') && (
                        <td className="p-3">{mapping?.qtdKit || '-'}</td>
                      )}
                      
                      {visibleColumns.has('status_baixa') && (
                        <td className="p-3">{renderStatusBaixa(order.id)}</td>
                      )}
                      
                      {/* Colunas do Mercado Livre */}
                      {visibleColumns.has('date_created') && (
                        <td className="p-3">{order.date_created ? formatDate(order.date_created) : '-'}</td>
                      )}
                      
                      {visibleColumns.has('pack_id') && (
                        <td className="p-3">{order.pack_id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('pickup_id') && (
                        <td className="p-3">{order.pickup_id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('manufacturing_ending_date') && (
                        <td className="p-3">{order.manufacturing_ending_date ? formatDate(order.manufacturing_ending_date) : '-'}</td>
                      )}
                      
                      {visibleColumns.has('comment') && (
                        <td className="p-3">{order.comment || '-'}</td>
                      )}
                      
                      {visibleColumns.has('tags') && (
                        <td className="p-3">{translateTags(order.tags)}</td>
                      )}
                      
                      {/* Colunas de envio - CORREÇÃO: usar campos mapeados */}
                      {visibleColumns.has('shipping_id') && (
                        <td className="p-3">{order.shipping_id || '-'}</td>
                      )}
                      
                       {visibleColumns.has('shipping_status') && (
                         <td className="p-3">
                           {(() => {
                             const status = order.shipping_status || order.shipping?.status || order.raw?.shipping?.status;
                             const translatedStatus = translateShippingStatus(status);
                             const colorClass = getShippingStatusColor(status);
                             
                             return (
                               <Badge className={`text-xs border ${colorClass}`}>
                                 {translatedStatus}
                               </Badge>
                             );
                           })()}
                         </td>
                       )}
                       
                       {/* 🆕 COLUNAS ESPECÍFICAS DOS CAMPOS DA API */}
                       {visibleColumns.has('logistic_mode') && (
                         <td className="p-3">
                           <span className="text-xs font-mono">
                             {order.shipping?.logistic?.mode || 
                              order.raw?.shipping?.logistic?.mode || 
                              order.logistic_mode || 
                              '-'}
                           </span>
                         </td>
                       )}
                       
                       {visibleColumns.has('logistic_type') && (
                         <td className="p-3">
                           <span className="text-xs font-mono">
                             {order.shipping?.logistic?.type || 
                              order.raw?.shipping?.logistic?.type || 
                              order.logistic_type || 
                              '-'}
                           </span>
                         </td>
                       )}
                       
                       {visibleColumns.has('shipping_method_type') && (
                         <td className="p-3">
                           <span className="text-xs font-mono">
                             {order.shipping_method?.type || 
                              order.shipping?.shipping_method?.type || 
                              order.raw?.shipping?.shipping_method?.type || 
                              '-'}
                           </span>
                         </td>
                       )}
                       
                       {visibleColumns.has('delivery_type') && (
                         <td className="p-3">
                           <span className="text-xs font-mono">
                             {order.delivery_type || 
                              order.shipping?.delivery_type || 
                              order.raw?.shipping?.delivery_type || 
                              '-'}
                           </span>
                         </td>
                       )}
                       
                       {visibleColumns.has('substatus_detail') && (
                         <td className="p-3">
                           <span className="text-xs font-mono">
                             {order.shipping_substatus || 
                              order.shipping?.substatus || 
                              order.raw?.shipping?.substatus || 
                              order.substatus || 
                              order.raw?.substatus || 
                              '-'}
                           </span>
                         </td>
                       )}
                      
                       {visibleColumns.has('shipping_mode') && (
                         <td className="p-3">
                           <div className="flex flex-col gap-1">
                             {(() => {
                               // 1. logistic_mode (Principal identificador)
                               const logisticMode = 
                                 order.shipping?.logistic?.mode ||
                                 order.raw?.shipping?.logistic?.mode ||
                                 order.logistic_mode ||
                                 order.shipping_mode ||
                                 order.shipping_details?.shipping_mode;
                               
                               // 2. logistic_type (Complementar)
                               const logisticType =
                                 order.shipping?.logistic?.type ||
                                 order.raw?.shipping?.logistic?.type ||
                                 order.logistic_type ||
                                 order.shipping_details?.logistic_type;
                               
                               // 3. delivery_type 
                               const deliveryType =
                                 order.delivery_type ||
                                 order.shipping?.delivery_type ||
                                 order.raw?.shipping?.delivery_type ||
                                 order.shipping_details?.delivery_type;
                               
                               // 4. shipping_method.type
                               const shippingMethodType = 
                                 order.shipping_method?.type ||
                                 order.shipping?.shipping_method?.type ||
                                 order.raw?.shipping?.shipping_method?.type;
                               
                               // Montar display com todos os valores relevantes
                               const parts = [];
                               
                               if (logisticMode) parts.push(`Mode: ${logisticMode}`);
                               if (logisticType) parts.push(`Type: ${logisticType}`);
                               if (deliveryType) parts.push(`Delivery: ${deliveryType}`);
                               if (shippingMethodType) parts.push(`Method: ${shippingMethodType}`);
                               
                               return (
                                 <div className="text-xs">
                                   {parts.length > 0 ? (
                                     parts.map((part, i) => (
                                       <div key={i} className="text-gray-600">{part}</div>
                                     ))
                                   ) : (
                                     <span className="text-muted-foreground">-</span>
                                   )}
                                 </div>
                               );
                             })()}
                           </div>
                         </td>
                       )}
                      
                       {visibleColumns.has('shipping_method') && (
                         <td className="p-3">
                           <div className="flex flex-col gap-1">
                             {(() => {
                               const shippingMethod = order.shipping_method || 
                                 order.shipping?.shipping_method || 
                                 order.raw?.shipping?.shipping_method ||
                                 order.shipping_details?.shipping_method;
                               
                               if (!shippingMethod) return <span className="text-muted-foreground">-</span>;
                               
                               if (typeof shippingMethod === 'string') {
                                 return <span className="text-xs">{shippingMethod}</span>;
                               }
                               
                               // Se for objeto, mostrar name, type, id
                               const parts = [];
                               if (shippingMethod.name) parts.push(`Name: ${shippingMethod.name}`);
                               if (shippingMethod.type) parts.push(`Type: ${shippingMethod.type}`);
                               if (shippingMethod.id) parts.push(`ID: ${shippingMethod.id}`);
                               
                               return (
                                 <div className="text-xs">
                                   {parts.length > 0 ? (
                                     parts.map((part, i) => (
                                       <div key={i} className="text-gray-600">{part}</div>
                                     ))
                                   ) : (
                                     <span className="text-muted-foreground">Objeto complexo</span>
                                   )}
                                 </div>
                               );
                             })()}
                           </div>
                         </td>
                       )}
                      
                       {visibleColumns.has('shipping_substatus') && (
                         <td className="p-3">
                           <div className="flex flex-col gap-1">
                             {(() => {
                               // substatus do shipping
                               const shippingSubstatus = order.shipping_substatus || 
                                 order.shipping?.substatus || 
                                 order.raw?.shipping?.substatus || 
                                 order.shipping_details?.substatus;
                               
                               // substatus geral (pode vir diretamente do order)
                               const generalSubstatus = order.substatus || order.raw?.substatus;
                               
                               const parts = [];
                               if (shippingSubstatus) parts.push(`Shipping: ${shippingSubstatus}`);
                               if (generalSubstatus && generalSubstatus !== shippingSubstatus) {
                                 parts.push(`General: ${generalSubstatus}`);
                               }
                               
                               return (
                                 <div className="text-xs">
                                   {parts.length > 0 ? (
                                     parts.map((part, i) => (
                                       <div key={i} className="text-gray-600">{part}</div>
                                     ))
                                   ) : (
                                     <span className="text-muted-foreground">-</span>
                                   )}
                                 </div>
                               );
                             })()}
                           </div>
                         </td>
                       )}
                      
                       {visibleColumns.has('forma_entrega') && (
                         <td className="p-3">
                           <div className="flex flex-col gap-1">
                             {(() => {
                               // delivery_type
                               const deliveryType = order.delivery_type || 
                                 order.shipping?.delivery_type || 
                                 order.raw?.shipping?.delivery_type;
                               
                               // forma_entrega (campo mapeado)
                               const formaEntrega = order.forma_entrega;
                               
                               // shipping mode/type como complemento
                               const shippingMode = order.shipping?.mode || 
                                 order.raw?.shipping?.mode;
                               
                               const parts = [];
                               if (deliveryType) parts.push(`Delivery: ${deliveryType}`);
                               if (formaEntrega && formaEntrega !== deliveryType) {
                                 parts.push(`Forma: ${formaEntrega}`);
                               }
                               if (shippingMode && shippingMode !== deliveryType && shippingMode !== formaEntrega) {
                                 parts.push(`Mode: ${shippingMode}`);
                               }
                               
                               return (
                                 <div className="text-xs">
                                   {parts.length > 0 ? (
                                     parts.map((part, i) => (
                                       <div key={i} className="text-gray-600">{part}</div>
                                     ))
                                   ) : (
                                     <span className="text-muted-foreground">standard</span>
                                   )}
                                 </div>
                               );
                             })()}
                           </div>
                         </td>
                       )}
                      
                      {visibleColumns.has('codigo_rastreamento') && (
                        <td className="p-3">{order.codigo_rastreamento || order.shipping?.tracking_number || '-'}</td>
                      )}
                      
                      {visibleColumns.has('url_rastreamento') && (
                        <td className="p-3">
                          {order.url_rastreamento || order.shipping?.tracking_url ? (
                            <a 
                              href={order.url_rastreamento || order.shipping?.tracking_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Ver rastreamento
                            </a>
                          ) : '-'}
                        </td>
                      )}
                      
                       {/* Nome destinatário - usar shipping.destination.receiver_name */}
                       {visibleColumns.has('nome_destinatario') && (
                         <td className="p-3">
                           {order.nome_destinatario
                             || order.shipping?.destination?.receiver_name
                             || order.shipping?.receiver_address?.receiver_name 
                             || order.nome_cliente 
                             || [order.buyer?.first_name, order.buyer?.last_name].filter(Boolean).join(' ')
                             || order.buyer?.nickname 
                             || '-'}
                        </td>
                      )}
                      
                       
                       {visibleColumns.has('paid_amount') && (
                         <td className="p-3">
                           {(() => {
                             const amount = order.paid_amount || order.payments?.[0]?.total_paid_amount || order.raw?.payments?.[0]?.total_paid_amount;
                             return amount ? `R$ ${Number(amount).toFixed(2)}` : '-';
                           })()}
                         </td>
                       )}
                       
                       
                        {visibleColumns.has('coupon_amount') && (
                          <td className="p-3">
                            {(() => {
                              // Priorizar dados dos payments (mais confiável para desconto cupom)
                              const amount = 
                                order.payments?.[0]?.coupon_amount ||
                                order.raw?.payments?.[0]?.coupon_amount ||
                                order.coupon?.amount ||
                                order.raw?.coupon?.amount ||
                                order.coupon_amount ||
                                order.valor_desconto || // fallback para desconto geral
                                0;
                              return amount > 0 ? formatMoney(amount) : '-';
                            })()}
                          </td>
                        )}
                       
                       
                        {/* Colunas de identificação do comprador - usando buyer.* da API */}
                        
                        {/* Colunas de endereço de entrega - usando shipping.destination.shipping_address.* */}
                        
                        {visibleColumns.has('destination_street_name') && (
                          <td className="p-3">
                            {order.shipping?.destination?.shipping_address?.street_name ||
                             order.shipping?.receiver_address?.street_name ||
                             order.shipping_details?.receiver_address?.street_name ||
                             order.raw?.shipping?.receiver_address?.street_name ||
                             order.receiver_address_street || '-'}
                          </td>
                        )}
                        
                        {visibleColumns.has('destination_street_number') && (
                          <td className="p-3">
                            {order.shipping?.destination?.shipping_address?.street_number ||
                             order.shipping?.receiver_address?.street_number ||
                             order.shipping_details?.receiver_address?.street_number ||
                             order.raw?.shipping?.receiver_address?.street_number ||
                             order.receiver_address_number || '-'}
                          </td>
                        )}
                        
                        
                        {visibleColumns.has('destination_comment') && (
                          <td className="p-3">
                            {order.shipping?.destination?.shipping_address?.comment ||
                             order.shipping?.receiver_address?.comment ||
                             order.shipping_details?.receiver_address?.comment ||
                             order.buyer_address?.complement ||
                             order.buyer_address_complement || '-'}
                          </td>
                        )}
                        
                        {visibleColumns.has('destination_zip_code') && (
                          <td className="p-3">
                            {order.shipping?.destination?.shipping_address?.zip_code ||
                             order.shipping?.receiver_address?.zip_code ||
                             order.shipping_details?.receiver_address?.zip_code ||
                             order.buyer_address?.zip_code ||
                             order.buyer_address_zip_code ||
                             order.cep || '-'}
                          </td>
                        )}
                        
                        {visibleColumns.has('destination_city_name') && (
                          <td className="p-3">
                            {order.shipping?.destination?.shipping_address?.city?.name ||
                             order.shipping?.receiver_address?.city?.name ||
                             order.shipping_details?.receiver_address?.city?.name ||
                             order.buyer_address?.city ||
                             order.buyer_address_city ||
                             order.cidade || '-'}
                          </td>
                        )}
                        
                        {visibleColumns.has('destination_state_name') && (
                          <td className="p-3">
                            {order.shipping?.destination?.shipping_address?.state?.name ||
                             order.shipping?.receiver_address?.state?.name ||
                             order.shipping_details?.receiver_address?.state?.name ||
                             order.buyer_address?.state ||
                             order.buyer_address_state ||
                             order.uf || '-'}
                          </td>
                        )}
                        
                        {visibleColumns.has('destination_state_id') && (
                          <td className="p-3">
                            {order.shipping?.destination?.shipping_address?.state?.id ||
                             order.shipping?.receiver_address?.state?.id ||
                             order.shipping_details?.receiver_address?.state?.id ||
                             order.receiver_address_state_id ||
                             order.uf || '-'}
                          </td>
                        )}
                        
                        {visibleColumns.has('destination_neighborhood_name') && (
                          <td className="p-3">
                            {order.shipping?.destination?.shipping_address?.neighborhood?.name ||
                             order.shipping?.receiver_address?.neighborhood?.name ||
                             order.shipping_details?.receiver_address?.neighborhood?.name ||
                             order.raw?.shipping?.receiver_address?.neighborhood?.name ||
                             order.receiver_address_neighborhood || '-'}
                          </td>
                        )}
                        
                        
                        {visibleColumns.has('buyer_address_country') && (
                          <td className="p-3">
                            {(() => {
                              const country = order.shipping?.receiver_address?.country?.name ||
                                            order.shipping_details?.receiver_address?.country?.name ||
                                            order.buyer_address?.country ||
                                            order.buyer_address_country ||
                                            'Brasil';
                              return country || '-';
                            })()}
                          </td>
                        )}
                       
                       
                       {visibleColumns.has('integration_account_id') && (
                         <td className="p-3 font-mono text-xs">{order.integration_account_id || '-'}</td>
                       )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 🛡️ PAGINAÇÃO */}
      {Math.ceil(total / 25) > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Página {currentPage} de {Math.ceil(total / 25)} ({total} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.setPage(Math.min(Math.ceil(total / 25), currentPage + 1))}
            disabled={currentPage === Math.ceil(total / 25)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 🛡️ MODAL DE BAIXA - Temporariamente desabilitado */}
      {showBaixaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg">
            <p>Modal de baixa será implementado</p>
            <Button onClick={() => setShowBaixaModal(false)}>Fechar</Button>
          </div>
        </div>
      )}
    </div>
  );
}