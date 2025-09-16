import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, Filter, Download, Wrench, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DevolucoesMercadoLivreUnificado from '@/components/devolucoes/DevolucoesMercadoLivreUnificado';
import { toast } from "sonner";

interface MLOrder {
  id: number;
  order_id: string;
  status: string;
  date_created: string;
  total_amount: number;
  currency: string;
  buyer_id?: string;
  buyer_nickname?: string;
  item_title?: string;
  quantity: number;
  has_claims: boolean;
  claims_count: number;
  raw_data: any;
  created_at: string;
}

export default function MLOrdersCompletas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [claimsFilter, setClaimsFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<MLOrder | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Estado para engenharia reversa - Fase 1
  const [showReverseEngineering, setShowReverseEngineering] = useState(false);
  const [reverseResults, setReverseResults] = useState<any>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Estado para Fase 2 - Análise Detalhada
  const [showPhase2Modal, setShowPhase2Modal] = useState(false);
  const [phase2Results, setPhase2Results] = useState<any>(null);
  const [phase2Loading, setPhase2Loading] = useState(false);

  // Estado para Implementação Final
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [finalResults, setFinalResults] = useState<any>(null);
  const [finalLoading, setFinalLoading] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log("🔍 [MLOrdersCompletas] Página carregada");
  }, []);

  // Buscar contas ML disponíveis
  const { data: mlAccounts } = useQuery({
    queryKey: ["ml-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_accounts")
        .select("id, name, account_identifier, organization_id, is_active")
        .eq("provider", "mercadolivre")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Função para executar engenharia reversa - Fase 1
  const runReverseEngineering = async () => {
    if (!selectedAccounts.length) {
      toast.error("Selecione pelo menos uma conta ML");
      return;
    }

    setReverseLoading(true);
    try {
      console.log("🔬 Iniciando engenharia reversa - Fase 1 para contas:", selectedAccounts);
      
      const { data, error } = await supabase.functions.invoke('ml-reverse-engineering', {
        body: { account_ids: selectedAccounts }
      });

      if (error) throw error;

      setReverseResults(data);
      toast.success("Engenharia reversa (Fase 1) concluída com sucesso!");
      console.log("✅ Resultados da Fase 1:", data);
    } catch (error) {
      console.error("❌ Erro na Fase 1:", error);
      toast.error("Erro ao executar Fase 1: " + error.message);
    } finally {
      setReverseLoading(false);
    }
  };

  // Função para executar análise detalhada - Fase 2
  const runPhase2Analysis = async () => {
    if (!selectedAccounts.length) {
      toast.error("Selecione pelo menos uma conta ML");
      return;
    }

    setPhase2Loading(true);
    try {
      console.log("🔬 Iniciando análise detalhada - Fase 2 para contas:", selectedAccounts);
      
      const { data, error } = await supabase.functions.invoke('ml-reverse-engineering-phase2', {
        body: { account_ids: selectedAccounts }
      });

      if (error) throw error;

      setPhase2Results(data);
      setShowPhase2Modal(true);
      toast.success("Análise detalhada (Fase 2) concluída com sucesso!");
      console.log("✅ Resultados da Fase 2:", data);
    } catch (error) {
      console.error("❌ Erro na Fase 2:", error);
      toast.error("Erro ao executar Fase 2: " + error.message);
    } finally {
      setPhase2Loading(false);
    }
  };

  // Função para executar implementação final
  const runFinalImplementation = async () => {
    if (!selectedAccounts.length) {
      toast.error("Selecione pelo menos uma conta ML");
      return;
    }

    setFinalLoading(true);
    try {
      console.log("🚀 Iniciando implementação final para contas:", selectedAccounts);
      
      const { data, error } = await supabase.functions.invoke('ml-implementacao-final', {
        body: { account_ids: selectedAccounts }
      });

      if (error) throw error;

      setFinalResults(data);
      setShowFinalModal(true);
      toast.success("Implementação final concluída com sucesso!");
      console.log("✅ Resultados da Implementação Final:", data);
    } catch (error) {
      console.error("❌ Erro na Implementação Final:", error);
      toast.error("Erro ao executar Implementação Final: " + error.message);
    } finally {
      setFinalLoading(false);
    }
  };

  const { data: orders, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ["ml-orders-completas", searchTerm, statusFilter, claimsFilter, dateFrom, dateTo],
    queryFn: async () => {
      console.log("🔍 [MLOrdersCompletas] Buscando orders completas...");
      
      let query = supabase.from("ml_orders_completas").select("*");

      if (searchTerm) {
        query = query.or(`order_id.ilike.%${searchTerm}%,buyer_nickname.ilike.%${searchTerm}%,item_title.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (claimsFilter === "with_claims") {
        query = query.eq("has_claims", true);
      } else if (claimsFilter === "without_claims") {
        query = query.eq("has_claims", false);
      }

      if (dateFrom) {
        query = query.gte("date_created", dateFrom);
      }

      if (dateTo) {
        query = query.lte("date_created", dateTo);
      }

      const { data, error } = await query.order("date_created", { ascending: false }).limit(1000);
      
      if (error) {
        console.error("❌ [MLOrdersCompletas] Erro ao buscar orders:", error);
        throw error;
      }
      
      console.log("✅ [MLOrdersCompletas] Orders encontradas:", data?.length || 0);
      return data as MLOrder[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cancelled": return "destructive";
      case "paid": return "default";
      case "shipped": return "secondary";
      case "delivered": return "default";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "cancelled": return "Cancelada";
      case "paid": return "Paga";
      case "shipped": return "Enviada";
      case "delivered": return "Entregue";
      default: return status;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(amount || 0);
  };

  const exportToCSV = () => {
    if (!orders || orders.length === 0) return;

    const headers = [
      "Order ID",
      "Status",
      "Data Criação",
      "Data Fechamento",
      "Valor Total",
      "Valor Pago",
      "Comprador ID",
      "Comprador",
      "SKU",
      "Item",
      "Quantidade",
      "Tags",
      "Shipping ID",
      "Pack ID",
      "Tem Claims",
      "Qtd Claims"
    ];

    const csvData = orders.map(order => {
      const rawData = order.raw_data || {};
      const dateClosed = rawData.date_closed ? format(new Date(rawData.date_closed), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-";
      const paidAmount = rawData.paid_amount || 0;
      const tags = rawData.tags ? rawData.tags.join(", ") : "-";
      const shippingId = rawData.shipping?.id || "-";
      const packId = rawData.pack_id || "-";
      const sellerSku = rawData.order_items?.[0]?.item?.seller_sku || "-";
      
      return [
        order.order_id,
        getStatusLabel(order.status),
        format(new Date(order.date_created), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        dateClosed,
        formatCurrency(order.total_amount, order.currency),
        formatCurrency(paidAmount, order.currency),
        order.buyer_id || "-",
        order.buyer_nickname || "-",
        sellerSku,
        order.item_title || "-",
        order.quantity,
        tags,
        shippingId,
        packId,
        order.has_claims ? "Sim" : "Não",
        order.claims_count
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ml_orders_completas_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Debug para mostrar erros
  if (queryError) {
    console.error("❌ [MLOrdersCompletas] Erro na query:", queryError);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema ML - Mercado Livre</h1>
          <p className="text-muted-foreground">
            Sistema completo de gestão Mercado Livre
          </p>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders Completas</TabsTrigger>
          <TabsTrigger value="devolucoes">Devoluções Avançadas</TabsTrigger>
        </TabsList>

        <TabsContent value="devolucoes" className="space-y-6">
          <DevolucoesMercadoLivreUnificado />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Todas as Orders - ML</h2>
              <p className="text-muted-foreground">
                Visualização completa de todas as orders encontradas no Mercado Livre
                {dateFrom && dateTo && (
                  <span className="text-blue-600 ml-2">
                    📅 Período: {format(new Date(dateFrom), "dd/MM/yyyy")} - {format(new Date(dateTo), "dd/MM/yyyy")}
                  </span>
                )}
                {!dateFrom && !dateTo && (
                  <span className="text-orange-600 ml-2">
                    📅 Mostrando todas as datas
                  </span>
                )}
                {queryError && (
                  <span className="text-destructive ml-2">
                    ⚠️ Erro ao carregar: {queryError.message}
                  </span>
                )}
              </p>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Ferramentas de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Order ID, comprador ou item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
                <SelectItem value="shipped">Enviadas</SelectItem>
                <SelectItem value="delivered">Entregues</SelectItem>
              </SelectContent>
            </Select>

            <Select value={claimsFilter} onValueChange={setClaimsFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Claims" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="with_claims">Com Claims</SelectItem>
                <SelectItem value="without_claims">Sem Claims</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data início"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data fim"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            <Button onClick={() => refetch()} variant="outline">
              Atualizar
            </Button>

            <Dialog open={showReverseEngineering} onOpenChange={setShowReverseEngineering}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <Wrench className="h-4 w-4 mr-2" />
                  Análise API
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>🔬 Análise da API Mercado Livre</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[80vh]">
                  <div className="space-y-6 p-4">
                    {/* Seleção de contas */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Selecionar Contas ML</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {mlAccounts?.map((account) => (
                          <div key={account.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={account.id}
                              checked={selectedAccounts.includes(account.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAccounts([...selectedAccounts, account.id]);
                                } else {
                                  setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={account.id} className="text-sm font-medium">
                              {account.name} ({account.account_identifier})
                            </label>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          onClick={runReverseEngineering}
                          disabled={reverseLoading || !selectedAccounts.length}
                          className="gap-2"
                        >
                          {reverseLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          {reverseLoading ? "Executando..." : "Fase 1 - Mapear Endpoints"}
                        </Button>
                        
                        <Button 
                          onClick={runPhase2Analysis}
                          disabled={phase2Loading || !selectedAccounts.length}
                          variant="outline"
                          className="gap-2"
                        >
                          {phase2Loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          {phase2Loading ? "Analisando..." : "Fase 2 - Análise Detalhada"}
                        </Button>
                        
                        <Button 
                          onClick={runFinalImplementation}
                          disabled={finalLoading || !selectedAccounts.length}
                          className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          {finalLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wrench className="h-4 w-4" />
                          )}
                          {finalLoading ? "Implementando..." : "Implementação Final"}
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedAccounts(mlAccounts?.map(a => a.id) || []);
                          }}
                        >
                          Selecionar Todas
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setSelectedAccounts([])}
                        >
                          Limpar Seleção
                        </Button>
                      </div>
                    </div>

                    {/* Resultados da Fase 1 */}
                    {reverseResults && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">📊 Resultados da Fase 1 - Mapeamento</h3>
                        
                        {/* Estatísticas gerais */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Total Testados</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{reverseResults.total_tested}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Funcionais</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-green-600">{reverseResults.total_working}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Com Erro</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-red-600">{reverseResults.total_errors}</div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Estatísticas por categoria */}
                        {reverseResults.categories_stats && (
                          <div className="space-y-2">
                            <h4 className="font-semibold">Estatísticas por Categoria</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {reverseResults.categories_stats.map((category: any, index: number) => (
                                <Card key={index} className="p-3">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{category.category}</span>
                                    <Badge variant={category.working > 0 ? "default" : "destructive"}>
                                      {category.working}/{category.total}
                                    </Badge>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Raw results para debug */}
                        <div className="space-y-2">
                          <h4 className="font-semibold">Resposta Completa (Debug)</h4>
                          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-40">
                            {JSON.stringify(reverseResults, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Modal da Fase 2 - Análise Detalhada */}
      <Dialog open={showPhase2Modal} onOpenChange={setShowPhase2Modal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔬 Fase 2 - Análise Detalhada dos Endpoints Funcionais</DialogTitle>
          </DialogHeader>
          
          {phase2Results && (
            <div className="space-y-6">
              {/* Resumo Geral */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {phase2Results.results?.reduce((acc: any, r: any) => acc + (r.summary?.total_endpoints_analyzed || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-blue-600">Endpoints Analisados</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {phase2Results.results?.reduce((acc: any, r: any) => acc + (r.summary?.total_orders_found || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-green-600">Orders Encontrados</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {phase2Results.results?.reduce((acc: any, r: any) => acc + (r.summary?.total_claims_found || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-purple-600">Claims Encontrados</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {Math.round(phase2Results.results?.reduce((acc: any, r: any) => acc + (r.summary?.data_completeness_score || 0), 0) / (phase2Results.results?.length || 1)) || 0}%
                  </div>
                  <div className="text-sm text-yellow-600">Score Completude</div>
                </div>
              </div>

              {/* Resultados por Conta */}
              {phase2Results.results?.map((result: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Conta: {result.account_id}</h3>
                  
                  {/* Resumo da Conta */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{result.summary?.orders_endpoints || 0}</div>
                      <div className="text-sm text-gray-600">Orders Endpoints</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{result.summary?.claims_endpoints || 0}</div>
                      <div className="text-sm text-gray-600">Claims Endpoints</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{result.summary?.total_orders_found || 0}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{result.summary?.total_claims_found || 0}</div>
                      <div className="text-sm text-gray-600">Total Claims</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{result.summary?.data_completeness_score || 0}%</div>
                      <div className="text-sm text-gray-600">Completude</div>
                    </div>
                  </div>

                  {/* Análise de Orders */}
                  {result.orders_analysis && result.orders_analysis.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">📦 Análise de Orders ({result.orders_analysis.length} endpoints)</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {result.orders_analysis.map((analysis: any, i: number) => (
                          <div key={i} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                            <div className="font-mono text-xs text-blue-800 mb-2">{analysis.endpoint}</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div><strong>Orders:</strong> {analysis.total_orders}</div>
                              <div><strong>Itens:</strong> {analysis.items_count}</div>
                              <div><strong>Valor Total:</strong> R$ {analysis.total_amount_sum?.toFixed(2) || '0.00'}</div>
                              <div><strong>Valor Médio:</strong> R$ {analysis.avg_amount?.toFixed(2) || '0.00'}</div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {analysis.unique_statuses?.map((status: string, si: number) => (
                                <span key={si} className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                                  {status} ({analysis.orders_by_status?.[status] || 0})
                                </span>
                              ))}
                            </div>
                            {analysis.payment_methods && analysis.payment_methods.length > 0 && (
                              <div className="mt-2 text-xs text-gray-600">
                                <strong>Métodos de Pagamento:</strong> {analysis.payment_methods.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Análise de Claims */}
                  {result.claims_analysis && result.claims_analysis.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">⚖️ Análise de Claims ({result.claims_analysis.length} endpoints)</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {result.claims_analysis.map((analysis: any, i: number) => (
                          <div key={i} className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
                            <div className="font-mono text-xs text-purple-800 mb-2">{analysis.endpoint}</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              <div><strong>Claims:</strong> {analysis.total_claims}</div>
                              <div><strong>Resource IDs:</strong> {analysis.resource_ids?.length || 0}</div>
                              <div><strong>Tem Reason ID:</strong> {analysis.has_reason_id ? 'Sim' : 'Não'}</div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {analysis.unique_types?.map((type: string, ti: number) => (
                                <span key={ti} className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs">
                                  {type} ({analysis.claims_by_type?.[type] || 0})
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {analysis.unique_statuses?.map((status: string, si: number) => (
                                <span key={si} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                                  {status} ({analysis.claims_by_status?.[status] || 0})
                                </span>
                              ))}
                            </div>
                            {analysis.resolution_time_analysis && (
                              <div className="mt-2 text-xs text-gray-600">
                                <strong>Tempo Resolução:</strong> {analysis.resolution_time_analysis.avg_days?.toFixed(1) || 0} dias (média)
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal da Implementação Final */}
      <Dialog open={showFinalModal} onOpenChange={setShowFinalModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🚀 Implementação Final - Resultados Práticos</DialogTitle>
          </DialogHeader>
          
          {finalResults && (
            <div className="space-y-6">
              {/* Resumo Geral */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {finalResults.total_accounts || 0}
                  </div>
                  <div className="text-sm text-green-600">Contas Processadas</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {finalResults.results?.reduce((acc: any, r: any) => acc + r.total_records, 0) || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total de Registros</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {finalResults.results?.reduce((acc: any, r: any) => acc + r.summary.claims_found, 0) || 0}
                  </div>
                  <div className="text-sm text-purple-600">Claims Encontradas</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {Math.round((finalResults.execution_time || 0) / 1000)}s
                  </div>
                  <div className="text-sm text-orange-600">Tempo de Execução</div>
                </div>
              </div>

              {/* Resultados por Conta */}
              {finalResults.results?.map((result: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Seller: {result.seller_id}</h3>
                  
                  {/* Resumo da Conta */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="font-semibold text-lg text-orange-700">{result.summary.claims_found}</div>
                      <div className="text-sm text-orange-600">Claims</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="font-semibold text-lg text-blue-700">{result.summary.orders_found}</div>
                      <div className="text-sm text-blue-600">Orders</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="font-semibold text-lg text-red-700">{result.summary.cancelled_orders_found}</div>
                      <div className="text-sm text-red-600">Canceladas</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="font-semibold text-lg text-green-700">{result.summary.successful_relationships}</div>
                      <div className="text-sm text-green-600">Relacionamentos</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{result.total_records}</div>
                      <div className="text-sm text-gray-600">Total Registros</div>
                    </div>
                  </div>

                  {/* Status e Informações */}
                  <div className="bg-gray-50 p-4 rounded mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Dados Salvos:</strong> {result.summary.data_saved ? '✅ Sim' : '❌ Não'}
                      </div>
                      <div>
                        <strong>Tempo de Execução:</strong> {Math.round(result.execution_time / 1000)}s
                      </div>
                    </div>
                  </div>

                  {/* Preview dos Registros */}
                  {result.records && result.records.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">📦 Primeiros Registros Salvos ({result.records.length} total)</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {result.records.slice(0, 5).map((record: any, ri: number) => (
                          <div key={ri} className="bg-white p-3 rounded border text-sm">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <strong>Order:</strong> {record.order_id}
                                {record.claim_id && (
                                  <div><strong>Claim:</strong> {record.claim_id}</div>
                                )}
                              </div>
                              <div>
                                <strong>Status:</strong> {record.status_devolucao}
                                <div><strong>Valor:</strong> R$ {record.valor_total?.toFixed(2) || '0.00'}</div>
                              </div>
                              <div>
                                <strong>Comprador:</strong> {record.comprador}
                                <div><strong>Data:</strong> {new Date(record.data_criacao).toLocaleDateString('pt-BR')}</div>
                              </div>
                            </div>
                            {record.produto && (
                              <div className="mt-2 text-xs text-gray-600 truncate">
                                <strong>Produto:</strong> {record.produto}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {result.records.length > 5 && (
                        <div className="text-sm text-gray-500 mt-2">
                          ... e mais {result.records.length - 5} registros salvos no banco
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {orders?.filter(o => o.has_claims).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {orders?.filter(o => o.status === 'cancelled').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders ? formatCurrency(
                orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
                'BRL'
              ) : 'R$ 0,00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Encontradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando orders...</div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma order encontrada com os filtros aplicados.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Data Fechamento</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Comprador ID</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Shipping ID</TableHead>
                    <TableHead>Pack ID</TableHead>
                    <TableHead>Claims</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const rawData = order.raw_data || {};
                    const dateClosed = rawData.date_closed ? format(new Date(rawData.date_closed), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-";
                    const paidAmount = rawData.paid_amount || 0;
                    const tags = rawData.tags ? rawData.tags.join(", ") : "-";
                    const shippingId = rawData.shipping?.id || "-";
                    const packId = rawData.pack_id || "-";
                    const sellerSku = rawData.order_items?.[0]?.item?.seller_sku || "-";
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.order_id}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.date_created), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{dateClosed}</TableCell>
                        <TableCell>{formatCurrency(order.total_amount, order.currency)}</TableCell>
                        <TableCell>{formatCurrency(paidAmount, order.currency)}</TableCell>
                        <TableCell className="font-mono text-sm">{order.buyer_id || "-"}</TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {order.buyer_nickname || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-[150px] truncate">
                          {sellerSku}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {order.item_title || "-"}
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {tags}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{shippingId}</TableCell>
                        <TableCell className="font-mono text-sm">{packId}</TableCell>
                        <TableCell>
                          {order.has_claims ? (
                            <Badge variant="destructive">{order.claims_count} claim(s)</Badge>
                          ) : (
                            <Badge variant="outline">Nenhuma</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Detalhes da Order {order.order_id}</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                                  {JSON.stringify(order.raw_data || {}, null, 2)}
                                </pre>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}