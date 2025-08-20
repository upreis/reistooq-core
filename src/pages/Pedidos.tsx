
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

export default function Pedidos() {
  // Buscar de múltiplas fontes: prop > env > hardcoded
  const INTEGRATION_ACCOUNT_ID = 
    // @ts-ignore - VITE_ vars are available at build time
    import.meta.env.VITE_INTEGRATION_ACCOUNT_ID || 
    '5740f717-1771-4298-b8c9-464ffb8d8dce';

  // Audit mode detection
  const isAuditMode = new URLSearchParams(window.location.search).get('audit') === '1';

  const [fonteEscolhida, setFonteEscolhida] = useState<FontePedidos>('tempo-real');
  const [forceFonte, setForceFonte] = useState<FontePedidos | undefined>();
  const [pedidosSelecionados, setPedidosSelecionados] = useState<Pedido[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mapeamentosVerificacao, setMapeamentosVerificacao] = useState<Map<string, MapeamentoVerificacao>>(new Map());
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  
  // New state for unified orders data
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const { filters, setFilters, clearFilters, apiParams } = usePedidosFilters();
  
  // Carrega sempre via unified-orders (/orders/search)
  const loadPedidos = async () => {
    if (!INTEGRATION_ACCOUNT_ID) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchPedidosRealtime({
        integration_account_id: INTEGRATION_ACCOUNT_ID,
        status: apiParams.status,
        limit: 25,
        offset: (currentPage - 1) * 25,
        ...apiParams
      });
      
      setRows(result.rows);
      setTotal(result.total);
      setDebugInfo(result.debug || null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadPedidos();
  }, [INTEGRATION_ACCOUNT_ID, currentPage, apiParams]);

  // Função para verificar mapeamentos manualmente
  const verificarMapeamentos = async () => {
    if (rows.length > 0) {
      // Convert Row[] back to Pedido[] for existing service
      const pedidos = rows.map(row => ({
        id: row.unified?.id || String(row.raw?.id) || '',
        numero: row.unified?.numero || String(row.raw?.id) || '',
        obs: row.unified?.obs || '', 
        sku_estoque: '', // Will be enriched
        qtd_kit: 0 // Will be enriched
      })) as Pedido[];
      
      const pedidosEnriquecidos = await MapeamentoService.enriquecerPedidosComMapeamento(pedidos);
      
      // Criar o mapa de verificação para compatibilidade com o código existente
      const mapeamentosMap = new Map();
      pedidosEnriquecidos.forEach(pedido => {
        if (pedido.obs) {
          pedido.obs.split(',').forEach(sku => {
            const skuTrimmed = sku.trim();
            mapeamentosMap.set(skuTrimmed, {
              skuPedido: skuTrimmed,
              temMapeamento: !!pedido.sku_estoque,
              skuEstoque: pedido.sku_estoque,
              quantidadeKit: pedido.qtd_kit
            });
          });
        }
        mapeamentosMap.set(pedido.numero, {
          skuPedido: pedido.numero,
          temMapeamento: !!pedido.sku_estoque,
          skuEstoque: pedido.sku_estoque,
          quantidadeKit: pedido.qtd_kit
        });
      });
      
      setMapeamentosVerificacao(mapeamentosMap);
    }
  };
  
  const handleFonteChange = (novaFonte: FontePedidos) => {
    // Mantemos visível o toggle, mas a fonte real é sempre unified-orders (tempo-real)
    setFonteEscolhida(novaFonte);
    setForceFonte('tempo-real');
  };

  const handleSelectionChange = (selectedRows: Row[]) => {
    // Convert Row[] to Pedido[] for backward compatibility
    const pedidos = selectedRows.map(row => ({
      id: row.unified?.id || String(row.raw?.id) || '',
      numero: row.unified?.numero || String(row.raw?.id) || '',
      obs: row.unified?.obs || ''
    })) as Pedido[];
    setPedidosSelecionados(pedidos);
  };

  const handleFiltersChange = (newFilters: PedidosFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset para primeira página ao filtrar
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

  if (!INTEGRATION_ACCOUNT_ID) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">Pedidos</h1>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="font-medium text-destructive">
            Defina INTEGRATION_ACCOUNT_ID para carregar pedidos
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        
        {/* Toggle de Fonte */}
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
        <AuditPanel 
          rows={rows} 
          integrationAccountId={INTEGRATION_ACCOUNT_ID}
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

      {/* Ações de Baixa de Estoque */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={verificarMapeamentos}>
            Verificar Mapeamentos
          </Button>
          
          <ColumnSelector
            columns={visibleColumns}
            onColumnsChange={setVisibleColumns}
          />
          
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
              {pedidosSelecionados.length} pedido{pedidosSelecionados.length === 1 ? '' : 's'} selecionado{pedidosSelecionados.length === 1 ? '' : 's'}
            </span>
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