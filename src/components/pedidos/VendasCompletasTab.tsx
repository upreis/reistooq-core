import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, RefreshCw, Download, Database, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { formatMoney, formatDate } from '@/lib/format';

interface VendasCompletasTabProps {
  accounts: any[];
}

interface CompleteSale {
  id: number;
  order_id: string;
  order_date_created: string;
  order_status: string;
  order_total_amount: number;
  item_title: string;
  buyer_nickname: string;
  seller_nickname: string;
  payment_status: string;
  shipping_status: string;
  data_completeness_score: number;
  last_sync: string;
  endpoints_accessed: any; // JSONB pode ser string[] ou string
  sync_duration_ms: number;
  claims_count?: number;
  return_status?: string;
  feedback_buyer_rating?: string;
  feedback_seller_rating?: string;
  messages_count?: number;
}

export function VendasCompletasTab({ accounts }: VendasCompletasTabProps) {
  const [sales, setSales] = useState<CompleteSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 dias atrás
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [completenessFilter, setCompletenessFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar vendas completas existentes
  useEffect(() => {
    loadCompleteSales();
  }, [selectedAccount, statusFilter, completenessFilter, searchTerm]);

  const loadCompleteSales = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('vendas_completas')
        .select('*')
        .order('order_date_created', { ascending: false })
        .limit(100);

      if (selectedAccount) {
        // Buscar pelo account_identifier ou algum campo relacionado
        // Como não temos um campo direto, vamos filtrar posteriormente
      }

      if (statusFilter !== 'all') {
        query = query.eq('order_status', statusFilter);
      }

      if (completenessFilter !== 'all') {
        const minScore = completenessFilter === 'high' ? 80 : completenessFilter === 'medium' ? 50 : 0;
        const maxScore = completenessFilter === 'high' ? 100 : completenessFilter === 'medium' ? 79 : 49;
        query = query.gte('data_completeness_score', minScore).lte('data_completeness_score', maxScore);
      }

      if (searchTerm) {
        query = query.or(`order_id.ilike.%${searchTerm}%,item_title.ilike.%${searchTerm}%,buyer_nickname.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSales(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar vendas completas:', error);
      toast.error('Erro ao carregar vendas completas');
    } finally {
      setLoading(false);
    }
  };

  const syncCompleteSales = async () => {
    if (!selectedAccount) {
      toast.error('Selecione uma conta para sincronizar');
      return;
    }

    setSyncing(true);
    try {
      console.log('🚀 Iniciando sincronização de vendas completas...');
      
      const { data, error } = await supabase.functions.invoke('complete-sales', {
        body: {
          integration_account_id: selectedAccount,
          date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
          date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
          limit: 50
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.count} vendas completas sincronizadas em ${data.duration_ms}ms`);
        await loadCompleteSales(); // Recarregar dados
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar vendas completas:', error);
      toast.error('Erro ao sincronizar vendas completas: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCompletenessLabel = (score: number) => {
    if (score >= 80) return 'Alta';
    if (score >= 50) return 'Média';
    return 'Baixa';
  };

  const exportToCSV = () => {
    if (sales.length === 0) {
      toast.error('Nenhuma venda para exportar');
      return;
    }

    const headers = [
      'ID Pedido', 'Data Criação', 'Status', 'Valor Total', 'Produto',
      'Comprador', 'Vendedor', 'Status Pagamento', 'Status Envio',
      'Completude (%)', 'Última Sync', 'Endpoints Acessados', 'Tempo Sync (ms)'
    ];

    const csvContent = [
      headers.join(','),
      ...sales.map(sale => [
        sale.order_id,
        formatDate(sale.order_date_created),
        sale.order_status,
        sale.order_total_amount,
        `"${sale.item_title || ''}"`,
        sale.buyer_nickname || '',
        sale.seller_nickname || '',
        sale.payment_status || '',
        sale.shipping_status || '',
        sale.data_completeness_score,
        formatDate(sale.last_sync),
        Array.isArray(sale.endpoints_accessed) ? sale.endpoints_accessed.length : 0,
        sale.sync_duration_ms || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vendas_completas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completude Alta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sales.filter(s => s.data_completeness_score >= 80).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {sales.filter(s => s.claims_count && s.claims_count > 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {sales.filter(s => s.feedback_buyer_rating || s.feedback_seller_rating).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e ações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Vendas Completas - 25+ Endpoints ML
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar conta ML" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as contas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Data início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Data fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={completenessFilter} onValueChange={setCompletenessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Completude" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta (80%+)</SelectItem>
                <SelectItem value="medium">Média (50-79%)</SelectItem>
                <SelectItem value="low">Baixa (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Buscar por ID, produto, comprador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={syncCompleteSales}
              disabled={syncing || !selectedAccount}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Vendas Completas'}
            </Button>

            <Button 
              variant="outline"
              onClick={exportToCSV}
              disabled={sales.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de vendas completas */}
      <Card>
        <CardHeader>
          <CardTitle>
            {loading ? 'Carregando...' : `${sales.length} Vendas Completas`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando vendas completas...</span>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda completa encontrada</p>
              <p className="text-sm">Sincronize uma conta para buscar dados completos do ML</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID Pedido</th>
                    <th className="text-left p-2">Data</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Valor</th>
                    <th className="text-left p-2">Produto</th>
                    <th className="text-left p-2">Comprador</th>
                    <th className="text-left p-2">Pagamento</th>
                    <th className="text-left p-2">Envio</th>
                    <th className="text-left p-2">Completude</th>
                    <th className="text-left p-2">Extras</th>
                    <th className="text-left p-2">Última Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <code className="text-xs bg-muted px-1 rounded">
                          {sale.order_id}
                        </code>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          {formatDate(sale.order_date_created)}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {sale.order_status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="font-medium">
                          {formatMoney(sale.order_total_amount)}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="max-w-48 truncate text-sm">
                          {sale.item_title}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          {sale.buyer_nickname}
                        </div>
                      </td>
                      <td className="p-2">
                        {sale.payment_status && (
                          <Badge 
                            variant="outline"
                            className={
                              sale.payment_status === 'approved' ? 'text-green-600 border-green-600' :
                              sale.payment_status === 'pending' ? 'text-yellow-600 border-yellow-600' :
                              'text-red-600 border-red-600'
                            }
                          >
                            {sale.payment_status}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        {sale.shipping_status && (
                          <Badge variant="outline">
                            {sale.shipping_status}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={getCompletenessColor(sale.data_completeness_score)}
                          >
                            {sale.data_completeness_score}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getCompletenessLabel(sale.data_completeness_score)}
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {sale.claims_count && sale.claims_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Claims: {sale.claims_count}
                            </Badge>
                          )}
                          {sale.return_status && (
                            <Badge variant="outline" className="text-xs">
                              Return
                            </Badge>
                          )}
                          {(sale.feedback_buyer_rating || sale.feedback_seller_rating) && (
                            <Badge variant="outline" className="text-xs">
                              ⭐ FB
                            </Badge>
                          )}
                          {sale.messages_count && sale.messages_count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              💬 {sale.messages_count}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-xs text-muted-foreground">
                          <div>{formatDate(sale.last_sync)}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {sale.sync_duration_ms}ms
                          </div>
                          <div>
                            🔗 {Array.isArray(sale.endpoints_accessed) ? sale.endpoints_accessed.length : 0} endpoints
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}