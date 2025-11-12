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
import { TrackingPriorityCells } from '@/components/ml/devolucao/cells/TrackingPriorityCells';
import { FinancialDetailedCells } from '@/components/devolucoes/FinancialDetailedCells';
import { TrackingDetailedCells } from '@/components/devolucoes/TrackingDetailedCells';
import { CommunicationDetailedCells } from '@/components/devolucoes/CommunicationDetailedCells';
import { MediationDetailedCells } from '@/components/devolucoes/MediationDetailedCells';
import { MetadataDetailedCells } from '@/components/devolucoes/MetadataDetailedCells';
import { PackDataCells } from '@/components/devolucoes/PackDataCells';
import { 
  LocalizacaoAtualCell, 
  StatusTransporteCell, 
  TempoTransitoCell, 
  PrevisaoChegadaCell 
} from '@/components/devolucoes/ShippingAdvancedCells';
import { LogisticTypeCell } from '@/components/devolucoes/LogisticTypeCell';
import { SubtipoCell } from '@/components/devolucoes/SubtipoCell';
import { CustosLogisticaCell } from '@/components/devolucoes/CustosLogisticaCell';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Helper to safely format dates
const formatSafeDate = (dateValue: any): string => {
  if (!dateValue) return '-';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

interface MLAccount {
  id: string;
  name: string;
}

interface Devolucao {
  id: string;
  claim_id: string;
  status: any;
  subtipo_claim?: string | null;
  comprador_nome_completo: string;
  comprador_cpf?: string;
  produto_titulo: string;
  valor_reembolso_total: number;
  data_criacao: string;
  empresa: string;
  metodo_pagamento?: string;
  codigo_rastreamento?: string;
  
  // 🚚 TIPO DE LOGÍSTICA
  tipo_logistica?: string | null;
  
  // ✅ FASE 2: SHIPPING AVANÇADO - 4 campos críticos
  localizacao_atual_produto?: string | null;
  status_transporte_atual?: string | null;
  tempo_transito_dias?: number | null;
  previsao_chegada_vendedor?: string | null;
  
  // ✅ PRIORIDADE ALTA - 7 campos
  estimated_delivery_date?: string | null;
  has_delay?: boolean | null;
  return_quantity?: number | null;
  total_quantity?: number | null;
  qualidade_comunicacao?: string | null;
  numero_interacoes?: number | null;
  mediador_ml?: string | null;
  transaction_id?: string | null;
  
  // ✅ FINANCEIRO DETALHADO - 9 campos
  status_dinheiro?: string | null;
  metodo_reembolso?: string | null;
  moeda_reembolso?: string | null;
  percentual_reembolsado?: number | null;
  valor_diferenca_troca?: number | null;
  taxa_ml_reembolso?: number | null;
  custo_devolucao?: number | null;
  parcelas?: number | null;
  valor_parcela?: number | null;
  
  // ✅ CUSTOS LOGÍSTICA - campos do breakdown
  custo_total_logistica?: number | null;
  custo_envio_original?: number | null;
  responsavel_custo_frete?: string | null;
  shipping_fee?: number | null;
  handling_fee?: number | null;
  insurance?: number | null;
  taxes?: number | null;
  
  // ✅ RASTREAMENTO DETALHADO - 10 campos (sem duplicação de FASE 2)
  estimated_delivery_limit?: string | null;
  shipment_status?: string | null;
  refund_at?: string | null;
  review_method?: string | null;
  review_stage?: string | null;
  localizacao_atual?: string | null;
  tracking_history?: any[] | null;
  tracking_events?: any[] | null;
  data_ultima_movimentacao?: string | null;
  
  // ✅ COMUNICAÇÃO DETALHADA - 6 campos
  timeline_events?: any[] | null;
  marcos_temporais?: any | null;
  data_criacao_claim?: string | null;
  data_inicio_return?: string | null;
  data_fechamento_claim?: string | null;
  historico_status?: any[] | null;
  
  // ✅ MEDIAÇÃO DETALHADA - 6 campos
  resultado_mediacao?: string | null;
  detalhes_mediacao?: string | null;
  produto_troca_id?: string | null;
  novo_pedido_id?: string | null;
  dias_restantes_acao?: number | null;
  prazo_revisao_dias?: number | null;
  
  // ✅ METADADOS - 3 campos
  usuario_ultima_acao?: string | null;
  total_evidencias?: number | null;
  anexos_ml?: any[] | null;
  
  // ✅ PACK DATA - 5 campos
  pack_id?: string | null;
  is_pack?: boolean | null;
  pack_items?: any[] | null;
  cancel_detail?: any | null;
  seller_custom_field?: string | null;
  
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

      setAccounts(data || []);
      
      if (data && data.length > 0) {
        setSelectedAccountId(data[0].id);
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

    setIsLoading(true);
    const toastId = toast.loading(`📡 Buscando devoluções dos últimos ${periodo} dias...`);

    try {
      // Calcular datas
      const dateTo = new Date();
      const dateFrom = new Date();
      dateFrom.setDate(dateTo.getDate() - parseInt(periodo));

      const dateFromISO = dateFrom.toISOString();
      const dateToISO = dateTo.toISOString();

      // Usar datas customizadas se período for 'custom'
      let finalDateFrom = dateFromISO;
      let finalDateTo = dateToISO;
      
      if (periodo === 'custom' && dateFrom && dateTo) {
        finalDateFrom = dateFrom.toISOString();
        finalDateTo = dateTo.toISOString();
      }

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
                <TableHead>🏷️ Subtipo</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>🚚 Tipo Logística</TableHead>
                
                {/* PRIORIDADE ALTA - 7 colunas */}
                <TableHead>📅 Previsão Entrega</TableHead>
                <TableHead>⏰ Atraso?</TableHead>
                <TableHead>📦 Qtd</TableHead>
                <TableHead>💬 Qualidade</TableHead>
                <TableHead>🔢 Interações</TableHead>
                <TableHead>⚖️ Mediador</TableHead>
                <TableHead>💳 Transaction ID</TableHead>
                
                {/* FINANCEIRO DETALHADO - 9 colunas */}
                <TableHead>💰 Status $</TableHead>
                <TableHead>💸 Método Reemb.</TableHead>
                <TableHead>💱 Moeda</TableHead>
                <TableHead>📊 % Reembolsado</TableHead>
                <TableHead>🔄 Dif. Troca</TableHead>
                <TableHead>🏦 Taxa ML Reemb.</TableHead>
                <TableHead>📦 Custo Devolução</TableHead>
                <TableHead>💳 Parcelas</TableHead>
                <TableHead>💵 Valor Parcela</TableHead>
                
                {/* CUSTOS LOGÍSTICA */}
                <TableHead>💰 Custos Logística</TableHead>
                
                
                {/* 🆕 FASE 2: SHIPPING AVANÇADO - 4 colunas ANTES dos detalhados */}
                <TableHead>📍 Localização Produto</TableHead>
                <TableHead>🚚 Status Transporte</TableHead>
                <TableHead>⏱️ Tempo Trânsito</TableHead>
                <TableHead>📅 Previsão Chegada</TableHead>
                
                {/* RASTREAMENTO DETALHADO - 9 colunas (removido status_transporte duplicado) */}
                <TableHead>⏱️ Limite Entrega</TableHead>
                <TableHead>🚢 Status Shipment</TableHead>
                <TableHead>💰 Refund At</TableHead>
                <TableHead>🔍 Review Method</TableHead>
                <TableHead>📋 Review Stage</TableHead>
                <TableHead>📜 History</TableHead>
                <TableHead>📊 Events</TableHead>
                <TableHead>⏰ Última Movim.</TableHead>
                
                {/* COMUNICAÇÃO DETALHADA - 6 colunas */}
                <TableHead>📅 Timeline Events</TableHead>
                <TableHead>🎯 Marcos Temp.</TableHead>
                <TableHead>📅 Criação Claim</TableHead>
                <TableHead>📅 Início Return</TableHead>
                <TableHead>📅 Fecham. Claim</TableHead>
                <TableHead>📊 Histórico Status</TableHead>
                
                {/* MEDIAÇÃO DETALHADA - 6 colunas */}
                <TableHead>⚖️ Resultado Med.</TableHead>
                <TableHead>📝 Detalhes Med.</TableHead>
                <TableHead>🔄 Produto Troca</TableHead>
                <TableHead>🆕 Novo Pedido</TableHead>
                <TableHead>⏳ Dias Rest. Ação</TableHead>
                <TableHead>⏱️ Prazo Revisão</TableHead>
                
                {/* METADADOS - 3 colunas */}
                <TableHead>👤 Últ. Ação</TableHead>
                <TableHead>📎 Evidências</TableHead>
                <TableHead>📎 Anexos ML</TableHead>
                
                {/* PACK DATA - 5 colunas */}
                <TableHead>📦 Pack ID</TableHead>
                <TableHead>📦 É Pack?</TableHead>
                <TableHead>📦 Pack Items</TableHead>
                <TableHead>❌ Cancelado?</TableHead>
                <TableHead>🏷️ Custom Field</TableHead>
                
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={64} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : devolucoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={64} className="text-center py-8 text-muted-foreground">
                    Clique em "Buscar Devoluções" para carregar os dados
                  </TableCell>
                </TableRow>
              ) : (
                devolucoesPage.map((dev, index) => (
                  <TableRow 
                    key={`${dev.id}-${dev.claim_id}-${index}`}
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
                    <TableCell>
                      <SubtipoCell subtipo_claim={dev.subtipo_claim} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {dev.metodo_pagamento || dev.dados_financial_info?.payment_method || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {dev.codigo_rastreamento || dev.dados_tracking_info?.tracking_number || '-'}
                    </TableCell>
                    
                    {/* 🚚 TIPO DE LOGÍSTICA */}
                    <TableCell>
                      <LogisticTypeCell tipo_logistica={dev.tipo_logistica} />
                    </TableCell>
                    
                    {/* PRIORIDADE ALTA - 7 colunas */}
                    <TrackingPriorityCells
                      estimated_delivery_date={dev.estimated_delivery_date}
                      has_delay={dev.has_delay}
                      return_quantity={dev.return_quantity}
                      total_quantity={dev.total_quantity}
                      qualidade_comunicacao={dev.qualidade_comunicacao}
                      numero_interacoes={dev.numero_interacoes}
                      mediador_ml={dev.mediador_ml}
                      transaction_id={dev.transaction_id}
                    />
                    
                    {/* FINANCEIRO DETALHADO - 9 colunas */}
                    <FinancialDetailedCells
                      status_dinheiro={dev.status_dinheiro}
                      metodo_reembolso={dev.metodo_reembolso}
                      moeda_reembolso={dev.moeda_reembolso}
                      percentual_reembolsado={dev.percentual_reembolsado}
                      valor_diferenca_troca={dev.valor_diferenca_troca}
                      taxa_ml_reembolso={dev.taxa_ml_reembolso}
                      custo_devolucao={dev.custo_devolucao}
                      parcelas={dev.parcelas}
                      valor_parcela={dev.valor_parcela}
                    />
                    
                    {/* CUSTOS LOGÍSTICA */}
                    <TableCell>
                      <CustosLogisticaCell
                        custo_total_logistica={dev.custo_total_logistica}
                        custo_envio_original={dev.custo_envio_original}
                        custo_devolucao={dev.custo_devolucao}
                        responsavel_custo_frete={dev.responsavel_custo_frete}
                        shipping_fee={dev.shipping_fee}
                        handling_fee={dev.handling_fee}
                        insurance={dev.insurance}
                        taxes={dev.taxes}
                      />
                    </TableCell>
                    
                    {/* 🆕 FASE 2: SHIPPING AVANÇADO - 4 colunas */}
                    <LocalizacaoAtualCell devolucao={dev} />
                    <StatusTransporteCell devolucao={dev} />
                    <TempoTransitoCell devolucao={dev} />
                    <PrevisaoChegadaCell devolucao={dev} />
                    
                    {/* RASTREAMENTO DETALHADO - 8 colunas (removido duplicatas de FASE 2) */}
                    <TrackingDetailedCells
                      estimated_delivery_limit={dev.estimated_delivery_limit}
                      shipment_status={dev.shipment_status}
                      refund_at={dev.refund_at}
                      review_method={dev.review_method}
                      review_stage={dev.review_stage}
                      tracking_history={dev.tracking_history}
                      tracking_events={dev.tracking_events}
                      data_ultima_movimentacao={dev.data_ultima_movimentacao}
                    />
                    
                    {/* COMUNICAÇÃO DETALHADA - 6 colunas */}
                    <CommunicationDetailedCells
                      timeline_events={dev.timeline_events}
                      marcos_temporais={dev.marcos_temporais}
                      data_criacao_claim={dev.data_criacao_claim}
                      data_inicio_return={dev.data_inicio_return}
                      data_fechamento_claim={dev.data_fechamento_claim}
                      historico_status={dev.historico_status}
                    />
                    
                    {/* MEDIAÇÃO DETALHADA - 6 colunas */}
                    <MediationDetailedCells
                      resultado_mediacao={dev.resultado_mediacao}
                      detalhes_mediacao={dev.detalhes_mediacao}
                      produto_troca_id={dev.produto_troca_id}
                      novo_pedido_id={dev.novo_pedido_id}
                      dias_restantes_acao={dev.dias_restantes_acao}
                      prazo_revisao_dias={dev.prazo_revisao_dias}
                    />
                    
                    {/* METADADOS - 3 colunas */}
                    <MetadataDetailedCells
                      usuario_ultima_acao={dev.usuario_ultima_acao}
                      total_evidencias={dev.total_evidencias}
                      anexos_ml={dev.anexos_ml}
                    />
                    
                    {/* PACK DATA - 5 colunas */}
                    <PackDataCells
                      pack_id={dev.pack_id}
                      is_pack={dev.is_pack}
                      pack_items={dev.pack_items}
                      cancel_detail={dev.cancel_detail}
                      seller_custom_field={dev.seller_custom_field}
                    />
                    
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
