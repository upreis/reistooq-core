// src/pages/Pedidos.tsx
import { useState, useEffect } from 'react';
import { PedidosTable } from '@/components/pedidos/PedidosTable';
import { BaixaEstoqueModal } from '@/components/pedidos/BaixaEstoqueModal';
import { PedidosFilters, PedidosFiltersState } from '@/components/pedidos/PedidosFilters';
import { ColumnSelector, DEFAULT_COLUMNS, ColumnConfig } from '@/components/pedidos/ColumnSelector';
import { AuditPanel } from '@/components/pedidos/AuditPanel';
import { FontePedidos } from '@/services/pedidos';
import { usePedidosFilters } from '@/hooks/usePedidosFilters';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { fetchPedidosRealtime, Row } from '@/services/orders';
import { Pedido } from '@/types/pedido';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Pedidos() {
  // Estado para conta de integração ativa
  const [integrationAccountId, setIntegrationAccountId] = useState<string | null>(null);
  const [integrationAccounts, setIntegrationAccounts] = useState<any[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  // Audit mode detection
  const isAuditMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('audit') === '1';

  const [fonteEscolhida, setFonteEscolhida] = useState<FontePedidos>('tempo-real');
  const [pedidosSelecionados, setPedidosSelecionados] = useState<Pedido[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mapeamentosVerificacao, setMapeamentosVerificacao] = useState<
    Map<string, MapeamentoVerificacao>
  >(new Map());
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);

  // unified-orders
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const { filters, setFilters, clearFilters, apiParams } = usePedidosFilters();

  // Carrega contas de integração do Mercado Livre
  const loadIntegrationAccounts = async () => {
    try {
      console.log('[Pedidos] Loading integration accounts...');
      
      const { data: accounts, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('[Pedidos] Integration accounts query result:', { accounts, error });

      if (error) {
        console.error('Error loading integration accounts:', error);
        setError(`Erro ao carregar contas: ${error.message}`);
        setIntegrationAccounts([]);
      } else {
        console.log('[Pedidos] Found accounts:', accounts?.length || 0);
        setIntegrationAccounts(accounts || []);
        // Se há contas, usa a primeira como padrão
        if (accounts && accounts.length > 0) {
          setIntegrationAccountId(accounts[0].id);
          console.log('[Pedidos] Selected account:', accounts[0].id, accounts[0].name);
        } else {
          console.log('[Pedidos] No active accounts found');
        }
      }
    } catch (err) {
      console.error('Failed to load integration accounts:', err);
      setError(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setIntegrationAccounts([]);
    } finally {
      setAccountsLoaded(true);
    }
  };

  // Carrega contas de integração no início
  useEffect(() => {
    loadIntegrationAccounts();
  }, []);

  // Carrega sempre via unified-orders (/orders/search) + envio
  const loadPedidos = async () => {
    if (!integrationAccountId) {
      setRows([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[Pedidos] Fetching orders for account:', integrationAccountId);
      
      const result = await fetchPedidosRealtime({
        integration_account_id: integrationAccountId,
        status: apiParams.status,
        limit: 25,
        offset: (currentPage - 1) * 25,
        include_shipping: true, // 👈 traz UF/Cidade/CEP/Tracking/Status do envio
        debug: isAuditMode,
        ...apiParams,
      });

      console.log('[Pedidos] Orders result:', result);
      
      setRows(result.rows);
      setTotal(result.total);
      setDebugInfo(result.debug || null);
    } catch (err: any) {
      console.error('[Pedidos] Error loading orders:', err);
      setError(err.message || 'Erro ao carregar pedidos');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (accountsLoaded && integrationAccountId) {
      loadPedidos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrationAccountId, currentPage, JSON.stringify(apiParams), accountsLoaded]);

  // Verificar mapeamentos manualmente
  const verificarMapeamentos = async () => {
    if (rows.length > 0) {
      const pedidos = rows.map((row) => ({
        id: row.unified?.id || String(row.raw?.id) || '',
        numero: row.unified?.numero || String(row.raw?.id) || '',
        obs: row.unified?.obs || '',
        sku_estoque: '',
        qtd_kit: 0,
      })) as Pedido[];

      const pedidosEnriquecidos =
        await MapeamentoService.enriquecerPedidosComMapeamento(pedidos);

      const mapeamentosMap = new Map();
      pedidosEnriquecidos.forEach((pedido) => {
        if (pedido.obs) {
          pedido.obs.split(',').forEach((sku) => {
            const skuTrimmed = sku.trim();
            mapeamentosMap.set(skuTrimmed, {
              skuPedido: skuTrimmed,
              temMapeamento: !!pedido.sku_estoque,
              skuEstoque: pedido.sku_estoque,
              quantidadeKit: pedido.qtd_kit,
            });
          });
        }
        mapeamentosMap.set(pedido.numero, {
          skuPedido: pedido.numero,
          temMapeamento: !!pedido.sku_estoque,
          skuEstoque: pedido.sku_estoque,
          quantidadeKit: pedido.qtd_kit,
        });
      });

      setMapeamentosVerificacao(mapeamentosMap);
    }
  };

  const handleFonteChange = (novaFonte: FontePedidos) => {
    // Mantemos visível o toggle, mas a fonte real é unified-orders
    setFonteEscolhida(novaFonte);
  };

  const handleSelectionChange = (selectedRows: Row[]) => {
    const pedidos = selectedRows.map((row) => ({
      id: row.unified?.id || String(row.raw?.id) || '',
      numero: row.unified?.numero || String(row.raw?.id) || '',
      obs: row.unified?.obs || '',
    })) as Pedido[];
    setPedidosSelecionados(pedidos);
  };

  const handleFiltersChange = (newFilters: PedidosFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  // Estatísticas de mapeamento
  const pedidosComMapeamento = rows.filter((row) => {
    const obs = row.unified?.obs;
    const numero = row.unified?.numero || String(row.raw?.id);

    if (obs) {
      return obs
        .split(', ')
        .some((sku) => mapeamentosVerificacao.get(sku.trim())?.temMapeamento);
    }
    return mapeamentosVerificacao.get(numero)?.temMapeamento;
  }).length;

  const pedidosSemMapeamento = rows.length - pedidosComMapeamento;

  if (!accountsLoaded) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Pedidos</h1>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Carregando contas de integração...</span>
        </div>
      </div>
    );
  }

  if (!integrationAccountId) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-semibold mb-4">Pedidos</h1>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="font-medium text-orange-800 mb-2">
            Nenhuma conta do Mercado Livre conectada
          </div>
          <p className="text-sm text-orange-700 mb-3">
            Conecte uma conta do Mercado Livre para ver os pedidos aqui.
          </p>
          <Button 
            onClick={() => window.location.href = '/configuracoes/integracoes'}
            size="sm"
          >
            Ir para Integrações
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pedidos</h1>

        {/* Toggle de Fonte (visual) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Fonte:</span>
          <div className="flex rounded-lg border bg-muted p-1">
            <Button
              variant={fonteEscolhida === 'banco' ? 'default' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => handleFonteChange('banco')}
            >
              Banco
            </Button>
            <Button
              variant={fonteEscolhida === 'tempo-real' ? 'default' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => handleFonteChange('tempo-real')}
            >
              Tempo real
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <PedidosFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={clearFilters}
      />

      {/* Audit Panel (ativar com ?audit=1) */}
      {isAuditMode && (
        <AuditPanel rows={rows} integrationAccountId={integrationAccountId} />
      )}

      {/* Estatísticas de Mapeamento */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Total de Pedidos</div>
              <div className="text-lg font-semibold">{total}</div>
            </AlertDescription>
          </Alert>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Com Mapeamento</div>
              <div className="text-lg font-semibold text-green-700">
                {pedidosComMapeamento}
              </div>
            </AlertDescription>
          </Alert>

          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Sem Mapeamento</div>
              <div className="text-lg font-semibold text-orange-700">
                {pedidosSemMapeamento}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Ações de Baixa de Estoque */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={verificarMapeamentos}>
            Verificar Mapeamentos
          </Button>

          <ColumnSelector columns={visibleColumns} onColumnsChange={setVisibleColumns} />

          {pedidosSelecionados.length > 0 && (
            <BaixaEstoqueModal
              pedidos={pedidosSelecionados}
              trigger={
                <Button variant="default" size="sm">
                  <Package className="h-4 w-4 mr-1" />
                  Baixar Estoque ({pedidosSelecionados.length})
                </Button>
              }
            />
          )}

          {pedidosSelecionados.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {pedidosSelecionados.length} pedido
              {pedidosSelecionados.length === 1 ? '' : 's'} selecionado
              {pedidosSelecionados.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Fonte ativa: <span className="font-medium">Unified Orders (/orders/search)</span>
          {integrationAccounts.length > 0 && (
            <span className="ml-2">
              • Conta: {integrationAccounts.find(acc => acc.id === integrationAccountId)?.name || 'Desconhecida'}
            </span>
          )}
          {isAuditMode && <span className="ml-2 text-orange-600">[AUDIT MODE]</span>}
        </div>
      </div>

      {/* Informações sobre Baixa de Estoque */}
      <Alert className="border-blue-200 bg-blue-50">
        <Package className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">Baixa Manual de Estoque</div>
          <div className="text-sm mt-1">
            Selecione pedidos e clique em "Baixar Estoque" para processar manualmente.
            Use "Verificar Mapeamentos" para atualizar o status dos pedidos.
            <br />
            <strong>Linhas verdes:</strong> pedidos com mapeamento configurado |{' '}
            <strong>Linhas laranjas:</strong> pedidos sem mapeamento
          </div>
        </AlertDescription>
      </Alert>

      <PedidosTable
        rows={rows}
        total={total}
        loading={loading}
        error={error}
        onRefresh={loadPedidos}
        onSelectionChange={handleSelectionChange}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        mapeamentosVerificacao={mapeamentosVerificacao}
        visibleColumns={visibleColumns}
        debugInfo={debugInfo}
      />
    </div>
  );
}
