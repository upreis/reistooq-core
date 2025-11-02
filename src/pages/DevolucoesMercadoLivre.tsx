/**
 * 🔄 DEVOLUÇÕES ML - Página Principal
 * Gerenciamento completo de devoluções do Mercado Livre
 */

import { DevolucaoFiltersBar } from '@/features/devolucoes-online/components/DevolucaoFiltersBar';
import { DevolucaoTable } from '@/features/devolucoes-online/components/DevolucaoTable';
import { DevolucaoPaginationControls } from '@/features/devolucoes-online/components/DevolucaoPaginationControls';
import { DevolucaoAccountSelector } from '@/features/devolucoes-online/components/DevolucaoAccountSelector';
import { useDevolucaoData } from '@/features/devolucoes-online/hooks/useDevolucaoData';
import { useDevolucaoStore } from '@/features/devolucoes-online/store/useDevolucaoStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Undo2, AlertCircle, CheckCircle, DollarSign, RefreshCw } from 'lucide-react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { OMSNav } from '@/features/oms/components/OMSNav';

export default function DevolucoesMercadoLivre() {
  const { refresh } = useDevolucaoData();
  const devolucoes = useDevolucaoStore(state => state.devolucoes);
  const pagination = useDevolucaoStore(state => state.pagination);
  const isLoading = useDevolucaoStore(state => state.isLoading);
  
  // Calcular estatísticas
  const stats = {
    total: pagination.total,
    pending: devolucoes.filter(d => d.status?.id === 'pending').length,
    approved: devolucoes.filter(d => d.status?.id === 'approved').length,
    refunded: devolucoes.filter(d => d.status_money?.id === 'refunded').length,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Navegação Principal */}
      <OMSNav />
      
      {/* Sub-navegação */}
      <MLOrdersNav />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Devoluções ML</h1>
          <p className="text-muted-foreground">
            Gerencie todas as devoluções do Mercado Livre em um só lugar
          </p>
        </div>
        
        <Button onClick={() => refresh()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Undo2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Devoluções</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aprovadas</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reembolsadas</p>
              <p className="text-2xl font-bold">{stats.refunded}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Account Selector */}
      <div className="flex items-center gap-4">
        <DevolucaoAccountSelector />
      </div>
      
      {/* Filters */}
      <DevolucaoFiltersBar />
      
      {/* Table */}
      <DevolucaoTable />
      
      {/* Pagination */}
      <DevolucaoPaginationControls />
    </div>
  );
}
