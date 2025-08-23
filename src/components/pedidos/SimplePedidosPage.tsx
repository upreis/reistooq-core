import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Package, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Clock, Filter, Settings, CheckSquare } from 'lucide-react';
import { BaixaEstoqueModal } from './BaixaEstoqueModal';
import { PedidosFilters, PedidosFiltersState } from './PedidosFilters';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { Pedido } from '@/types/pedido';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  const [integrationAccountId, setIntegrationAccountId] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<PedidosFiltersState>({});
  const [mapeamentos, setMapeamentos] = useState<Map<string, MapeamentoVerificacao>>(new Map());
  const [mappingData, setMappingData] = useState<Map<string, any>>(new Map());

  // Configuração de colunas
  const defaultColumns = new Set([
    'id_unico', 'data_pedido', 'uf', 'status', 'skus_produtos', 
    'num_venda', 'unidades_vendidas', 'valor_total', 'mapeamento', 'titulo_anuncio', 'nome_destinatario',
    'sku_estoque', 'sku_kit', 'qtd_kit', 'status_baixa'
  ]);
  
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(defaultColumns);

  const allColumns = [
    { key: 'id_unico', label: 'ID-Único', default: true },
    { key: 'cliente', label: 'Cliente', default: false },
    { key: 'data_pedido', label: 'Data Pedido', default: true },
    { key: 'uf', label: 'UF', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'forma_entrega', label: 'Forma Entrega', default: false },
    { key: 'skus_produtos', label: 'SKUs/Produtos', default: true },
    { key: 'num_venda', label: 'Nº da venda', default: true },
    { key: 'unidades_vendidas', label: 'Unidades Vendidas', default: true },
    { key: 'valor_total', label: 'Valor Total', default: true },
    { key: 'mapeamento', label: 'Mapeamento', default: true },
    { key: 'receita_produtos', label: 'Receita Produtos', default: false },
    { key: 'tarifas_venda', label: 'Tarifas Venda', default: false },
    { key: 'impostos', label: 'Impostos', default: false },
    { key: 'receita_envio', label: 'Receita Envio', default: false },
    { key: 'valor_pago_total', label: 'Valor Pago Total', default: false },
    { key: 'titulo_anuncio', label: 'Título Anúncio', default: true },
    { key: 'categoria_ml', label: 'Categoria ML', default: false },
    { key: 'condicao', label: 'Condição', default: false },
    { key: 'garantia', label: 'Garantia', default: false },
    { key: 'tipo_listagem', label: 'Tipo Listagem', default: false },
    { key: 'atributos_variacao', label: 'Atributos Variação', default: false },
    { key: 'metodo_rastreamento', label: 'Método Rastreamento', default: false },
    { key: 'substatus', label: 'Sub-status', default: false },
    { key: 'modo_logistico', label: 'Modo Logístico', default: false },
    { key: 'cidade', label: 'Cidade', default: false },
    { key: 'preferencia_entrega', label: 'Preferência Entrega', default: false },
    { key: 'endereco_completo', label: 'Endereço Completo', default: false },
    { key: 'cep', label: 'CEP', default: false },
    { key: 'comentario_endereco', label: 'Comentário Endereço', default: false },
    { key: 'nome_destinatario', label: 'Nome Destinatário', default: true },
    // Colunas de mapeamento (sempre no final)
    { key: 'sku_estoque', label: 'SKU Estoque Mapeado', default: true },
    { key: 'sku_kit', label: 'SKU KIT Mapeado', default: true },
    { key: 'qtd_kit', label: 'QTD KIT Mapeado', default: true },
    
    { key: 'status_baixa', label: 'Status', default: true }
  ];

  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);

  const toggleColumn = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const resetToDefault = () => {
    setVisibleColumns(new Set(defaultColumns));
  };

  // Função para renderizar status da baixa
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

  // Função para simplificar status
  const simplificarStatus = (status: string): string => {
    if (!status) return 'Não informado';
    
    const statusLower = status.toLowerCase();
    
    const statusMap: { [key: string]: string } = {
      // Status do Mercado Livre
      'confirmed': 'Confirmado',
      'payment_required': 'Aguardando pagamento',
      'payment_in_process': 'Processando pagamento',
      'paid': 'Pago',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado',
      'invalid': 'Inválido',
      'expired': 'Expirado',
      'pending': 'Pendente',
      'ready_to_ship': 'Pronto para envio',
      'handling': 'Preparando',
      'not_delivered': 'Não entregue',
      'returned': 'Devolvido',
      
      // Status genéricos
      'completed': 'Concluído',
      'processing': 'Processando',
      'on_hold': 'Em espera',
      'refunded': 'Reembolsado',
      'failed': 'Falha',
      'draft': 'Rascunho',
      'active': 'Ativo',
      'inactive': 'Inativo',
      'partially_shipped': 'Enviado parcialmente',
      'partially_delivered': 'Entregue parcialmente',
      'in_transit': 'Em trânsito',
      'out_for_delivery': 'Saiu para entrega',
      'attempted_delivery': 'Tentativa de entrega',
      'exception': 'Exceção na entrega',
      'waiting_for_pickup': 'Aguardando retirada'
    };
    
    // Busca exata primeiro
    if (statusMap[statusLower]) {
      return statusMap[statusLower];
    }
    
    // Busca por palavras-chave
    if (statusLower.includes('entregue') || statusLower.includes('delivered')) {
      return 'Entregue';
    }
    if (statusLower.includes('cancelado') || statusLower.includes('cancelled')) {
      return 'Cancelado';
    }
    if (statusLower.includes('enviado') || statusLower.includes('shipped')) {
      return 'Enviado';
    }
    if (statusLower.includes('pago') || statusLower.includes('paid')) {
      return 'Pago';
    }
    if (statusLower.includes('pendente') || statusLower.includes('pending')) {
      return 'Pendente';
    }
    if (statusLower.includes('processando') || statusLower.includes('processing')) {
      return 'Processando';
    }
    
    // Se não encontrou mapeamento, capitaliza a primeira letra
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

// Helper: testa se conta possui segredos válidos na unified-orders
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

  // Carregar contas do Mercado Livre
  useEffect(() => {
    loadAccounts();
  }, []);

  // Carregar pedidos quando conta muda ou filtros mudam
  useEffect(() => {
    if (integrationAccountId) {
      loadOrders();
    }
  }, [integrationAccountId, currentPage, JSON.stringify(filters)]);

  // Processar mapeamentos quando pedidos carregam
  useEffect(() => {
    const processarMapeamentos = async () => {
      if (orders.length === 0) return;
      
      const novosMapping = new Map();
      
      for (const pedido of orders) {
        try {
          // Extrair SKUs dos itens
          const skusPedido = pedido.skus?.filter(Boolean) || [];
          
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
        // Escolher automaticamente a primeira conta válida (com segredos)
        for (const acc of list) {
          const ok = await testAccount(acc.id);
          if (ok) {
            setIntegrationAccountId(acc.id);
            return;
          }
        }
        // Se nenhuma válida, selecionar a mais recente e avisar
        setIntegrationAccountId(list[0].id);
        setError('Conta conectada sem segredos válidos. Vá em Configurações > Integrações e reconecte a conta.');
      }
    } catch (err: any) {
      setError(`Erro ao carregar contas: ${err.message}`);
    }
  };

  const loadOrders = async () => {
    if (!integrationAccountId) return;

    setLoading(true);
    setError('');

    try {
      // Converter filtros para parâmetros da API
      const apiParams: any = {};
      if (filters.search) apiParams.q = filters.search;
      if (filters.situacao) apiParams.status = filters.situacao.toLowerCase();
      
      // Só aplicar filtros de data se ambos estiverem selecionados
      if (filters.dataInicio && filters.dataFim) {
        apiParams.date_from = filters.dataInicio.toISOString().split('T')[0];
        apiParams.date_to = filters.dataFim.toISOString().split('T')[0];
      }

      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: {
          integration_account_id: integrationAccountId,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          enrich: true,
          include_shipping: true,
          ...apiParams
        }
      });

      if (error) throw error;
      if (!data?.ok) throw new Error('Erro na resposta da API');

      // Transformar dados raw + unified em format simples
      const results = data.results || [];
      const unified = data.unified || [];
      
      console.log('📊 Debug ML Data:', { 
        resultsCount: results.length, 
        unifiedCount: unified.length,
        firstResult: results[0],
        firstUnified: unified[0] 
      });
      
      const processedOrders: Order[] = results.map((raw: any, index: number) => {
        const unifiedData = unified[index] || {};
        
        // Extrair SKUs dos itens do pedido para mapeamento
        const orderItems = raw.order_items || [];
        const skus = orderItems
          .map((item: any) => item.item?.seller_sku || item.item?.seller_custom_field || item.item?.title?.substring(0, 30))
          .filter(Boolean);

        // Derivar dados detalhados caso unified ainda não contenha (fallback seguro)
        const primeiroItem = orderItems[0]?.item || {};
        const shippingCost = raw.payments?.[0]?.shipping_cost ?? raw.shipping?.cost ?? 0;
        const tarifasVenda = orderItems.reduce((total: number, item: any) => total + (item.sale_fee || 0), 0);
        const impostos = raw.payments?.[0]?.taxes_amount ?? 0;
        const receitaEnvio = shippingCost;
        const valorPagoTotal = raw.paid_amount ?? raw.payments?.[0]?.total_paid_amount ?? 0;
        const receitaProdutos = (raw.total_amount ?? 0) - shippingCost;
        const atributosVariacaoTexto = (primeiroItem.variation_attributes || [])
          .map((attr: any) => `${attr.name}: ${attr.value_name}`)
          .join(', ');
        const enderecoCompleto = [
          raw.shipping?.receiver_address?.street_name,
          raw.shipping?.receiver_address?.street_number,
          raw.shipping?.receiver_address?.neighborhood?.name,
        ].filter(Boolean).join(', ');

        const computedUnified = {
          ...unifiedData,
          // Dados Financeiros Detalhados
          receita_produtos: unifiedData.receita_produtos ?? receitaProdutos,
          tarifas_venda: unifiedData.tarifas_venda ?? tarifasVenda,
          impostos: unifiedData.impostos ?? impostos,
          receita_envio: unifiedData.receita_envio ?? receitaEnvio,
          valor_pago_total: unifiedData.valor_pago_total ?? valorPagoTotal,
          // Dados do Produto/Anúncio
          titulo_anuncio: unifiedData.titulo_anuncio ?? (primeiroItem.title || ''),
          categoria_ml: unifiedData.categoria_ml ?? (primeiroItem.category_id || ''),
          condicao: unifiedData.condicao ?? (primeiroItem.condition || ''),
          garantia: unifiedData.garantia ?? (primeiroItem.warranty || ''),
          tipo_listagem: unifiedData.tipo_listagem ?? (orderItems[0]?.listing_type_id || ''),
          atributos_variacao: unifiedData.atributos_variacao ?? atributosVariacaoTexto,
          // Dados de Envio Detalhados
          forma_entrega: unifiedData.forma_entrega ?? (raw.shipping?.shipping_method || raw.shipping?.shipping_mode || 'Não informado'),
          preferencia_entrega: unifiedData.preferencia_entrega ?? (raw.shipping?.receiver_address?.delivery_preference || ''),
          endereco_completo: unifiedData.endereco_completo ?? enderecoCompleto,
          cep: unifiedData.cep ?? (raw.shipping?.receiver_address?.zip_code || ''),
          comentario_endereco: unifiedData.comentario_endereco ?? (raw.shipping?.receiver_address?.comment || ''),
          nome_destinatario: unifiedData.nome_destinatario ?? (raw.shipping?.receiver_address?.receiver_name || ''),
        };
        
        // Usar dados do unified primeiro, com fallback para raw
        const processedOrder = {
          id: computedUnified.id || `ml_${raw.id}`,
          numero: computedUnified.numero || `ML-${raw.id}`,
          nome_cliente: computedUnified.nome_cliente || raw.buyer?.nickname || `Cliente ML ${raw.buyer?.id}`,
          cpf_cnpj: computedUnified.cpf_cnpj || null,
          data_pedido: computedUnified.data_pedido || raw.date_created?.split('T')[0],
          data_prevista: computedUnified.data_prevista || raw.date_closed?.split('T')[0],
          situacao: computedUnified.situacao || raw.status,
          valor_total: computedUnified.valor_total || raw.total_amount || 0,
          valor_frete: computedUnified.valor_frete || shippingCost || 0,
          valor_desconto: computedUnified.valor_desconto || 0,
          numero_ecommerce: computedUnified.numero_ecommerce || String(raw.id),
          numero_venda: computedUnified.numero_venda || String(raw.id),
          empresa: computedUnified.empresa || 'mercadolivre',
          cidade: computedUnified.cidade || raw.shipping?.receiver_address?.city?.name || null,
          uf: computedUnified.uf || raw.shipping?.receiver_address?.state?.name || null,
          codigo_rastreamento: computedUnified.codigo_rastreamento || raw.shipping?.tracking_number || null,
          url_rastreamento: computedUnified.url_rastreamento || raw.shipping?.tracking_url || null,
          obs: computedUnified.obs || (skus.length > 0 ? `SKUs: ${skus.join(', ')}` : ''),
          obs_interna: computedUnified.obs_interna || `ML Order ID: ${raw.id} | Buyer ID: ${raw.buyer?.id}`,
          created_at: computedUnified.created_at || raw.date_created,
          updated_at: computedUnified.updated_at || raw.last_updated || raw.date_created,
          // Dados extras para ações de estoque
          integration_account_id: integrationAccountId,
          raw: raw,
          unified: computedUnified,
          skus: skus, // Lista de SKUs para mapeamento
          quantidade_itens: computedUnified.quantidade_itens || orderItems.reduce((total: number, item: any) => total + (item.quantity || 0), 0),
          status_original: computedUnified.status_original || raw.status,
          status_shipping: computedUnified.status_shipping || raw.shipping?.status,
        };
        
        console.log(`📦 Processed Order ${index}:`, processedOrder);
        return processedOrder;
      });

      setOrders(processedOrders);
      setTotal(data.paging?.total || data.count || processedOrders.length);
      
      // Verificar mapeamentos automaticamente
      await verificarMapeamentos(processedOrders);
    } catch (err: any) {
      const msg = err?.message || String(err);
      const isSecretsMissing = msg.includes('404') || msg.toLowerCase().includes('segredo') || (err?.status === 404);
      if (isSecretsMissing && accounts.length > 1) {
        for (const acc of accounts.filter(a => a.id !== integrationAccountId)) {
          const ok = await testAccount(acc.id);
          if (ok) {
            setIntegrationAccountId(acc.id);
            return; // vai disparar novo loadOrders pelo useEffect
          }
        }
      }
      setError(`Erro ao carregar pedidos: ${msg}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Verificar mapeamentos De-Para
  const verificarMapeamentos = async (ordersToCheck?: Order[]) => {
    const ordersList = ordersToCheck || orders;
    if (ordersList.length === 0) return;

    try {
      // Extrair todos os SKUs únicos dos pedidos
      const allSkus = new Set<string>();
      ordersList.forEach(order => {
        if (order.skus) {
          order.skus.forEach((sku: string) => allSkus.add(sku.trim()));
        }
        // Também incluir número do pedido como fallback
        allSkus.add(order.numero);
      });

      const skuArray = Array.from(allSkus).filter(Boolean);
      const verificacoes = await MapeamentoService.verificarMapeamentos(skuArray);

      // Criar mapa de mapeamentos
      const mapeamentosMap = new Map();
      verificacoes.forEach(verif => {
        mapeamentosMap.set(verif.skuPedido, verif);
      });

      setMapeamentos(mapeamentosMap);
    } catch (error) {
      console.error('Erro ao verificar mapeamentos:', error);
    }
  };

  // Verificar se pedido tem mapeamento
  const pedidoTemMapeamento = (order: Order): boolean => {
    if (order.skus && order.skus.length > 0) {
      return order.skus.some((sku: string) => mapeamentos.get(sku.trim())?.temMapeamento);
    }
    return mapeamentos.get(order.numero)?.temMapeamento || false;
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  const getSituacaoColor = (situacao: string) => {
    switch (situacao?.toLowerCase()) {
      case 'entregue': case 'delivered': return 'bg-green-100 text-green-800';
      case 'pago': case 'paid': return 'bg-blue-100 text-blue-800';
      case 'cancelado': case 'cancelled': return 'bg-red-100 text-red-800';
      case 'enviado': case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'confirmado': case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Estatísticas de mapeamento
  const ordersComMapeamento = orders.filter(pedidoTemMapeamento).length;
  const ordersSemMapeamento = orders.length - ordersComMapeamento;

  // Converter pedidos selecionados para formato Pedido
  const pedidosSelecionados: Pedido[] = Array.from(selectedOrders)
    .map(id => orders.find(o => o.id === id))
    .filter(Boolean)
    .map(order => ({
      id: order!.id,
      numero: order!.numero,
      nome_cliente: order!.nome_cliente,
      cpf_cnpj: order!.cpf_cnpj,
      data_pedido: order!.data_pedido,
      situacao: order!.situacao,
      valor_total: order!.valor_total,
      valor_frete: order!.valor_frete,
      valor_desconto: 0,
      numero_ecommerce: order!.numero,
      numero_venda: order!.numero,
      empresa: 'MercadoLivre',
      cidade: order!.cidade,
      uf: order!.uf,
      obs: order!.obs,
      codigo_rastreamento: order!.codigo_rastreamento,
      integration_account_id: order!.integration_account_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Pedido));

  if (!accounts.length) {
    return (
      <div className={`p-6 ${className}`}>
        <h1 className="text-2xl font-bold mb-4">Pedidos</h1>
        <Card className="p-6 text-center">
          <div className="text-gray-500 mb-2">Nenhuma conta do Mercado Livre conectada</div>
          <Button onClick={() => window.location.href = '/configuracoes/integracoes'}>
            Conectar Mercado Livre
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className="flex gap-2">
          <select 
            value={integrationAccountId} 
            onChange={(e) => setIntegrationAccountId(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <Button onClick={loadOrders} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <PedidosFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1); // Reset para primeira página
        }}
        onClearFilters={() => {
          setFilters({});
          setCurrentPage(1);
        }}
      />

      {/* Stats Avançadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total de Pedidos</div>
          <div className="text-2xl font-bold">{total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Com Mapeamento
          </div>
          <div className="text-2xl font-bold text-green-600">{ordersComMapeamento}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Sem Mapeamento
          </div>
          <div className="text-2xl font-bold text-orange-600">{ordersSemMapeamento}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Selecionados</div>
          <div className="text-2xl font-bold text-blue-600">{selectedOrders.size}</div>
        </Card>
      </div>

      {/* Actions Avançadas */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => verificarMapeamentos()}>
            <Filter className="h-4 w-4 mr-2" />
            Verificar Mapeamentos
          </Button>
          
          {selectedOrders.size > 0 && (
            <BaixaEstoqueModal
              pedidos={pedidosSelecionados}
              trigger={
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Baixar Estoque ({selectedOrders.size})
                </Button>
              }
            />
          )}
          
          {selectedOrders.size > 0 && (
            <Button variant="outline" onClick={() => setSelectedOrders(new Set())}>
              Limpar Seleção
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Seletor de Colunas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Colunas ({visibleColumns.size})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 z-50 bg-white border shadow-lg" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Selecionar Colunas</h4>
                  <Button variant="ghost" size="sm" onClick={resetToDefault}>
                    Padrão
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {allColumns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.key}
                        checked={visibleColumns.has(column.key)}
                        onCheckedChange={() => toggleColumn(column.key)}
                      />
                      <label 
                        htmlFor={column.key} 
                        className={`text-sm cursor-pointer ${
                          column.default ? 'font-medium text-blue-600' : ''
                        }`}
                      >
                        {column.label}
                        {column.default && ' (Padrão)'}
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Colunas em azul são padrão e sempre recomendadas
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="text-sm text-muted-foreground">
            Fonte: Unified Orders (ML API /orders/search)
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-red-800">{error}</div>
          <Button variant="outline" onClick={loadOrders} className="mt-2">
            Tentar Novamente
          </Button>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div>Carregando pedidos...</div>
        </Card>
      )}

      {/* Orders Table */}
      {!loading && orders.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-2 text-left">
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {allColumns.map(column => 
                    visibleColumns.has(column.key) && (
                      <th key={column.key} className="p-2 text-left">
                        {column.label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const temMapeamento = pedidoTemMapeamento(order);
                  
                  const renderCell = (columnKey: string) => {
                    switch (columnKey) {
                      case 'id_unico':
                        return (
                          <td key={columnKey} className="p-2">
                            <div className="font-medium">
                              {order.skus && order.skus.length > 0 ? 
                                `${order.skus[0]}-${order.numero_venda}` : 
                                `SKU-${order.numero_venda}`
                              }
                            </div>
                          </td>
                        );
                      case 'cliente':
                        return (
                          <td key={columnKey} className="p-2 max-w-32">
                            <div className="truncate" title={order.nome_cliente}>
                              {order.nome_cliente || '—'}
                            </div>
                          </td>
                        );
                      case 'data_pedido':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.data_pedido ? formatDate(order.data_pedido) : '—'}
                          </td>
                        );
                      case 'uf':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.uf || '—'}
                          </td>
                        );
                       case 'status':
                         return (
                           <td key={columnKey} className="p-2">
                             <Badge className={getSituacaoColor(order.situacao)}>
                               {simplificarStatus(order.situacao)}
                             </Badge>
                           </td>
                         );
                      case 'forma_entrega':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.unified?.forma_entrega || '—'}
                          </td>
                        );
                      case 'skus_produtos':
                        return (
                          <td key={columnKey} className="p-2 max-w-40">
                            {order.skus && order.skus.length > 0 ? (
                              <div className="text-xs">
                                {order.skus.slice(0, 2).map((sku, idx) => (
                                  <div key={idx} className="truncate" title={sku}>
                                    {sku}
                                  </div>
                                ))}
                                {order.skus.length > 2 && (
                                  <div className="text-gray-500">
                                    +{order.skus.length - 2} mais
                                  </div>
                                )}
                              </div>
                            ) : '—'}
                          </td>
                        );
                        case 'num_venda':
                          return (
                            <td key={columnKey} className="p-2">
                              <div className="font-medium">{order.numero_venda || '—'}</div>
                            </td>
                          );
                        case 'unidades_vendidas':
                          return (
                            <td key={columnKey} className="p-2 text-center">
                              <div className="text-xs font-semibold">
                                {order.quantidade_itens || '—'}
                              </div>
                            </td>
                          );
                      case 'valor_total':
                        return (
                          <td key={columnKey} className="p-2">
                            {formatMoney(order.valor_total)}
                          </td>
                        );
                      case 'mapeamento':
                        return (
                          <td key={columnKey} className="p-2">
                            {temMapeamento ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Mapeado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Sem Map.
                              </Badge>
                            )}
                          </td>
                        );
                      case 'receita_produtos':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.unified?.receita_produtos !== undefined && order.unified?.receita_produtos !== null
                              ? formatMoney(order.unified.receita_produtos)
                              : '—'}
                          </td>
                        );
                      case 'tarifas_venda':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.unified?.tarifas_venda !== undefined && order.unified?.tarifas_venda !== null
                              ? formatMoney(order.unified.tarifas_venda)
                              : '—'}
                          </td>
                        );
                      case 'impostos':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.unified?.impostos !== undefined && order.unified?.impostos !== null
                              ? formatMoney(order.unified.impostos)
                              : '—'}
                          </td>
                        );
                      case 'receita_envio':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.unified?.receita_envio !== undefined && order.unified?.receita_envio !== null
                              ? formatMoney(order.unified.receita_envio)
                              : '—'}
                          </td>
                        );
                      case 'valor_pago_total':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.unified?.valor_pago_total !== undefined && order.unified?.valor_pago_total !== null
                              ? formatMoney(order.unified.valor_pago_total)
                              : '—'}
                          </td>
                        );
                      case 'titulo_anuncio':
                        return (
                          <td key={columnKey} className="p-2 max-w-48">
                            <div className="text-xs truncate" title={order.unified?.titulo_anuncio}>
                              {order.unified?.titulo_anuncio || '—'}
                            </div>
                          </td>
                        );
                      case 'categoria_ml':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.unified?.categoria_ml || '—'}
                          </td>
                        );
                      case 'condicao':
                        return (
                          <td key={columnKey} className="p-2">
                            <Badge variant="outline" className={
                              order.unified?.condicao === 'new' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }>
                              {order.unified?.condicao === 'new' ? 'Novo' : order.unified?.condicao === 'used' ? 'Usado' : order.unified?.condicao || '—'}
                            </Badge>
                          </td>
                        );
                      case 'garantia':
                        return (
                          <td key={columnKey} className="p-2 max-w-32">
                            <div className="text-xs truncate" title={order.unified?.garantia}>
                              {order.unified?.garantia || '—'}
                            </div>
                          </td>
                        );
                      case 'tipo_listagem':
                        return (
                          <td key={columnKey} className="p-2">
                            <Badge variant="outline" className={
                              order.unified?.tipo_listagem?.includes('gold') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }>
                              {order.unified?.tipo_listagem?.replace('_', ' ').toUpperCase() || '—'}
                            </Badge>
                          </td>
                        );
                      case 'atributos_variacao':
                        return (
                          <td key={columnKey} className="p-2 max-w-40">
                            <div className="text-xs truncate" title={order.unified?.atributos_variacao}>
                              {order.unified?.atributos_variacao || '—'}
                            </div>
                          </td>
                        );
                      case 'metodo_rastreamento':
                        return (
                          <td key={columnKey} className="p-2">
                            <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                              {order.unified?.tracking_method || '—'}
                            </Badge>
                          </td>
                        );
                      case 'substatus':
                        return (
                          <td key={columnKey} className="p-2">
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              {order.unified?.substatus || '—'}
                            </Badge>
                          </td>
                        );
                      case 'modo_logistico':
                        return (
                          <td key={columnKey} className="p-2">
                            <Badge variant="outline" className="bg-cyan-100 text-cyan-800">
                              {order.unified?.logistic_mode || '—'}
                            </Badge>
                          </td>
                        );
                      case 'cidade':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.unified?.cidade ?? order.cidade ?? '—'}
                          </td>
                        );
                      case 'preferencia_entrega':
                        return (
                          <td key={columnKey} className="p-2">
                            <Badge variant="outline" className={
                              order.unified?.preferencia_entrega === 'residential' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }>
                              {order.unified?.preferencia_entrega === 'residential' ? 'Residencial' : 
                               order.unified?.preferencia_entrega === 'business' ? 'Comercial' : 
                               order.unified?.preferencia_entrega || '—'}
                            </Badge>
                          </td>
                        );
                      case 'endereco_completo':
                        return (
                          <td key={columnKey} className="p-2 max-w-48">
                            <div className="text-xs truncate" title={order.unified?.endereco_completo}>
                              {order.unified?.endereco_completo || '—'}
                            </div>
                          </td>
                        );
                      case 'cep':
                        return (
                          <td key={columnKey} className="p-2">
                            {order.unified?.cep || '—'}
                          </td>
                        );
                      case 'comentario_endereco':
                        return (
                          <td key={columnKey} className="p-2 max-w-32">
                            <div className="text-xs truncate" title={order.unified?.comentario_endereco}>
                              {order.unified?.comentario_endereco || '—'}
                            </div>
                          </td>
                        );
                       case 'nome_destinatario':
                         return (
                           <td key={columnKey} className="p-2 max-w-32">
                             <div className="text-xs truncate" title={order.unified?.nome_destinatario}>
                               {order.unified?.nome_destinatario || '—'}
                             </div>
                           </td>
                         );
                       
                       // Colunas de mapeamento
                       case 'sku_estoque':
                         return (
                           <td key={columnKey} className="p-2">
                             <div className="text-xs font-mono">
                               {mappingData.get(order.id)?.skuEstoque || '—'}
                             </div>
                           </td>
                         );
                       
                       case 'sku_kit':
                         return (
                           <td key={columnKey} className="p-2">
                             <div className="text-xs font-mono">
                               {mappingData.get(order.id)?.skuKit || '—'}
                             </div>
                           </td>
                         );
                       
                       case 'qtd_kit':
                         return (
                           <td key={columnKey} className="p-2 text-center">
                             <div className="text-xs font-semibold">
                               {mappingData.get(order.id)?.qtdKit || '—'}
                             </div>
                           </td>
                         );
                       
                       case 'total_itens':
                         return (
                           <td key={columnKey} className="p-2 text-center">
                             <div className="text-xs font-semibold">
                               {mappingData.get(order.id)?.totalItens || '—'}
                             </div>
                           </td>
                         );
                       
                       case 'status_baixa':
                         return (
                           <td key={columnKey} className="p-2">
                             {renderStatusBaixa(order.id)}
                           </td>
                         );
                       
                       default:
                         return null;
                    }
                  };

                  return (
                    <tr 
                      key={order.id} 
                      className={`border-b hover:bg-gray-50 text-xs ${
                        temMapeamento ? 'border-l-4 border-l-green-500 bg-green-50' : 'border-l-4 border-l-orange-500 bg-orange-50'
                      }`}
                    >
                      <td className="p-2">
                        <input 
                          type="checkbox" 
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      
                      {allColumns.map(column => 
                        visibleColumns.has(column.key) && renderCell(column.key)
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, total)} de {total}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && !error && (
        <Card className="p-6 text-center">
          <div className="text-gray-500 mb-2">Nenhum pedido encontrado</div>
          <Button onClick={loadOrders}>Recarregar</Button>
        </Card>
      )}
    </div>
  );
}