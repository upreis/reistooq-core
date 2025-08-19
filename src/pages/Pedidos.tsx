
// src/pages/Pedidos.tsx
import { useState } from 'react';
import { PedidosTable } from '@/components/pedidos/PedidosTable';
import { BaixaEstoqueModal } from '@/components/pedidos/BaixaEstoqueModal';
import { usePedidosHybrid, FontePedidos } from '@/services/pedidos';
import { Pedido } from '@/types/pedido';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Package } from 'lucide-react';

export default function Pedidos() {
  // Buscar de múltiplas fontes: prop > env > hardcoded
  const INTEGRATION_ACCOUNT_ID = 
    // @ts-ignore - VITE_ vars are available at build time
    import.meta.env.VITE_INTEGRATION_ACCOUNT_ID || 
    '5740f717-1771-4298-b8c9-464ffb8d8dce';

  const [fonteEscolhida, setFonteEscolhida] = useState<FontePedidos>('banco');
  const [forceFonte, setForceFonte] = useState<FontePedidos | undefined>();
  const [pedidosSelecionados, setPedidosSelecionados] = useState<Pedido[]>([]);
  
  const { rows, total, fonte, loading, error, refetch } = usePedidosHybrid({
    integrationAccountId: INTEGRATION_ACCOUNT_ID,
    page: 1,
    pageSize: 25,
    forceFonte
  });

  const handleFonteChange = (novaFonte: FontePedidos) => {
    setFonteEscolhida(novaFonte);
    setForceFonte(novaFonte);
  };

  const handleSelectionChange = (selectedRows: Pedido[]) => {
    setPedidosSelecionados(selectedRows);
  };

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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        
        {/* Ações e Toggle de Fonte */}
        <div className="flex items-center gap-4">
          {/* Botão de Baixa de Estoque */}
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
      </div>

      {/* Alerta de Fallback */}
      {fonte === 'tempo-real' && fonteEscolhida === 'banco' && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Sem dados na tabela. Exibindo pedidos em tempo real (Mercado Livre).
          </AlertDescription>
        </Alert>
      )}

      {/* Informações sobre Baixa de Estoque */}
      <Alert className="mb-4 border-blue-200 bg-blue-50">
        <Package className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">Baixa Automática de Estoque</div>
          <div className="text-sm mt-1">
            Selecione pedidos para processar a baixa automática baseada no mapeamento De-Para. 
            O sistema verifica duplicatas pelo histórico e aplica as quantidades do KIT automaticamente.
          </div>
        </AlertDescription>
      </Alert>

      {/* Indicador de Fonte Ativa */}
      <div className="mb-4 text-sm text-muted-foreground">
        Fonte ativa: <span className="font-medium">{fonte === 'banco' ? 'Banco de dados' : 'Tempo real (Mercado Livre)'}</span>
        {total > 0 && ` • ${total} registro${total === 1 ? '' : 's'}`}
        {pedidosSelecionados.length > 0 && (
          <span className="ml-4 font-medium text-primary">
            {pedidosSelecionados.length} pedido{pedidosSelecionados.length === 1 ? '' : 's'} selecionado{pedidosSelecionados.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
      
      <PedidosTable 
        integrationAccountId={INTEGRATION_ACCOUNT_ID}
        hybridData={{ rows, total, fonte, loading, error, refetch }}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}