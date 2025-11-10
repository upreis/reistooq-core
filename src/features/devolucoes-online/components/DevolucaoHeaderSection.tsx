/**
 * 📊 HEADER SECTION - DEVOLUÇÕES
 * Cabeçalho otimizado com título e ações
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, BarChart3 } from 'lucide-react';

interface DevolucaoHeaderSectionProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const DevolucaoHeaderSection = memo(({ isRefreshing, onRefresh }: DevolucaoHeaderSectionProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Devoluções Mercado Livre</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie devoluções (claims) dos seus pedidos ML
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={() => navigate('/devolucoes-ml/qualidade-dados')}
          variant="outline"
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Qualidade de Dados
        </Button>
        <Button 
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
    </div>
  );
});

DevolucaoHeaderSection.displayName = 'DevolucaoHeaderSection';
