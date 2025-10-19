import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MLOrdersNav } from "@/features/ml/components/MLOrdersNav";
import { OMSNav } from "@/features/oms/components/OMSNav";
import { useDevolucoesSincronizadas } from "@/features/devolucoes/hooks/useDevolucoesSincronizadas";
import { 
  RefreshCw, 
  Package, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Database,
  Zap
} from 'lucide-react';

export default function MLOrdersCompletas() {
  const {
    devolucoes,
    total,
    loading,
    error,
    filtros,
    setFiltros,
    sincronizarAgora,
    refetch
  } = useDevolucoesSincronizadas();

  // Buscar contas ML para mostrar info
  const { data: mlAccounts } = useQuery({
    queryKey: ["ml-accounts"],
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

  // Estatísticas rápidas
  const stats = {
    total: total,
    abertas: devolucoes.filter(d => d.status_devolucao === 'opened').length,
    fechadas: devolucoes.filter(d => d.status_devolucao === 'closed').length,
    disputas: devolucoes.filter(d => d.tipo_claim === 'mediations').length
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>📦</span>
        <span>/</span>
        <span className="text-primary">Devoluções ML (Supabase)</span>
      </div>

      {/* Navigation */}
      <OMSNav />
      <MLOrdersNav />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sincronizadas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-500">No Supabase</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Abertas</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.abertas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Fechadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.fechadas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Em Disputa</p>
              <p className="text-2xl font-bold text-red-600">{stats.disputas}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={sincronizarAgora} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar Agora
          </Button>
          <Button onClick={() => refetch()} variant="ghost">
            <Zap className="h-4 w-4 mr-2" />
            Atualizar Lista
          </Button>
        </div>
        
        <Badge variant="secondary">
          {mlAccounts?.length || 0} conta(s) ML conectada(s)
        </Badge>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Status</label>
            <select 
              className="w-full mt-1 p-2 border rounded"
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value as any, page: 1})}
            >
              <option value="todas">Todas</option>
              <option value="opened">Abertas</option>
              <option value="closed">Fechadas</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Período</label>
            <select 
              className="w-full mt-1 p-2 border rounded"
              value={filtros.periodo}
              onChange={(e) => setFiltros({...filtros, periodo: e.target.value, page: 1})}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="todas">Todas</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Buscar</label>
            <input 
              type="text"
              className="w-full mt-1 p-2 border rounded"
              placeholder="Produto, Order ID, Claim ID..."
              value={filtros.search}
              onChange={(e) => setFiltros({...filtros, search: e.target.value, page: 1})}
            />
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={() => setFiltros({status: 'opened', periodo: '60', search: '', page: 1, limit: 25})}
              variant="outline"
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Carregando devoluções...</p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-700">❌ Erro: {error.message}</p>
        </Card>
      )}

      {/* Lista de Devoluções */}
      {!loading && !error && (
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold">Devoluções Encontradas</h3>
            <p className="text-sm text-muted-foreground">
              Mostrando {devolucoes.length} de {total} devoluções
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Order ID</th>
                  <th className="text-left p-3">Claim ID</th>
                  <th className="text-left p-3">Produto</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {devolucoes.map((dev, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{dev.order_id}</td>
                    <td className="p-3 font-mono text-sm">{dev.claim_id}</td>
                    <td className="p-3 max-w-xs truncate">{dev.produto_titulo || 'N/A'}</td>
                    <td className="p-3">
                      <Badge variant={dev.status_devolucao === 'opened' ? 'default' : 'secondary'}>
                        {dev.status_devolucao}
                      </Badge>
                    </td>
                    <td className="p-3">{dev.tipo_claim || 'N/A'}</td>
                    <td className="p-3 text-sm">
                      {dev.data_criacao ? new Date(dev.data_criacao).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3 text-sm">
                      R$ {dev.valor_retido || '0,00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {devolucoes.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma devolução encontrada</p>
              <Button onClick={sincronizarAgora} className="mt-4">
                🔄 Sincronizar Devoluções
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}