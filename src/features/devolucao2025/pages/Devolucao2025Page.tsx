/**
 * 📋 PÁGINA PRINCIPAL - DEVOLUÇÕES 2025
 * Implementação completa com 65 colunas
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Devolucao2025Table } from '../components/Devolucao2025Table';
import { Devolucao2025Filters } from '../components/Devolucao2025Filters';
import { Devolucao2025Stats } from '../components/Devolucao2025Stats';
import { Devolucao2025Pagination } from '../components/Devolucao2025Pagination';
import { RefreshCw } from 'lucide-react';

export const Devolucao2025Page = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Padrão: 7 dias
    to: new Date()
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Buscar contas de integração
  const { data: accounts = [] } = useQuery({
    queryKey: ['integration-accounts-ml'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name, account_identifier')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Buscar devoluções via Edge Function
  // ✅ Buscar devoluções DIRETO DO BANCO (como /pedidos faz)
  // Evita timeout da edge function
  const { data: devolucoes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['devolucoes-2025-db', selectedAccount, dateRange],
    queryFn: async () => {
      console.log('[Devolucao2025] Buscando do banco...', { selectedAccount, dateRange });
      
      let query = supabase
        .from('ml_devolucoes_reclamacoes')
        .select('*')
        .order('data_criacao', { ascending: false });

      // Filtrar por conta
      if (selectedAccount && selectedAccount !== 'all') {
        query = query.eq('integration_account_id', selectedAccount);
      }

      // Filtrar por período
      if (dateRange.from) {
        query = query.gte('data_criacao', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        query = query.lte('data_criacao', dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Devolucao2025] Erro ao buscar:', error);
        throw error;
      }

      console.log('[Devolucao2025] ✅ Dados carregados:', data?.length || 0);
      return data || [];
    },
    enabled: accounts.length > 0,
    staleTime: 2 * 60 * 1000, // Cache de 2 minutos
    gcTime: 5 * 60 * 1000,
  });

  // Paginação dos dados
  const paginatedDevolucoes = useMemo(() => {
    if (itemsPerPage === -1) return devolucoes; // "Todas"
    const startIndex = (currentPage - 1) * itemsPerPage;
    return devolucoes.slice(startIndex, startIndex + itemsPerPage);
  }, [devolucoes, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(devolucoes.length / itemsPerPage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devoluções 2025</h1>
          <p className="text-muted-foreground">
            Gestão completa com {devolucoes.length} devoluções
          </p>
        </div>
      </div>

      <Devolucao2025Stats devolucoes={devolucoes} />

      <Card className="p-6">
        <Devolucao2025Filters
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={refetch}
          isLoading={isLoading}
        />
      </Card>

      <Card className="p-6">
        {isLoading && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-md flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Buscando devoluções...</p>
              <p className="text-xs text-muted-foreground">
                Aguarde enquanto carregamos os dados do Mercado Livre (isso pode demorar alguns segundos)
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
            <p className="font-semibold text-destructive">Erro ao carregar devoluções:</p>
            <p className="text-sm text-destructive/90">{error.message}</p>
            {error.message.includes('Failed to send') && (
              <div className="mt-3 p-3 bg-background rounded border border-border">
                <p className="text-sm font-medium mb-1">💡 Dica:</p>
                <p className="text-xs text-muted-foreground">
                  Tente reduzir o período de busca para evitar timeout (máx. 30 dias recomendado)
                </p>
              </div>
            )}
          </div>
        )}
        
        <Devolucao2025Table 
          devolucoes={paginatedDevolucoes}
          isLoading={isLoading}
          error={error}
        />

        {!isLoading && !error && devolucoes.length > 0 && (
          <Devolucao2025Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={devolucoes.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </Card>
    </div>
  );
};
