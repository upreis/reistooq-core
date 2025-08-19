
// src/pages/Pedidos.tsx
import { useState, useEffect } from 'react';
import { PedidosTable } from '@/components/pedidos/PedidosTable';
import { BaixaEstoqueModal } from '@/components/pedidos/BaixaEstoqueModal';
import { PedidosFilters, PedidosFiltersState } from '@/components/pedidos/PedidosFilters';
import { usePedidosHybrid, FontePedidos } from '@/services/pedidos';
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

  const [fonteEscolhida, setFonteEscolhida] = useState<FontePedidos>('banco');
  const [forceFonte, setForceFonte] = useState<FontePedidos | undefined>();
  const [pedidosSelecionados, setPedidosSelecionados] = useState<Pedido[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mapeamentosVerificacao, setMapeamentosVerificacao] = useState<Map<string, MapeamentoVerificacao>>(new Map());
  
  const { filters, setFilters, clearFilters, apiParams } = usePedidosFilters();
  
  const { rows, total, fonte, loading, error, refetch } = usePedidosHybrid({
    integrationAccountId: INTEGRATION_ACCOUNT_ID,
    page: currentPage,
    pageSize: 25,
    ...apiParams,
    forceFonte
  });

  // Função para verificar mapeamentos manualmente
  const verificarMapeamentos = async () => {
    if (rows.length > 0) {
      const pedidosEnriquecidos = await MapeamentoService.enriquecerPedidosComMapeamento(rows);
      
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
    setFonteEscolhida(novaFonte);
    setForceFonte(novaFonte);
  };

  const handleSelectionChange = (selectedRows: Pedido[]) => {
    setPedidosSelecionados(selectedRows);
  };

  const handleFiltersChange = (newFilters: PedidosFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  // Estatísticas de mapeamento
  const pedidosComMapeamento = rows.filter(pedido => {
    if (pedido.obs) {
      return pedido.obs.split(', ').some(sku => 
        mapeamentosVerificacao.get(sku.trim())?.temMapeamento
      );
    }
    return mapeamentosVerificacao.get(pedido.numero)?.temMapeamento;
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

      {/* Alerta de Fallback */}
      {fonte === 'tempo-real' && fonteEscolhida === 'banco' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Sem dados na tabela. Exibindo pedidos em tempo real (Mercado Livre).
          </AlertDescription>
        </Alert>
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
          Fonte ativa: <span className="font-medium">{fonte === 'banco' ? 'Banco de dados' : 'Tempo real (Mercado Livre)'}</span>
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
        hybridData={{ rows, total, fonte, loading, error, refetch }}
        onSelectionChange={handleSelectionChange}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        mapeamentosVerificacao={mapeamentosVerificacao}
      />
    </div>
  );
}