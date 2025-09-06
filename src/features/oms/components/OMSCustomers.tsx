import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Filter, 
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  Star,
  TrendingUp,
  RefreshCw,
  RotateCcw
} from "lucide-react";
import { useClientes, useClientesStats, useSyncClientesFromPedidos } from "@/hooks/useClientes";
import type { ClientesFilters } from "@/types/cliente";
import { toast } from "react-hot-toast";

export function OMSCustomers() {
  const [filters, setFilters] = useState<ClientesFilters>({});
  const { clientes, loading, error, totalCount, refetch } = useClientes(filters);
  const { stats, loading: statsLoading } = useClientesStats();
  const { syncClientes, syncing } = useSyncClientesFromPedidos();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIP': return 'bg-purple-500 text-white';
      case 'Premium': return 'bg-amber-500 text-white';
      case 'Regular': return 'bg-blue-500 text-white';
      case 'Inativo': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleSync = async () => {
    try {
      await syncClientes();
      await refetch();
      toast.success('Clientes sincronizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao sincronizar clientes');
      console.error('Erro:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seu relacionamento com clientes ({totalCount} clientes)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Sincronizar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                )}
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.ativos || 0}</p>
                )}
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    R$ {(stats?.ticket_medio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">LTV Médio</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    R$ {(stats?.ltv_medio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Buscar por nome, CPF/CNPJ, email..." 
                className="pl-10"
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Erro ao carregar clientes: {error}</p>
              <Button variant="outline" onClick={refetch} className="mt-2">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {filters.search ? 'Nenhum cliente encontrado com os filtros aplicados' : 'Nenhum cliente cadastrado'}
              </p>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Sincronizar Clientes dos Pedidos
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {clientes.map((cliente) => (
                <div key={cliente.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{cliente.nome_completo}</span>
                          <Badge variant="outline" className={getStatusColor(cliente.status_cliente)}>
                            {cliente.status_cliente}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          {cliente.email && (
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {cliente.email}
                            </div>
                          )}
                          {cliente.cpf_cnpj && (
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {cliente.cpf_cnpj}
                            </div>
                          )}
                          {(cliente.endereco_cidade || cliente.endereco_uf) && (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {[cliente.endereco_cidade, cliente.endereco_uf].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Pedidos</p>
                        <p className="font-medium">{cliente.total_pedidos}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Gasto</p>
                        <p className="font-medium">
                          R$ {cliente.valor_total_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Último Pedido</p>
                        <p className="font-medium">
                          {cliente.data_ultimo_pedido 
                            ? new Date(cliente.data_ultimo_pedido).toLocaleDateString('pt-BR')
                            : '—'
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}