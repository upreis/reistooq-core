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
import { Loader2, Scale, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DevolucaoDetailModal } from '@/components/devolucoes/DevolucaoDetailModal';
import { StatusBadge } from '@/components/devolucoes/StatusBadge';
import { DevolucaoFilters } from '@/components/devolucoes/DevolucaoFilters';
import { TrackingPriorityCells } from '@/components/ml/devolucao/cells/TrackingPriorityCells';
import { FinancialDetailedCells } from '@/components/ml/devolucao/cells/FinancialDetailedCells';
import { TrackingDetailedCells } from '@/components/ml/devolucao/cells/TrackingDetailedCells';
import { MediationDetailedCells } from '@/components/ml/devolucao/cells/MediationDetailedCells';
import { MetadataCells } from '@/components/ml/devolucao/cells/MetadataCells';
import { 
  LocalizacaoAtualCell, 
  StatusTransporteCell, 
  TempoTransitoCell, 
  PrevisaoChegadaCell 
} from '@/components/devolucoes/ShippingAdvancedCells';
import { LogisticTypeCell } from '@/components/devolucoes/LogisticTypeCell';
import { SubtipoCell } from '@/components/devolucoes/SubtipoCell';
import { CustosLogisticaCell } from '@/components/devolucoes/CustosLogisticaCell';
import { ProductInfoCell } from '@/components/devolucoes/ProductInfoCell';
import { StatusReturnCell } from '@/components/devolucoes/StatusReturnCell';
import { StatusMoneyCell } from '@/components/devolucoes/StatusMoneyCell';
import { StatusShipmentCell } from '@/components/devolucoes/StatusShipmentCell';
import { StatusClaimCell } from '@/components/devolucoes/StatusClaimCell';
import { TipoEnvioCell } from '@/components/devolucoes/TipoEnvioCell';
import { EnderecoDestinoCell } from '@/components/devolucoes/EnderecoDestinoCell';
import { WarehouseIndicatorCell } from '@/components/devolucoes/WarehouseIndicatorCell';
import { ShippingModeCell } from '@/components/devolucoes/ShippingModeCell';
import { EstimatedDeliveryCell } from '@/components/devolucoes/EstimatedDeliveryCell';
import { PrevisaoEntregaCell } from '@/components/devolucoes/PrevisaoEntregaCell';
import { ResponsavelFreteCell } from '@/components/devolucoes/ResponsavelFreteCell';
import { TransportadoraCell } from '@/components/devolucoes/TransportadoraCell';
import { OpcaoFreteCell } from '@/components/devolucoes/OpcaoFreteCell';
import { PrazoEstimadoCell } from '@/components/devolucoes/PrazoEstimadoCell';
import { MetodoEnvioCell } from '@/components/devolucoes/MetodoEnvioCell';
import { HistoricoStatusCell } from '@/components/devolucoes/HistoricoStatusCell';
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
  
  // 📸 PRODUCT INFO (imagem, SKU, preço, link)
  product_info?: {
    id?: string;
    title?: string;
    price?: number;
    currency_id?: string;
    thumbnail?: string | null;
    permalink?: string;
    sku?: string | null;
    condition?: string;
    available_quantity?: number;
    sold_quantity?: number;
  } | null;
  
  // 🆕 TODOS OS 4 TIPOS DE STATUS
  status_return?: string | null;      // Status da devolução (14 estados)
  status_money?: string | null;       // Status do dinheiro (retained/refunded/available)
  status_shipment?: string | null;    // Status do shipment (pending/shipped/delivered/etc)
  status_claim?: string | null;       // Status do claim (opened/closed)
  
  // 🆕 TIPO DE ENVIO DA DEVOLUÇÃO (da doc oficial ML)
  tipo_envio_devolucao?: string | null;  // return ou return_from_triage
  destino_devolucao?: string | null;     // warehouse ou seller_address
  endereco_destino_devolucao?: string | null;
  rua_destino?: string | null;
  numero_destino?: string | null;
  cidade_destino?: string | null;
  estado_destino?: string | null;
  cep_destino?: string | null;
  bairro_destino?: string | null;
  
  
  
  // 🚚 TIPO DE LOGÍSTICA
  tipo_logistica?: string | null;
  
  // 🚢 MODO DE ENVIO (shipping mode) - IGUAL /pedidos
  shipping_mode?: string | null;
  
  // 📅 DATA DE ENTREGA ESTIMADA
  estimated_delivery_date?: string | null;
  
  // ✅ FASE 1: Novos campos de shipment
  carrier_name?: string | null;
  carrier_tracking_url?: string | null;
  shipping_option_name?: string | null;
  
  // ✅ FASE 2: Novos campos de prazo
  estimated_delivery_time?: string | null;
  estimated_delivery_time_type?: string | null;
  
  // ✅ FASE 3: Método de envio e histórico
  shipping_method_name?: string | null;
  tracking_method?: string | null;
  status_history?: any[] | null;
  
  // ✅ FASE 2: SHIPPING AVANÇADO - 4 campos críticos
  localizacao_atual_produto?: string | null;
  status_transporte_atual?: string | null;
  tempo_transito_dias?: number | null;
  previsao_chegada_vendedor?: string | null;
  
  // ✅ PRIORIDADE ALTA - 7 campos
  has_delay?: boolean | null;
  return_quantity?: number | null;
  total_quantity?: number | null;
  qualidade_comunicacao?: string | null;
  numero_interacoes?: number | null;
  mediador_ml?: string | null;
  transaction_id?: string | null;
  
  // ✅ FINANCEIRO DETALHADO - 8 campos (status_dinheiro já declarado acima)
  metodo_reembolso?: string | null;
  moeda_reembolso?: string | null;
  percentual_reembolsado?: number | null;
  valor_diferenca_troca?: number | null;
  taxa_ml_reembolso?: number | null;
  custo_devolucao?: number | null;
  parcelas?: number | null;
  valor_parcela?: number | null;
  
  // ✅ CUSTOS LOGÍSTICA
  custo_total_logistica?: number | null;
  custo_envio_original?: number | null;
  responsavel_custo_frete?: string | null;
  // ❌ FASE 4 REMOVIDO: shipping_fee, handling_fee, insurance, taxes
  // Motivo: API ML não retorna breakdown individualizado (sempre 0 nos logs)
  
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
  data_fechamento_devolucao?: string | null;
  prazo_limite_analise?: string | null;
  dias_restantes_analise?: number | null;
  codigo_rastreamento?: string | null;
  
  // ✅ COMUNICAÇÃO DETALHADA - 6 campos
  timeline_events?: any[] | null;
  marcos_temporais?: any | null;
  data_criacao_claim?: string | null;
  data_inicio_return?: string | null;
  data_fechamento_claim?: string | null;
  historico_status?: any[] | null;
  
  // ✅ MEDIAÇÃO DETALHADA - 7 campos
  em_mediacao?: boolean | null;
  eh_troca?: boolean | null;
  data_estimada_troca?: string | null;
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
                <TableHead>📸 Produto</TableHead>
                
                {/* 🆕 TODOS OS 4 TIPOS DE STATUS */}
                <TableHead>📋 Status Claim</TableHead>
                <TableHead>📦 Status Return</TableHead>
                <TableHead>💰 Status Money</TableHead>
                <TableHead>🚚 Status Shipment</TableHead>
                
                <TableHead>🏷️ Subtipo</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>🚚 Tipo Logística</TableHead>
                <TableHead>🚢 Modo Envio</TableHead>
                <TableHead>📅 Entrega Estimada</TableHead>
                <TableHead>📮 Tipo Envio</TableHead>
                <TableHead>📍 Endereço Destino</TableHead>
                <TableHead>🏭 Triagem ML</TableHead>
                
                {/* PRIORIDADE ALTA - 7 colunas */}
                <TableHead>📅 Previsão Entrega</TableHead>
                <TableHead>⏰ Atraso?</TableHead>
                <TableHead>📦 Qtd</TableHead>
                <TableHead>💬 Qualidade</TableHead>
                <TableHead>🔢 Interações</TableHead>
                <TableHead>⚖️ Mediador</TableHead>
                <TableHead>💳 Transaction ID</TableHead>
                
                {/* FINANCEIRO DETALHADO - 8 colunas (removido breakdown zerado) */}
                <TableHead>💰 Status $</TableHead>
                <TableHead>💸 Método Pag.</TableHead>
                <TableHead>💱 Moeda</TableHead>
                <TableHead>📊 % Reemb.</TableHead>
                <TableHead>🔄 Dif. Troca</TableHead>
                <TableHead>📦 Custo Dev.</TableHead>
                <TableHead>📤 Custo Envio</TableHead>
                <TableHead>👤 Resp. Frete</TableHead>
                
                {/* CUSTOS LOGÍSTICA */}
                <TableHead>💰 Custos Logística</TableHead>
                
                
                {/* 🆕 FASE 1: TRANSPORTADORA */}
                <TableHead>🚚 Transportadora</TableHead>
                
                {/* 🆕 FASE 2: OPÇÃO FRETE E PRAZO */}
                <TableHead>📦 Opção Frete</TableHead>
                <TableHead>⏰ Prazo Estimado</TableHead>
                
                {/* 🆕 FASE 3: MÉTODO ENVIO E HISTÓRICO */}
                <TableHead>🚢 Método Envio</TableHead>
                <TableHead>📜 Histórico Status</TableHead>
                
                {/* 🆕 FASE 2: SHIPPING AVANÇADO - 4 colunas ANTES dos detalhados */}
                <TableHead>📍 Localização Produto</TableHead>
                <TableHead>🚛 Status Transporte</TableHead>
                <TableHead>⏱️ Tempo Trânsito</TableHead>
                <TableHead>📅 Previsão Chegada</TableHead>
                
                {/* RASTREAMENTO DETALHADO - REMOVIDO (dados não disponíveis) */}
                
                {/* MEDIAÇÃO DETALHADA - 2 colunas (simplificado) */}
                <TableHead>⚖️ Em Mediação?</TableHead>
                <TableHead>🔄 É Troca?</TableHead>
                
                {/* METADADOS - REMOVIDO (sempre vazios) */}
                
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>📦 Data Chegada</TableHead>
                <TableHead>⏰ Prazo Análise</TableHead>
                <TableHead>💰 Status Dinheiro</TableHead>
                <TableHead>📦 Status Envio</TableHead>
                <TableHead>🏭 Destino</TableHead>
                <TableHead>🔄 Status Return</TableHead>
                <TableHead>💵 Reembolso Em</TableHead>
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
                    <TableCell>
                      <ProductInfoCell productInfo={dev.product_info} />
                    </TableCell>
                    
                    {/* 🆕 TODOS OS 4 TIPOS DE STATUS */}
                    <TableCell>
                      <StatusClaimCell status={dev.status?.id || dev.status} />
                    </TableCell>
                    <TableCell>
                      <StatusReturnCell status={dev.status_return} />
                    </TableCell>
                    <TableCell>
                      <StatusMoneyCell status={dev.status_money} />
                    </TableCell>
                    <TableCell>
                      <StatusShipmentCell status={dev.status_shipment} />
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
                    
                    {/* 🚢 MODO DE ENVIO */}
                    <TableCell>
                      <ShippingModeCell shipping_mode={dev.shipping_mode} />
                    </TableCell>
                    
                    {/* 📅 DATA DE ENTREGA ESTIMADA */}
                    <TableCell>
                      <EstimatedDeliveryCell estimated_delivery_date={dev.estimated_delivery_date} />
                    </TableCell>
                    
                    {/* 📮 TIPO DE ENVIO DA DEVOLUÇÃO */}
                    <TableCell>
                      <TipoEnvioCell 
                        tipo_envio_devolucao={dev.tipo_envio_devolucao}
                        destino_devolucao={dev.destino_devolucao}
                      />
                    </TableCell>
                    
                    {/* 📍 ENDEREÇO DESTINO */}
                    <TableCell>
                      <EnderecoDestinoCell
                        endereco_destino_devolucao={dev.endereco_destino_devolucao}
                        rua_destino={dev.rua_destino}
                        numero_destino={dev.numero_destino}
                        cidade_destino={dev.cidade_destino}
                        estado_destino={dev.estado_destino}
                        cep_destino={dev.cep_destino}
                        bairro_destino={dev.bairro_destino}
                      />
                    </TableCell>
                    
                    {/* 🏭 INDICADOR TRIAGEM ML */}
                    <TableCell>
                      <WarehouseIndicatorCell
                        destino_devolucao={dev.destino_devolucao}
                        tipo_envio_devolucao={dev.tipo_envio_devolucao}
                        status_shipment={dev.status_shipment}
                      />
                    </TableCell>
                    
                    {/* PRIORIDADE ALTA - 7 colunas */}
                    <TrackingPriorityCells
                      prazo_limite_analise={dev.prazo_limite_analise}
                      has_delay={dev.has_delay}
                      return_quantity={dev.return_quantity}
                      total_quantity={dev.total_quantity}
                      qualidade_comunicacao={dev.qualidade_comunicacao}
                      numero_interacoes={dev.numero_interacoes}
                      mediador_ml={dev.mediador_ml}
                      transaction_id={dev.transaction_id}
                    />
                    
                    {/* FINANCEIRO DETALHADO - 8 colunas (FASE 1: removido breakdown zerado) */}
                    <FinancialDetailedCells
                      status_dinheiro={dev.status_money}
                      metodo_pagamento={dev.metodo_pagamento}
                      moeda_reembolso={dev.moeda_reembolso}
                      percentual_reembolsado={dev.percentual_reembolsado}
                      valor_diferenca_troca={dev.valor_diferenca_troca}
                      custo_devolucao={dev.custo_devolucao}
                      custo_envio_original={dev.custo_envio_original}
                      responsavel_custo_frete={dev.responsavel_custo_frete}
                    />
                    
                    {/* CUSTOS LOGÍSTICA (FASE 1: breakdown removido internamente) */}
                    <TableCell>
                      <CustosLogisticaCell
                        custo_total_logistica={dev.custo_total_logistica}
                        custo_envio_original={dev.custo_envio_original}
                        custo_devolucao={dev.custo_devolucao}
                        responsavel_custo_frete={dev.responsavel_custo_frete}
                      />
                    </TableCell>
                    
                    {/* 🆕 FASE 1: TRANSPORTADORA */}
                    <TableCell>
                      <TransportadoraCell
                        carrier_name={dev.carrier_name}
                        carrier_tracking_url={dev.carrier_tracking_url}
                        tracking_number={dev.codigo_rastreamento}
                      />
                    </TableCell>
                    
                    {/* 🆕 FASE 2: OPÇÃO FRETE E PRAZO */}
                    <TableCell>
                      <OpcaoFreteCell shipping_option_name={dev.shipping_option_name} />
                    </TableCell>
                    <TableCell>
                      <PrazoEstimadoCell 
                        estimated_delivery_time={dev.estimated_delivery_time}
                        estimated_delivery_time_type={dev.estimated_delivery_time_type}
                      />
                    </TableCell>
                    
                    {/* 🆕 FASE 3: MÉTODO ENVIO E HISTÓRICO */}
                    <TableCell>
                      <MetodoEnvioCell 
                        shipping_method_name={dev.shipping_method_name}
                        tracking_method={dev.tracking_method}
                      />
                    </TableCell>
                    <TableCell>
                      <HistoricoStatusCell status_history={dev.status_history} />
                    </TableCell>
                    
                    {/* 🆕 FASE 2: SHIPPING AVANÇADO - 4 colunas */}
                    <LocalizacaoAtualCell devolucao={dev} />
                    <StatusTransporteCell devolucao={dev} />
                    <TempoTransitoCell devolucao={dev} />
                    <PrevisaoChegadaCell devolucao={dev} />
                    
                    {/* MEDIAÇÃO SIMPLIFICADA - 2 colunas */}
                    <TableCell className="text-sm">
                      {dev.em_mediacao === true ? (
                        <Badge variant="default" className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                          <Scale className="h-3 w-3" />
                          Em Mediação
                        </Badge>
                      ) : dev.em_mediacao === false ? (
                        <Badge variant="secondary">Sem Mediação</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-sm">
                      {dev.eh_troca === true ? (
                        <Badge variant="default" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          <RefreshCw className="h-3 w-3" />
                          Troca
                        </Badge>
                      ) : dev.eh_troca === false ? (
                        <Badge variant="secondary">Reembolso</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                    <TableCell>
                      {dev.data_fechamento_devolucao 
                        ? new Date(dev.data_fechamento_devolucao).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {(() => {
                        if (!dev.data_fechamento_devolucao) return '-';
                        
                        const dataChegada = new Date(dev.data_fechamento_devolucao);
                        const hoje = new Date();
                        
                        // Adicionar 3 dias úteis à data de chegada
                        let prazoLimite = new Date(dataChegada);
                        let diasAdicionados = 0;
                        
                        while (diasAdicionados < 3) {
                          prazoLimite.setDate(prazoLimite.getDate() + 1);
                          const diaSemana = prazoLimite.getDay();
                          // Pular sábado (6) e domingo (0)
                          if (diaSemana !== 0 && diaSemana !== 6) {
                            diasAdicionados++;
                          }
                        }
                        
                        // Calcular dias restantes
                        const diffTime = prazoLimite.getTime() - hoje.getTime();
                        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        const vencido = diasRestantes < 0;
                        const urgente = diasRestantes >= 0 && diasRestantes <= 1;
                        
                        return (
                          <div className="flex items-center gap-2">
                            <span className={vencido ? 'text-red-500 font-semibold' : urgente ? 'text-orange-500 font-semibold' : ''}>
                              {prazoLimite.toLocaleDateString('pt-BR')}
                            </span>
                            {vencido && <Badge variant="destructive">Vencido</Badge>}
                            {urgente && <Badge variant="outline" className="bg-orange-100">Urgente</Badge>}
                          </div>
                        );
                      })()}
                    </TableCell>

                    {/* Status Dinheiro */}
                    <TableCell>
                      <StatusMoneyCell status={(dev as any).status_dinheiro} />
                    </TableCell>

                    {/* Status Envio (shipment status) */}
                    <TableCell>
                      {(dev as any).status_envio ? (
                        <Badge variant={
                          (dev as any).status_envio === 'delivered' ? 'default' :
                          (dev as any).status_envio === 'shipped' ? 'secondary' :
                          (dev as any).status_envio === 'cancelled' ? 'destructive' :
                          'outline'
                        }>
                          {(dev as any).status_envio === 'pending' && '⏳ Pendente'}
                          {(dev as any).status_envio === 'ready_to_ship' && '📦 Pronto'}
                          {(dev as any).status_envio === 'shipped' && '🚚 Enviado'}
                          {(dev as any).status_envio === 'delivered' && '✅ Entregue'}
                          {(dev as any).status_envio === 'not_delivered' && '❌ Não Entregue'}
                          {(dev as any).status_envio === 'cancelled' && '🚫 Cancelado'}
                          {!['pending', 'ready_to_ship', 'shipped', 'delivered', 'not_delivered', 'cancelled'].includes((dev as any).status_envio) && (dev as any).status_envio}
                        </Badge>
                      ) : '-'}
                    </TableCell>

                    {/* Destino (warehouse indicator) */}
                    <TableCell>
                      <WarehouseIndicatorCell 
                        destino_devolucao={(dev as any).destino_devolucao}
                        tipo_envio_devolucao={(dev as any).tipo_envio_devolucao}
                        status_shipment={(dev as any).status_envio}
                      />
                    </TableCell>

                    {/* Status Return (status da devolução) */}
                    <TableCell>
                      {(dev as any).status_return ? (
                        <Badge variant={
                          (dev as any).status_return === 'delivered' ? 'default' :
                          (dev as any).status_return === 'cancelled' ? 'destructive' :
                          (dev as any).status_return === 'expired' ? 'destructive' :
                          (dev as any).status_return === 'shipped' ? 'secondary' :
                          'outline'
                        }>
                          {(dev as any).status_return}
                        </Badge>
                      ) : '-'}
                    </TableCell>

                    {/* Reembolso Em (refund_at) */}
                    <TableCell>
                      {(dev as any).data_reembolso ? (
                        <Badge variant="outline">
                          {(dev as any).data_reembolso === 'shipped' && '🚚 No Envio'}
                          {(dev as any).data_reembolso === 'delivered' && '📦 Após Entrega (3 dias)'}
                          {(dev as any).data_reembolso === 'n/a' && '💰 Sem Devolução'}
                          {!['shipped', 'delivered', 'n/a'].includes((dev as any).data_reembolso) && (dev as any).data_reembolso}
                        </Badge>
                      ) : '-'}
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
