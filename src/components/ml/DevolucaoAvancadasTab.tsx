import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Eye, Filter, Download, RefreshCw, 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Clock, AlertTriangle, MessageSquare, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface DevolucaoData {
  id?: number;
  order_id: string;
  claim_id?: string;
  data_criacao: string;
  status_devolucao?: string;
  valor_retido?: number;
  produto_titulo?: string;
  sku?: string;
  quantidade?: number;
  dados_order?: any;
  dados_claim?: any;
  dados_mensagens?: any;
  dados_return?: any;
  integration_account_id?: string;
  created_at?: string;
  processado_em?: string;
  organization_id?: string;
}

export default function DevolucaoAvancadasTab() {
  const [devolucoes, setDevolucoes] = useState<DevolucaoData[]>([]);
  const [filteredDevolucoes, setFilteredDevolucoes] = useState<DevolucaoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    status: '',
    valorMin: '',
    valorMax: '',
    comprador: '',
    produto: ''
  });

  // Buscar contas ML ativas
  const { data: mlAccounts } = useQuery({
    queryKey: ["ml-accounts-devolucoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_accounts")
        .select("id, name, account_identifier")
        .eq("provider", "mercadolivre")
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  // Carregar devoluções existentes
  const { data: existingDevolucoes, refetch: refetchDevolucoes } = useQuery({
    queryKey: ["devolucoes-avancadas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      return data as DevolucaoData[];
    },
  });

  useEffect(() => {
    if (existingDevolucoes) {
      setDevolucoes(existingDevolucoes);
    }
  }, [existingDevolucoes]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, devolucoes]);

  // Função principal para sincronizar devoluções
  const sincronizarDevolucoes = async () => {
    if (!mlAccounts || mlAccounts.length === 0) {
      toast.error('Nenhuma conta ML encontrada');
      return;
    }

    setLoading(true);
    
    try {
      let totalProcessadas = 0;

      for (const account of mlAccounts) {
        console.log(`🔍 Processando conta: ${account.name}`);
        
        try {
          // 1. Buscar access token diretamente do banco
          const { data: secrets, error: secretError } = await supabase
            .from('integration_secrets')
            .select('access_token')
            .eq('integration_account_id', account.id)
            .eq('provider', 'mercadolivre')
            .single();

          if (secretError || !secrets?.access_token) {
            console.warn(`⚠️ Token não encontrado para conta ${account.name}`);
            toast.error(`Token não encontrado para ${account.name}`);
            continue;
          }

          const accessToken = secrets.access_token;
          console.log(`✅ Token encontrado para ${account.name}`);

          // 2. Testar token e obter seller_id
          const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (!userResponse.ok) {
            console.error(`❌ Token inválido para ${account.name}: ${userResponse.status}`);
            toast.error(`Token expirado para ${account.name} - Reconecte a conta`);
            continue;
          }

          const userData = await userResponse.json();
          const sellerId = userData.id;
          console.log(`👤 Seller ID: ${sellerId} (${userData.nickname})`);

          // 3. Buscar claims via post-purchase
          console.log(`🔍 Buscando claims...`);
          
          const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}&limit=50`;
          
          const claimsResponse = await fetch(claimsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          let allClaims = [];
          
          if (claimsResponse.ok) {
            const claimsData = await claimsResponse.json();
            allClaims = claimsData.results || [];
            console.log(`📋 Claims encontradas: ${allClaims.length}`);
          } else {
            console.warn(`⚠️ Falha na busca de claims: ${claimsResponse.status}`);
          }

          // 4. Buscar orders canceladas (últimos 15 dias)
          console.log(`🔍 Buscando orders canceladas...`);
          
          const dateFrom = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=cancelled&order.date_created.from=${dateFrom}&limit=20`;
          
          const ordersResponse = await fetch(ordersUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            const cancelledOrders = ordersData.results || [];
            console.log(`🚫 Orders canceladas: ${cancelledOrders.length}`);

            // Adicionar como claims sintéticas
            for (const order of cancelledOrders) {
              allClaims.push({
                id: `cancelled_${order.id}`,
                resource_id: order.id,
                type: 'cancellation',
                status: 'closed',
                reason: order.cancel_detail || 'Pedido cancelado',
                date_created: order.date_created,
                order_data: order
              });
            }
          } else {
            console.warn(`⚠️ Falha na busca de orders: ${ordersResponse.status}`);
          }

          console.log(`📊 Total para processar: ${allClaims.length}`);

          // 5. Processar cada claim
          for (const [index, claim] of allClaims.entries()) {
            try {
              console.log(`📦 ${index + 1}/${allClaims.length}: Order ${claim.resource_id}`);

              // Buscar dados da order
              const orderResponse = await fetch(`https://api.mercadolibre.com/orders/${claim.resource_id}`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });

              if (!orderResponse.ok) {
                console.warn(`⚠️ Erro na order ${claim.resource_id}: ${orderResponse.status}`);
                continue;
              }

              const orderData = await orderResponse.json();

              // Montar dados da devolução
              const devolucaoData = {
                order_id: orderData.id.toString(),
                claim_id: claim.id.startsWith('cancelled_') ? null : claim.id,
                data_criacao: claim.date_created,
                status_devolucao: claim.status || 'unknown',
                valor_retido: orderData.total_amount || 0,
                produto_titulo: orderData.order_items?.[0]?.item?.title || 'Produto não identificado',
                sku: orderData.order_items?.[0]?.item?.seller_sku || '',
                quantidade: orderData.order_items?.[0]?.quantity || 1,
                dados_order: orderData,
                dados_claim: claim,
                integration_account_id: account.id
              };

              // Salvar no Supabase
              const { error: insertError } = await supabase
                .from('devolucoes_avancadas')
                .upsert(devolucaoData, { onConflict: 'order_id' });

              if (insertError) {
                console.error(`❌ Erro ao salvar ${orderData.id}:`, insertError);
                if (insertError.code === '42P01') {
                  toast.error('Execute o SQL da tabela primeiro!');
                  return;
                }
              } else {
                totalProcessadas++;
                console.log(`💾 Salva: ${orderData.id}`);
              }

            } catch (claimError) {
              console.error(`❌ Erro no claim:`, claimError);
            }

            // Pausa para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 200));
          }

        } catch (accountError) {
          console.error(`❌ Erro na conta ${account.name}:`, accountError);
          toast.error(`Erro na conta ${account.name}`);
        }
      }

      // Recarregar dados
      await refetchDevolucoes();
      
      if (totalProcessadas > 0) {
        toast.success(`✅ ${totalProcessadas} devoluções sincronizadas!`);
      } else {
        toast.warning('Nenhuma devolução encontrada');
      }

    } catch (error) {
      console.error('❌ Erro geral:', error);
      toast.error('Erro na sincronização');
    } finally {
      setLoading(false);
    }
  };


  // Aplicar filtros
  const aplicarFiltros = () => {
    let filtered = [...devolucoes];

    if (filtros.dataInicio) {
      filtered = filtered.filter(d => new Date(d.data_criacao) >= new Date(filtros.dataInicio));
    }
    
    if (filtros.dataFim) {
      filtered = filtered.filter(d => new Date(d.data_criacao) <= new Date(filtros.dataFim));
    }
    
    if (filtros.status) {
      filtered = filtered.filter(d => d.status_devolucao && d.status_devolucao.includes(filtros.status));
    }
    
    if (filtros.valorMin) {
      filtered = filtered.filter(d => (d.valor_retido || 0) >= parseFloat(filtros.valorMin));
    }
    
    if (filtros.valorMax) {
      filtered = filtered.filter(d => (d.valor_retido || 0) <= parseFloat(filtros.valorMax));
    }
    
    if (filtros.comprador) {
      filtered = filtered.filter(d => 
        d.dados_order?.buyer?.nickname && d.dados_order.buyer.nickname.toLowerCase().includes(filtros.comprador.toLowerCase())
      );
    }
    
    if (filtros.produto) {
      filtered = filtered.filter(d => 
        d.produto_titulo && d.produto_titulo.toLowerCase().includes(filtros.produto.toLowerCase())
      );
    }

    setFilteredDevolucoes(filtered);
  };

  // Funções de formatação
  const getStatusColor = (status: string) => {
    const colors = {
      'opened': 'bg-yellow-100 text-yellow-800',
      'closed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'in_process': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  // Calcular métricas
  const metricas = {
    total: filteredDevolucoes.length,
    abertas: filteredDevolucoes.filter(d => d.status_devolucao === 'opened').length,
    fechadas: filteredDevolucoes.filter(d => ['closed', 'completed'].includes(d.status_devolucao || '')).length,
    valorTotal: filteredDevolucoes.reduce((sum, d) => sum + (d.valor_retido || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Devoluções Avançadas</h2>
          <p className="text-muted-foreground">
            Sistema completo de gestão de devoluções e reclamações ML
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={sincronizarDevolucoes} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {loading ? 'Sincronizando...' : 'Sincronizar ML'}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Dashboard de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Devoluções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Em Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metricas.abertas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Fechadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metricas.fechadas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metricas.valorTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="date"
              placeholder="Data início"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
            />
            <Input
              type="date"
              placeholder="Data fim"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
            />
            <Select value={filtros.status} onValueChange={(value) => setFiltros({...filtros, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="opened">Abertas</SelectItem>
                <SelectItem value="closed">Fechadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Buscar comprador..."
              value={filtros.comprador}
              onChange={(e) => setFiltros({...filtros, comprador: e.target.value})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Devoluções */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Devoluções ({filteredDevolucoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevolucoes.map((devolucao) => (
                  <TableRow key={`${devolucao.order_id}-${devolucao.id}`}>
                    <TableCell className="font-mono">{devolucao.order_id}</TableCell>
                    <TableCell>{formatDate(devolucao.data_criacao)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(devolucao.status_devolucao || 'unknown')}>
                        {devolucao.status_devolucao || 'Desconhecido'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(devolucao.valor_retido || 0)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {devolucao.produto_titulo || 'Produto não identificado'}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {devolucao.dados_claim?.reason || '-'}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Devolução - {devolucao.order_id}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[70vh]">
                            <Tabs defaultValue="geral" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="geral">Geral</TabsTrigger>
                                <TabsTrigger value="order">Order</TabsTrigger>
                                <TabsTrigger value="claim">Claim</TabsTrigger>
                                <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
                              </TabsList>
                              <TabsContent value="geral" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Order ID:</label>
                                    <p className="font-mono">{devolucao.order_id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status:</label>
                                    <p>
                                      <Badge className={getStatusColor(devolucao.status_devolucao || 'unknown')}>
                                        {devolucao.status_devolucao || 'Desconhecido'}
                                      </Badge>
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Data:</label>
                                    <p>{formatDate(devolucao.data_criacao)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Valor:</label>
                                    <p>{formatCurrency(devolucao.valor_retido || 0)}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium">Produto:</label>
                                    <p>{devolucao.produto_titulo || 'Produto não identificado'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium">Motivo:</label>
                                    <p>{devolucao.dados_claim?.reason || 'Não informado'}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="order">
                                <ScrollArea className="h-[400px]">
                                  <pre className="text-xs bg-muted p-4 rounded">
                                    {JSON.stringify(devolucao.dados_order, null, 2)}
                                  </pre>
                                </ScrollArea>
                              </TabsContent>
                              <TabsContent value="claim">
                                <ScrollArea className="h-[400px]">
                                  <pre className="text-xs bg-muted p-4 rounded">
                                    {JSON.stringify(devolucao.dados_claim, null, 2)}
                                  </pre>
                                </ScrollArea>
                              </TabsContent>
                              <TabsContent value="mensagens">
                                <ScrollArea className="h-[400px]">
                                  {devolucao.dados_mensagens ? (
                                    <pre className="text-xs bg-muted p-4 rounded">
                                      {JSON.stringify(devolucao.dados_mensagens, null, 2)}
                                    </pre>
                                  ) : (
                                    <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
                                  )}
                                </ScrollArea>
                              </TabsContent>
                            </Tabs>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredDevolucoes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma devolução encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Sincronizar ML" para buscar devoluções das suas contas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}