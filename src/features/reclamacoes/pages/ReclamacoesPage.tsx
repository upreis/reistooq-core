/**
 * 📋 PÁGINA PRINCIPAL DE RECLAMAÇÕES
 * FASE 1: Estrutura básica com filtros e tabela
 */

import { useState } from 'react';
import { useReclamacoes } from '../hooks/useReclamacoes';
import { ReclamacoesFilters } from '../components/ReclamacoesFilters';
import { ReclamacoesTable } from '../components/ReclamacoesTable';
import { ReclamacoesStats } from '../components/ReclamacoesStats';
import { ReclamacoesExport } from '../components/ReclamacoesExport';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function ReclamacoesPage() {
  const [filters, setFilters] = useState({
    periodo: '7',
    status: '',
    type: '',
    stage: '',
    has_messages: '',
    has_evidences: '',
    date_from: '',
    date_to: ''
  });

  const {
    reclamacoes,
    isLoading,
    isRefreshing,
    error,
    pagination,
    goToPage,
    changeItemsPerPage,
    refresh
  } = useReclamacoes(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reclamações</h1>
          <p className="text-muted-foreground">
            Gerencie claims e mediações do Mercado Livre
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReclamacoesExport 
            reclamacoes={reclamacoes} 
            disabled={isLoading || isRefreshing}
          />
          <Button
            onClick={refresh}
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ReclamacoesStats reclamacoes={reclamacoes} />

      {/* Filtros */}
      <Card className="p-6">
        <ReclamacoesFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </Card>

      {/* Tabela */}
      <Card>
        <ReclamacoesTable
          reclamacoes={reclamacoes}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
          onPageChange={goToPage}
          onItemsPerPageChange={changeItemsPerPage}
        />
      </Card>
    </div>
  );
}
