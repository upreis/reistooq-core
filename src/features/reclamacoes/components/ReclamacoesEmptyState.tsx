/**
 * 📋 ESTADO VAZIO DE RECLAMAÇÕES
 * FASE 6: Feedback quando não há dados ou não há integração configurada
 */

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReclamacoesEmptyStateProps {
  type: 'no-integration' | 'no-data' | 'error';
  message?: string;
}

export function ReclamacoesEmptyState({ type, message }: ReclamacoesEmptyStateProps) {
  if (type === 'no-integration') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma integração configurada</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            Configure uma integração com o Mercado Livre para começar a gerenciar suas reclamações.
          </p>
          <Button onClick={() => window.location.href = '/integracoes'}>
            Configurar Integração
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (type === 'error') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar reclamações</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            {message || 'Ocorreu um erro ao buscar as reclamações. Verifique sua integração com o Mercado Livre.'}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma reclamação encontrada</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Não há reclamações no período selecionado. Tente ajustar os filtros ou período de busca.
        </p>
      </CardContent>
    </Card>
  );
}
