import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Package, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

type Order = {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string;
  data_pedido: string;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  cidade: string;
  uf: string;
  obs: string;
  codigo_rastreamento: string;
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

  // Carregar pedidos quando conta muda
  useEffect(() => {
    if (integrationAccountId) {
      loadOrders();
    }
  }, [integrationAccountId, currentPage]);

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
      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: {
          integration_account_id: integrationAccountId,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          enrich: true,
          include_shipping: true
        }
      });

      if (error) throw error;
      if (!data?.ok) throw new Error('Erro na resposta da API');

      // Transformar dados raw + unified em format simples
      const results = data.results || [];
      const unified = data.unified || [];
      
      const processedOrders: Order[] = results.map((raw: any, index: number) => {
        const unifiedData = unified[index] || {};
        
        return {
          id: unifiedData.id || raw.id || '',
          numero: unifiedData.numero || raw.id || '',
          nome_cliente: unifiedData.nome_cliente || raw.buyer?.nickname || '',
          cpf_cnpj: unifiedData.cpf_cnpj || '',
          data_pedido: unifiedData.data_pedido || raw.date_created || '',
          situacao: unifiedData.situacao || raw.status || '',
          valor_total: unifiedData.valor_total || raw.total_amount || 0,
          valor_frete: unifiedData.valor_frete || raw.payments?.[0]?.shipping_cost || 0,
          cidade: unifiedData.cidade || raw.shipping_details?.receiver_address?.city?.name || '',
          uf: unifiedData.uf || raw.shipping_details?.receiver_address?.state?.id || '',
          obs: unifiedData.obs || '',
          codigo_rastreamento: unifiedData.codigo_rastreamento || raw.shipping_details?.tracking_number || '',
          // Dados extras para ações de estoque
          integration_account_id: integrationAccountId,
          raw: raw,
          unified: unifiedData
        };
      });

      setOrders(processedOrders);
      setTotal(data.paging?.total || data.count || processedOrders.length);
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
      case 'entregue': return 'bg-green-100 text-green-800';
      case 'pago': return 'bg-blue-100 text-blue-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total de Pedidos</div>
          <div className="text-2xl font-bold">{total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Selecionados</div>
          <div className="text-2xl font-bold text-blue-600">{selectedOrders.size}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Página Atual</div>
          <div className="text-2xl font-bold">{currentPage} de {totalPages}</div>
        </Card>
      </div>

      {/* Actions */}
      {selectedOrders.size > 0 && (
        <Card className="p-4">
          <div className="flex gap-2">
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Baixar Estoque ({selectedOrders.size})
            </Button>
            <Button variant="outline" onClick={() => setSelectedOrders(new Set())}>
              Limpar Seleção
            </Button>
          </div>
        </Card>
      )}

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
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left">
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 text-left">Pedido</th>
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Valor</th>
                  <th className="p-3 text-left">Localização</th>
                  <th className="p-3 text-left">Itens</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <input 
                        type="checkbox" 
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-medium">#{order.numero}</div>
                      {order.codigo_rastreamento && (
                        <div className="text-xs text-gray-500">
                          Tracking: {order.codigo_rastreamento}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div>{order.nome_cliente || '—'}</div>
                      {order.cpf_cnpj && (
                        <div className="text-xs text-gray-500">
                          {maskCpfCnpj(order.cpf_cnpj)}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {order.data_pedido ? formatDate(order.data_pedido) : '—'}
                    </td>
                    <td className="p-3">
                      <Badge className={getSituacaoColor(order.situacao)}>
                        {order.situacao || '—'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div>{formatMoney(order.valor_total)}</div>
                      {order.valor_frete > 0 && (
                        <div className="text-xs text-gray-500">
                          Frete: {formatMoney(order.valor_frete)}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div>{order.cidade || '—'}</div>
                      <div className="text-xs text-gray-500">{order.uf || '—'}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm max-w-32 truncate" title={order.obs}>
                        {order.obs || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
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