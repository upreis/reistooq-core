
// src/pages/Pedidos.tsx
import { useState } from 'react';
import { PedidosTable } from '@/components/pedidos/PedidosTable';
import { usePedidosHybrid, FontePedidos } from '@/services/pedidos';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function Pedidos() {
  // Buscar de múltiplas fontes: prop > env > hardcoded
  const INTEGRATION_ACCOUNT_ID = 
    // @ts-ignore - VITE_ vars are available at build time
    import.meta.env.VITE_INTEGRATION_ACCOUNT_ID || 
    '5740f717-1771-4298-b8c9-464ffb8d8dce';

  const [fonteEscolhida, setFonteEscolhida] = useState<FontePedidos>('banco');
  const [forceFonte, setForceFonte] = useState<FontePedidos | undefined>();
  
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

      {/* Alerta de Fallback */}
      {fonte === 'tempo-real' && fonteEscolhida === 'banco' && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Sem dados na tabela. Exibindo pedidos em tempo real (Mercado Livre).
          </AlertDescription>
        </Alert>
      )}

      {/* Indicador de Fonte Ativa */}
      <div className="mb-4 text-sm text-muted-foreground">
        Fonte ativa: <span className="font-medium">{fonte === 'banco' ? 'Banco de dados' : 'Tempo real (Mercado Livre)'}</span>
        {total > 0 && ` • ${total} registro${total === 1 ? '' : 's'}`}
      </div>
      
      <PedidosTable 
        integrationAccountId={INTEGRATION_ACCOUNT_ID}
        hybridData={{ rows, total, fonte, loading, error, refetch }}
      />
    </div>
  );
}