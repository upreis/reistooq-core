// src/pages/Pedidos.tsx
import { useState, useEffect, useCallback } from 'react';
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
import { Info, Package, AlertTriangle, CheckCircle, LogIn, RefreshCw } from 'lucide-react';

// ======== NOVO: helpers de conexão Mercado Livre ========

function buildAuthorizeUrl() {
  // usa a env se existir; senão, usa seu client_id fixo
  const CLIENT_ID =
    (import.meta.env?.VITE_ML_CLIENT_ID as string) || '2053972567766696';

  const redirectUri =
    'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/smooth-service';

  const state = crypto.randomUUID(); // opcional: você pode guardar no localStorage se quiser validar depois

  const url =
    'https://auth.mercadolibre.com.br/authorization' +
    '?response_type=code' +
    `&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  return { url, state };
}


function openMlPopup(url: string) {
  const w = 600, h = 700;
  const y = window.top?.outerHeight ? (window.top.outerHeight - h) / 2 : 100;
  const x = window.top?.outerWidth ? (window.top.outerWidth - w) / 2 : 100;
  return window.open(
    url,
    'ml_oauth',
    `width=${w},height=${h},left=${x},top=${y},menubar=no,toolbar=no,status=no,scrollbars=yes`
  );
}

// ========================================================

export default function Pedidos() {
  // integration_account_id agora vem do localStorage OU do env (fallback)
  const [integrationId, setIntegrationId] = useState<string>(() =>
    localStorage.getItem('integration_account_id') ||
    // @ts-ignore - VITE_ vars are available at build time
    (import.meta.env.VITE_INTEGRATION_ACCOUNT_ID as string) ||
    ''
  );

  const isAuditMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('audit') === '1';

  const [fonteEscolhida, setFonteEscolhida] = useState<FontePedidos>('tempo-real');
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const [mapeamentosVerificacao, setMapeamentosVerificacao] =
    useState<Map<string, MapeamentoVerificacao>>(new Map());
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [pedidosSelecionados, setPedidosSelecionados] = useState<Pedido[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { filters, setFilters, clearFilters, apiParams } = usePedidosFilters();

  // ======== NOVO: listener para receber sucesso/erro do smooth-service ========
  useEffect(() => {
    const { redirectOrigin } = buildAuthorizeUrl();
    const onMessage = (e: MessageEvent) => {
      try {
        // Segurança: só aceita mensagens do seu Supabase
        if (e.origin !== redirectOrigin) return;

        const data = e.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'oauth_success' && data.provider === 'mercadolivre') {
          const id = data.integration_account_id as string;
          if (id) {
            localStorage.setItem('integration_account_id', id);
            setIntegrationId(id);
            alert('Conta Mercado Livre conectada com sucesso!');
            // Recarrega a página 1 com os novos pedidos
            setCurrentPage(1);
          }
        } else if (data.type === 'oauth_error') {
          alert(`Erro na integração: ${data.description || data.error || 'desconhecido'}`);
        }
      } catch {}
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  // ============================================================================

  const loadPedidos = useCallback(async () => {
    if (!integrationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchPedidosRealtime({
        integration_account_id: integrationId,
        status: apiParams.status,
        limit: 25,
        offset: (currentPage - 1) * 25,
        include_shipping: true, // 👈 já traz UF/Cidade/CEP/Tracking
        ...apiParams,
      });

      setRows(result.rows);
      setTotal(result.total);
      setDebugInfo(result.debug || null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pedidos');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [integrationId, currentPage, apiParams]);

  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  const handleFonteChange = (novaFonte: FontePedidos) => {
    setFonteEscolhida(novaFonte); // visual apenas
  };

  const handleSelectionChange = (selectedRows: Row[]) => {
    const pedidos = selectedRows.map(row => ({
      id: row.unified?.id || String(row.raw?.id) || '',
      numero: row.unified?.numero || String(row.raw?.id) || '',
      obs: row.unified?.obs || ''
    })) as Pedido[];
    setPedidosSelecionados(pedidos);
  };

  const handleFiltersChange = (newFilters: PedidosFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Estatísticas de mapeamento
  const pedidosComMapeamento = rows.filter(row => {
    const obs = row.unified?.obs;
    const numero = row.unified?.numero || String(row.raw?.id);
    if (obs) {
      return obs.split(', ').some(sku =>
        mapeamentosVerificacao.get(sku.trim())?.temMapeamento
      );
    }
    return mapeamentosVerificacao.get(numero)?.temMapeamento;
  }).length;
  const pedidosSemMapeamento = rows.length - pedidosComMapeamento;

  // ======== NOVO: Ações de conexão =========
  const conectarMercadoLivre = () => {
    try {
      const { url } = buildAuthorizeUrl();
      const win = openMlPopup(url);
      if (!win) alert('Permita pop-ups para continuar a conexão.');
    } catch {}
  };

  const trocarConta = () => {
    localStorage.removeItem('integration_account_id');
    setIntegrationId('');
    setRows([]);
    setTotal(0);
    alert('Conta desconectada. Clique em "Conectar Mercado Livre" para vincular outra.');
  };
  // =========================================

  // Empty state quando não há integração ainda
  if (!integrationId) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Pedidos</h1>
        <Alert className="border-blue-200 bg-blue-50 mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Conecte sua conta do <strong>Mercado Livre</strong> para listar pedidos em tempo real.
          </AlertDescription>
        </Alert>
        <Button onClick={conectarMercadoLivre}>
          <LogIn className="h-4 w-4 mr-2" />
          Conectar Mercado Livre
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Pedidos</h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={conectarMercadoLivre} title="Conectar nova conta">
            <LogIn className="h-4 w-4 mr-1" />
            Conectar outra conta
          </Button>
          <Button variant="ghost" size="sm" onClick={trocarConta} title="Desvincular conta atual">
            Desconectar
          </Button>
          <Button variant="outline" size="sm" onClick={loadPedidos} title="Recarregar">
            <RefreshCw className="h-4 w-4 mr-1" /> Recarregar
          </Button>
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
        <AuditPanel
          rows={rows}
          integrationAccountId={integrationId}
        />
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
              <div className="text-lg font-semibold text-green-700">{pedidosComMapeamento}</div>
            </AlertDescription>
          </Alert>

          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Sem Mapeamento</div>
              <div className="text-lg font-semibold text-orange-700">{pedidosSemMapeamento}</div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Ações + Toggle de Fonte (visual) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={async () => {
            // Verificar mapeamentos usando as linhas atuais
            if (rows.length > 0) {
              const pedidos = rows.map(row => ({
                id: row.unified?.id || String(row.raw?.id) || '',
                numero: row.unified?.numero || String(row.raw?.id) || '',
                obs: row.unified?.obs || '',
                sku_estoque: '',
                qtd_kit: 0
              })) as Pedido[];

              const pedidosEnriquecidos = await MapeamentoService.enriquecerPedidosComMapeamento(pedidos);

              const mapeamentosMap = new Map<string, MapeamentoVerificacao>();
              pedidosEnriquecidos.forEach(pedido => {
                if (pedido.obs) {
                  pedido.obs.split(',').forEach(skuRaw => {
                    const sku = skuRaw.trim();
                    mapeamentosMap.set(sku, {
                      skuPedido: sku,
                      temMapeamento: !!pedido.sku_estoque,
                      skuEstoque: pedido.sku_estoque || '',
                      quantidadeKit: pedido.qtd_kit || 0
                    });
                  });
                }
                mapeamentosMap.set(pedido.numero, {
                  skuPedido: pedido.numero,
                  temMapeamento: !!pedido.sku_estoque,
                  skuEstoque: pedido.sku_estoque || '',
                  quantidadeKit: pedido.qtd_kit || 0
                });
              });

              setMapeamentosVerificacao(mapeamentosMap);
            }
          }}>
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
        </div>

        <div className="text-sm text-muted-foreground">
          Fonte ativa: <span className="font-medium">Unified Orders (/orders/search)</span>
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
            <strong>Linhas verdes:</strong> pedidos com mapeamento configurado | <strong>Linhas laranjas:</strong> pedidos sem mapeamento
          </div>
        </AlertDescription>
      </Alert>

      <PedidosTable
        rows={rows}
        total={total}
        loading={loading}
        error={error}
        onRefresh={loadPedidos}
        onSelectionChange={setPedidosSelecionados as any}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        mapeamentosVerificacao={mapeamentosVerificacao}
        visibleColumns={visibleColumns}
        debugInfo={debugInfo}
      />
    </div>
  );
}
