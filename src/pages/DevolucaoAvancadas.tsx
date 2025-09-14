import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface MLClaim {
  id: string;
  order_id: string;
  claim_id: string;
  claim_type: string;
  claim_status: string;
  claim_stage: string;
  quantity: number;
  amount_claimed: number;
  amount_refunded: number;
  currency: string;
  reason_id: string;
  date_created: string;
  buyer_id: string;
  buyer_nickname: string;
  item_id: string;
  item_title: string;
  seller_sku: string;
  created_at: string;
}

export default function DevolucaoAvancadas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Buscar contas ML disponíveis
  const { data: mlAccounts } = useQuery({
    queryKey: ["ml-accounts-devolucoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_accounts")
        .select("id, name, account_identifier")
        .eq("provider", "mercadolivre")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar dados de devoluções
  const { data: claims, isLoading, refetch, error: queryError } = useQuery({
    queryKey: ["ml-devolucoes", searchTerm, statusFilter, typeFilter, dateFrom, dateTo],
    queryFn: async () => {
      console.log("🔍 [Devoluções] Buscando claims...");
      
      let query = supabase.from("ml_devolucoes_reclamacoes").select("*");

      if (searchTerm) {
        query = query.or(`order_id.ilike.%${searchTerm}%,buyer_nickname.ilike.%${searchTerm}%,item_title.ilike.%${searchTerm}%,claim_id.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("claim_status", statusFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq("claim_type", typeFilter);
      }

      if (dateFrom) {
        query = query.gte("date_created", dateFrom);
      }

      if (dateTo) {
        query = query.lte("date_created", dateTo);
      }

      const { data, error } = await query.order("date_created", { ascending: false }).limit(1000);
      
      if (error) {
        console.error("❌ [Devoluções] Erro ao buscar claims:", error);
        throw error;
      }
      
      console.log("✅ [Devoluções] Claims encontradas:", data?.length || 0);
      return data || [];
    },
  });

  // Função para sincronizar devoluções
  const syncDevolucoes = async () => {
    if (!selectedAccounts.length) {
      toast.error("Selecione pelo menos uma conta ML");
      return;
    }

    setSyncLoading(true);
    try {
      console.log("🔄 Sincronizando devoluções para contas:", selectedAccounts);
      
      for (const accountId of selectedAccounts) {
        const { data, error } = await supabase.functions.invoke('ml-devolucoes-sync', {
          body: { 
            integration_account_id: accountId,
            date_from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // últimos 30 dias se não especificado
            date_to: dateTo || new Date().toISOString().split('T')[0]
          }
        });

        if (error) throw error;
        console.log("✅ Sincronização concluída para conta:", accountId, data);
      }
      
      toast.success("Sincronização de devoluções concluída!");
      refetch(); // Atualizar os dados
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
      toast.error("Erro ao sincronizar devoluções: " + error.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "closed": return "default";
      case "opened": return "destructive";
      case "in_process": return "secondary";
      case "waiting_buyer": return "outline";
      case "waiting_seller": return "outline";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "closed": return "Fechada";
      case "opened": return "Aberta";
      case "in_process": return "Em Processo";
      case "waiting_buyer": return "Aguardando Comprador";
      case "waiting_seller": return "Aguardando Vendedor";
      default: return status || "-";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case "claim": return "Reclamação";
      case "return": return "Devolução";
      case "refund": return "Reembolso";
      case "mediation": return "Mediação";
      default: return type || "-";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Devoluções ML</h1>
          <p className="text-muted-foreground">
            Gestão simplificada de devoluções e reclamações do Mercado Livre
          </p>
        </div>
      </div>

      {/* Filtros e Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros e Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Seleção de contas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Contas ML:</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                    <label htmlFor={account.id} className="text-sm">
                      {account.name} ({account.account_identifier})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por Order ID, Claim ID, comprador..."
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
                  <SelectItem value="opened">Abertas</SelectItem>
                  <SelectItem value="closed">Fechadas</SelectItem>
                  <SelectItem value="in_process">Em Processo</SelectItem>
                  <SelectItem value="waiting_buyer">Aguardando Comprador</SelectItem>
                  <SelectItem value="waiting_seller">Aguardando Vendedor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="claim">Reclamações</SelectItem>
                  <SelectItem value="return">Devoluções</SelectItem>
                  <SelectItem value="refund">Reembolsos</SelectItem>
                  <SelectItem value="mediation">Mediações</SelectItem>
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

              <div className="flex gap-2">
                <Button 
                  onClick={syncDevolucoes}
                  disabled={syncLoading || !selectedAccounts.length}
                  className="gap-2"
                >
                  {syncLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {syncLoading ? "Sincronizando..." : "Sincronizar"}
                </Button>
                
                <Button onClick={() => refetch()} variant="outline">
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>
            Devoluções e Reclamações
            {claims && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({claims.length} encontradas)
              </span>
            )}
            {queryError && (
              <span className="text-sm font-normal text-destructive ml-2">
                ⚠️ Erro: {queryError.message}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando devoluções...</span>
            </div>
          ) : !claims || claims.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              {queryError ? "Erro ao carregar dados" : "Nenhuma devolução encontrada"}
              <p className="text-sm mt-2">
                {!selectedAccounts.length 
                  ? "Selecione uma conta ML e clique em 'Sincronizar' para buscar dados"
                  : "Tente ajustar os filtros ou sincronizar novamente"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Valor Reclamado</TableHead>
                    <TableHead>Valor Reembolsado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={`${claim.order_id}-${claim.claim_id}-${claim.id}`}>
                      <TableCell className="font-mono text-sm">{claim.order_id}</TableCell>
                      <TableCell className="font-mono text-sm">{claim.claim_id || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(claim.claim_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(claim.claim_status)}>
                          {getStatusLabel(claim.claim_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {claim.date_created ? format(new Date(claim.date_created), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </TableCell>
                      <TableCell>{claim.buyer_nickname || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={claim.item_title}>
                        {claim.item_title || "-"}
                      </TableCell>
                      <TableCell>{claim.quantity || "-"}</TableCell>
                      <TableCell>
                        {claim.amount_claimed ? formatCurrency(claim.amount_claimed, claim.currency) : "-"}
                      </TableCell>
                      <TableCell>
                        {claim.amount_refunded ? formatCurrency(claim.amount_refunded, claim.currency) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}