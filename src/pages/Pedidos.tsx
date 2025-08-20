
// src/pages/Pedidos.tsx
import { useState, useEffect } from 'react';
import { PedidosTable } from '@/components/pedidos/PedidosTable';
import { BaixaEstoqueModal } from '@/components/pedidos/BaixaEstoqueModal';
import { PedidosFilters, PedidosFiltersState } from '@/components/pedidos/PedidosFilters';
import { ColumnSelector, DEFAULT_COLUMNS, ColumnConfig } from '@/components/pedidos/ColumnSelector';
import { fetchPedidosRealtime, Row } from '@/services/orders';
import { usePedidosFilters } from '@/hooks/usePedidosFilters';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
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

  const [pedidosSelecionados, setPedidosSelecionados] = useState<Pedido[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mapeamentosVerificacao, setMapeamentosVerificacao] = useState<Map<string, MapeamentoVerificacao>>(new Map());
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { filters, setFilters, clearFilters } = usePedidosFilters();

  const loadPedidos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchPedidosRealtime({
        integration_account_id: INTEGRATION_ACCOUNT_ID,
        status: filters.situacao,
        limit: 25,
        offset: (currentPage - 1) * 25,
        enrich: true
      });
      
      setRows(result.rows);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (INTEGRATION_ACCOUNT_ID) {
      loadPedidos();
    }
  }, [INTEGRATION_ACCOUNT_ID, currentPage, filters.situacao]);

  // Função para verificar mapeamentos manualmente
  const verificarMapeamentos = async () => {
    // TODO: Implement mapping verification for Row structure
    console.log('Verificar mapeamentos - implementar para nova estrutura');
  };

  const handleSelectionChange = (selectedRows: Row[]) => {
    // Convert Row[] to Pedido[] for backward compatibility
    const pedidos: Pedido[] = selectedRows.map(row => {
      const unified = row.unified;
      const raw = row.raw;
      
      // Create a Pedido object from unified and raw data
      return {
        id: unified?.id || String(raw?.id) || '',
        numero: unified?.numero || String(raw?.id) || '',
        nome_cliente: unified?.nome_cliente || raw?.buyer?.nickname || null,
        cpf_cnpj: unified?.cpf_cnpj || null,
        data_pedido: unified?.data_pedido || raw?.date_created || null,
        data_prevista: unified?.data_prevista || raw?.date_closed || null,
        situacao: unified?.situacao || raw?.status || '',
        valor_total: unified?.valor_total || raw?.total_amount || 0,
        valor_frete: unified?.valor_frete || 0,
        valor_desconto: unified?.valor_desconto || 0,
        numero_ecommerce: unified?.numero_ecommerce || String(raw?.id) || '',
        numero_venda: unified?.numero_venda || String(raw?.id) || '',
        empresa: unified?.empresa || 'mercadolivre',
        cidade: unified?.cidade || null,
        uf: unified?.uf || null,
        codigo_rastreamento: unified?.codigo_rastreamento || null,
        url_rastreamento: unified?.url_rastreamento || null,
        obs: unified?.obs || null,
        obs_interna: unified?.obs_interna || null,
        integration_account_id: unified?.integration_account_id || '',
        created_at: unified?.created_at || raw?.date_created || null,
        updated_at: unified?.updated_at || raw?.last_updated || null,
        // Legacy fields for compatibility
        paid_amount: raw?.paid_amount || 0,
        currency_id: raw?.currency_id || 'BRL',
        coupon: raw?.coupon || null,
        date_created: raw?.date_created || null,
        date_closed: raw?.date_closed || null,
        last_updated: raw?.last_updated || null,
        pack_id: raw?.pack_id || null,
        pickup_id: raw?.pickup_id || null,
        manufacturing_ending_date: raw?.manufacturing_ending_date || null,
        comment: raw?.comment || null,
        status_detail: raw?.status_detail || null,
        tags: raw?.tags || [],
        buyer: raw?.buyer || null,
        seller: raw?.seller || null,
        shipping: raw?.shipping || null,
        // Additional fields that might be needed
        sku_estoque: null,
        sku_kit: null,
        qtd_kit: null,
        total_itens: null,
        status_estoque: 'pronto_baixar',
        id_unico: null
      } as Pedido;
    });
    
    setPedidosSelecionados(pedidos);
  };

  const handleFiltersChange = (newFilters: PedidosFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  // Estatísticas de mapeamento
  const pedidosComMapeamento = 0; // TODO: Implement for new structure
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
      </div>

      {/* Filtros */}
      <PedidosFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={clearFilters}
      />


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
          Fonte ativa: <span className="font-medium">Tempo real (Mercado Livre)</span>
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
        integrationAccountId={INTEGRATION_ACCOUNT_ID}
        hybridData={{ rows, total, fonte: 'tempo-real', loading, error, refetch: loadPedidos }}
        onSelectionChange={handleSelectionChange}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        mapeamentosVerificacao={mapeamentosVerificacao}
        visibleColumns={visibleColumns}
      />
    </div>
  );
}