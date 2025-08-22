import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Package, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Filter } from 'lucide-react';
import { BaixaEstoqueModal } from './BaixaEstoqueModal';
import { PedidosFilters, PedidosFiltersState } from './PedidosFilters';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { Pedido } from '@/types/pedido';

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

  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);

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
      if (filters.dataInicio) apiParams.date_from = filters.dataInicio.toISOString().split('T')[0];
      if (filters.dataFim) apiParams.date_to = filters.dataFim.toISOString().split('T')[0];

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
        const skus = orderItems.map((item: any) => 
          item.item?.seller_sku || item.item?.seller_custom_field || item.item?.title?.substring(0, 30)
        ).filter(Boolean);
        
        // Usar dados do unified primeiro, fallback para raw
        const processedOrder = {
          id: unifiedData.id || `ml_${raw.id}`,
          numero: unifiedData.numero || `ML-${raw.id}`,
          nome_cliente: unifiedData.nome_cliente || raw.buyer?.nickname || `Cliente ML ${raw.buyer?.id}`,
          cpf_cnpj: unifiedData.cpf_cnpj || null,
          data_pedido: unifiedData.data_pedido || raw.date_created?.split('T')[0],
          data_prevista: unifiedData.data_prevista || raw.date_closed?.split('T')[0],
          situacao: unifiedData.situacao || raw.status,
          valor_total: unifiedData.valor_total || raw.total_amount || 0,
          valor_frete: unifiedData.valor_frete || raw.payments?.[0]?.shipping_cost || 0,
          valor_desconto: unifiedData.valor_desconto || 0,
          numero_ecommerce: unifiedData.numero_ecommerce || String(raw.id),
          numero_venda: unifiedData.numero_venda || String(raw.id),
          empresa: unifiedData.empresa || 'mercadolivre',
          cidade: unifiedData.cidade || null,
          uf: unifiedData.uf || null,
          codigo_rastreamento: unifiedData.codigo_rastreamento || null,
          url_rastreamento: unifiedData.url_rastreamento || null,
          obs: unifiedData.obs || (skus.length > 0 ? `SKUs: ${skus.join(', ')}` : ''),
          obs_interna: unifiedData.obs_interna || `ML Order ID: ${raw.id} | Buyer ID: ${raw.buyer?.id}`,
          created_at: unifiedData.created_at || raw.date_created,
          updated_at: unifiedData.updated_at || raw.last_updated || raw.date_created,
          // Dados extras para ações de estoque
          integration_account_id: integrationAccountId,
          raw: raw,
          unified: unifiedData,
          skus: skus, // Lista de SKUs para mapeamento
          quantidade_itens: unifiedData.quantidade_itens || orderItems.reduce((total: number, item: any) => total + (item.quantity || 0), 0),
          status_original: unifiedData.status_original || raw.status,
          status_shipping: unifiedData.status_shipping || raw.shipping?.status,
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
        
        <div className="text-sm text-muted-foreground">
          Fonte: Unified Orders (ML API /orders/search)
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
                  <th className="p-2 text-left">ID/Número</th>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">CPF/CNPJ</th>
                  <th className="p-2 text-left">Data Pedido</th>
                  <th className="p-2 text-left">Data Prevista</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Valor Total</th>
                  <th className="p-2 text-left">Valor Frete</th>
                  <th className="p-2 text-left">Valor Desconto</th>
                  <th className="p-2 text-left">Núm. E-commerce</th>
                  <th className="p-2 text-left">Núm. Venda</th>
                  <th className="p-2 text-left">Empresa</th>
                  <th className="p-2 text-left">Cidade</th>
                  <th className="p-2 text-left">UF</th>
                  <th className="p-2 text-left">Código Rastreamento</th>
                  <th className="p-2 text-left">URL Rastreamento</th>
                  <th className="p-2 text-left">Observações</th>
                  <th className="p-2 text-left">Obs. Internas</th>
                  <th className="p-2 text-left">SKUs/Produtos</th>
                  <th className="p-2 text-left">Mapeamento</th>
                  <th className="p-2 text-left">Criado em</th>
                  <th className="p-2 text-left">Atualizado em</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const temMapeamento = pedidoTemMapeamento(order);
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
                    
                    {/* ID/Número */}
                    <td className="p-2">
                      <div className="font-medium">#{order.numero}</div>
                      <div className="text-xs text-gray-500">ID: {order.id}</div>
                    </td>
                    
                    {/* Cliente */}
                    <td className="p-2 max-w-32">
                      <div className="truncate" title={order.nome_cliente}>
                        {order.nome_cliente || '—'}
                      </div>
                    </td>
                    
                    {/* CPF/CNPJ */}
                    <td className="p-2">
                      {order.cpf_cnpj ? maskCpfCnpj(order.cpf_cnpj) : '—'}
                    </td>
                    
                    {/* Data Pedido */}
                    <td className="p-2">
                      {order.data_pedido ? formatDate(order.data_pedido) : '—'}
                    </td>
                    
                    {/* Data Prevista */}
                    <td className="p-2">
                      {order.data_prevista ? formatDate(order.data_prevista) : '—'}
                    </td>
                    
                    {/* Status */}
                    <td className="p-2">
                      <Badge className={getSituacaoColor(order.situacao)}>
                        {order.situacao || '—'}
                      </Badge>
                    </td>
                    
                    {/* Valor Total */}
                    <td className="p-2">
                      {formatMoney(order.valor_total)}
                    </td>
                    
                    {/* Valor Frete */}
                    <td className="p-2">
                      {order.valor_frete > 0 ? formatMoney(order.valor_frete) : '—'}
                    </td>
                    
                    {/* Valor Desconto */}
                    <td className="p-2">
                      {order.valor_desconto > 0 ? formatMoney(order.valor_desconto) : '—'}
                    </td>
                    
                    {/* Número E-commerce */}
                    <td className="p-2">
                      {order.numero_ecommerce || '—'}
                    </td>
                    
                    {/* Número Venda */}
                    <td className="p-2">
                      {order.numero_venda || '—'}
                    </td>
                    
                    {/* Empresa */}
                    <td className="p-2">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {order.empresa || 'ML'}
                      </Badge>
                    </td>
                    
                    {/* Cidade */}
                    <td className="p-2">
                      {order.cidade || '—'}
                    </td>
                    
                    {/* UF */}
                    <td className="p-2">
                      {order.uf || '—'}
                    </td>
                    
                    {/* Código Rastreamento */}
                    <td className="p-2">
                      {order.codigo_rastreamento || '—'}
                    </td>
                    
                    {/* URL Rastreamento */}
                    <td className="p-2">
                      {order.url_rastreamento ? (
                        <a 
                          href={order.url_rastreamento} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Rastrear
                        </a>
                      ) : '—'}
                    </td>
                    
                    {/* Observações */}
                    <td className="p-2 max-w-32">
                      <div className="text-xs truncate" title={order.obs}>
                        {order.obs || '—'}
                      </div>
                    </td>
                    
                    {/* Obs. Internas */}
                    <td className="p-2 max-w-32">
                      <div className="text-xs truncate" title={order.obs_interna}>
                        {order.obs_interna || '—'}
                      </div>
                    </td>
                    
                    {/* SKUs/Produtos */}
                    <td className="p-2 max-w-40">
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
            
            {/* Quantidade de Itens */}
            <td className="text-xs p-2 border">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span className="font-medium">{order.quantidade_itens || 'N/A'}</span>
              </div>
            </td>

            {/* Status Detalhado */}
            <td className="text-xs p-2 border">
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {order.situacao || 'N/A'}
              </span>
            </td>

            {/* Status Envio */}
            <td className="text-xs p-2 border">
              {order.status_shipping ? (
                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  {order.status_shipping}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </td>

            {/* Mapeamento */}
                    <td className="p-2">
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
                    
                    {/* Criado em */}
                    <td className="p-2">
                      {order.created_at ? formatDate(order.created_at) : '—'}
                    </td>
                    
                    {/* Atualizado em */}
                    <td className="p-2">
                      {order.updated_at ? formatDate(order.updated_at) : '—'}
                    </td>
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