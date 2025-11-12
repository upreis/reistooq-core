/**
 * 📦 DEVOLUÇÕES ML - NOVA VERSÃO LIMPA
 * Reconstruída do zero seguindo padrão de /reclamacoes
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { DevolucaoDetailModal } from '@/components/devolucoes/DevolucaoDetailModal';
import { StatusBadge } from '@/components/devolucoes/StatusBadge';
import { DevolucaoFilters } from '@/components/devolucoes/DevolucaoFilters';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface MLAccount {
  id: string;
  name: string;
}

interface Devolucao {
  id: string;
  claim_id: string;
  status: any;
  comprador_nome_completo: string;
  comprador_cpf?: string;
  produto_titulo: string;
  valor_reembolso_total: number;
  data_criacao: string;
  empresa: string;
  metodo_pagamento?: string;
  codigo_rastreamento?: string;
  dados_buyer_info?: {
    doc_number?: string;
  };
  dados_financial_info?: {
    payment_method?: string;
  };
  dados_tracking_info?: {
    tracking_number?: string;
  };
}

export default function DevolucoesMercadoLivre() {
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [periodo, setPeriodo] = useState('60');
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDevolucao, setSelectedDevolucao] = useState<Devolucao | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Novos estados de filtros
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Carregar contas ML
  useEffect(() => {
    const fetchAccounts = async () => {
      console.log('🔍 Buscando contas ML...');
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar contas:', error);
        toast.error('Erro ao carregar contas ML');
        return;
      }

      console.log('✅ Contas encontradas:', data?.length || 0);
      setAccounts(data || []);
      
      if (data && data.length > 0) {
        setSelectedAccountId(data[0].id);
        console.log('✅ Auto-selecionada conta:', data[0].name);
      }
    };

    fetchAccounts();
  }, []);

  // Buscar devoluções da API ML
  const handleBuscar = async () => {
    if (!selectedAccountId) {
      toast.error('Selecione uma conta ML');
      return;
    }

    console.log('📡 Iniciando busca de devoluções...');
    console.log('📍 Conta:', selectedAccountId);
    console.log('📍 Período:', periodo);

    setIsLoading(true);
    const toastId = toast.loading(`📡 Buscando devoluções dos últimos ${periodo} dias...`);

    try {
      // Calcular datas
      const dateTo = new Date();
      const dateFrom = new Date();
      dateFrom.setDate(dateTo.getDate() - parseInt(periodo));

      const dateFromISO = dateFrom.toISOString();
      const dateToISO = dateTo.toISOString();

      console.log('📅 Date from:', dateFromISO);
      console.log('📅 Date to:', dateToISO);

      // Usar datas customizadas se período for 'custom'
      let finalDateFrom = dateFromISO;
      let finalDateTo = dateToISO;
      
      if (periodo === 'custom' && dateFrom && dateTo) {
        finalDateFrom = dateFrom.toISOString();
        finalDateTo = dateTo.toISOString();
      }

      console.log('📅 Date from (final):', finalDateFrom);
      console.log('📅 Date to (final):', finalDateTo);

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('get-devolucoes-direct', {
        body: {
          integration_account_id: selectedAccountId,
          date_from: finalDateFrom,
          date_to: finalDateTo
        }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        toast.error('Erro ao buscar devoluções', { id: toastId });
        return;
      }

      // A Edge Function retorna { success, data, total }
      const claimsArray = data?.data || [];
      console.log('✅ Dados recebidos:', claimsArray.length, 'devoluções');
      
      // Adicionar nome da empresa
      const account = accounts.find(acc => acc.id === selectedAccountId);
      const devolucoesComEmpresa = claimsArray.map((dev: any) => ({
        ...dev,
        empresa: account?.name || 'N/A'
      }));

      setDevolucoes(devolucoesComEmpresa);
      setCurrentPage(1); // Reset page
      toast.success(`✅ ${devolucoesComEmpresa.length} devoluções encontradas`, { id: toastId });

    } catch (err) {
      console.error('❌ Erro ao buscar:', err);
      toast.error('Erro ao buscar devoluções', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar filtros
  const devolucoesFiltered = useMemo(() => {
    let filtered = [...devolucoes];
    
    // Filtro de status
    if (statusFilter.length > 0) {
      filtered = filtered.filter(dev => 
        statusFilter.includes(dev.status?.id)
      );
    }
    
    // Filtro de valor
    const minVal = valorMin ? parseFloat(valorMin) : null;
    const maxVal = valorMax ? parseFloat(valorMax) : null;
    
    if (minVal !== null) {
      filtered = filtered.filter(dev => 
        (dev.valor_reembolso_total || 0) >= minVal
      );
    }
    
    if (maxVal !== null) {
      filtered = filtered.filter(dev => 
        (dev.valor_reembolso_total || 0) <= maxVal
      );
    }
    
    return filtered;
  }, [devolucoes, statusFilter, valorMin, valorMax]);

  // Aplicar paginação
  const totalPages = Math.ceil(devolucoesFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const devolucoesPage = devolucoesFiltered.slice(startIndex, endIndex);

  const handleRowClick = (devolucao: Devolucao) => {
    setSelectedDevolucao(devolucao);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setStatusFilter([]);
    setValorMin('');
    setValorMax('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPeriodo('60');
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    statusFilter.length > 0 || 
    valorMin !== '' || 
    valorMax !== '' || 
    dateFrom !== undefined || 
    dateTo !== undefined;

  return (
    <div className="min-h-screen bg-background">
      <MLOrdersNav />
      
      <div className="container mx-auto py-6 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Devoluções Mercado Livre</h1>
          <p className="text-muted-foreground">Gerencie suas devoluções do Mercado Livre</p>
        </div>

        {/* FILTROS */}
        <Card className="p-6">
          <DevolucaoFilters
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
            periodo={periodo}
            onPeriodoChange={setPeriodo}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            valorMin={valorMin}
            onValorMinChange={setValorMin}
            valorMax={valorMax}
            onValorMaxChange={setValorMax}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            accounts={accounts}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={handleBuscar} 
              disabled={isLoading || !selectedAccountId}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Buscar Devoluções'
              )}
            </Button>
          </div>
        </Card>

        {/* TABELA */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Claim ID</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : devolucoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Clique em "Buscar Devoluções" para carregar os dados
                  </TableCell>
                </TableRow>
              ) : (
                devolucoesPage.map((dev) => (
                  <TableRow 
                    key={dev.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(dev)}
                  >
                    <TableCell className="font-medium">{dev.empresa}</TableCell>
                    <TableCell>{dev.claim_id}</TableCell>
                    <TableCell>{dev.comprador_nome_completo || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {dev.comprador_cpf || dev.dados_buyer_info?.doc_number || '-'}
                    </TableCell>
                    <TableCell>{dev.produto_titulo || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={dev.status?.id || 'unknown'} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {dev.metodo_pagamento || dev.dados_financial_info?.payment_method || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {dev.codigo_rastreamento || dev.dados_tracking_info?.tracking_number || '-'}
                    </TableCell>
                    <TableCell>
                      {dev.valor_reembolso_total 
                        ? `R$ ${dev.valor_reembolso_total.toFixed(2)}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {dev.data_criacao 
                        ? new Date(dev.data_criacao).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {devolucoesFiltered.length > 0 && (
            <div className="p-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, devolucoesFiltered.length)} de {devolucoesFiltered.length} devoluções
                  {devolucoes.length !== devolucoesFiltered.length && (
                    <span className="ml-2 text-primary">
                      (filtrado de {devolucoes.length} total)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Itens por página:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1 text-sm bg-background"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </Card>

        <DevolucaoDetailModal
          devolucao={selectedDevolucao}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
