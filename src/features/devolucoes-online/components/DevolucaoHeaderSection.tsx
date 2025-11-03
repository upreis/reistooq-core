/**
 * 📊 HEADER SECTION - DEVOLUÇÕES
 * Cabeçalho otimizado com título e ações
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface DevolucaoHeaderSectionProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const DevolucaoHeaderSection = memo(({ isRefreshing, onRefresh }: DevolucaoHeaderSectionProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Devoluções Mercado Livre</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie devoluções (claims) dos seus pedidos ML
        </p>
      </div>
      <Button 
        onClick={onRefresh}
        disabled={isRefreshing}
        variant="outline"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
    </div>
  );
});

DevolucaoHeaderSection.displayName = 'DevolucaoHeaderSection';
