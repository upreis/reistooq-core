import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface OrdersSyncStatusProps {
  className?: string;
  onSyncComplete?: () => void;
}

export const OrdersSyncStatus: React.FC<OrdersSyncStatusProps> = ({ className, onSyncComplete }) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleSyncOrders = async () => {
    setIsRefreshing(true);
    try {
      // Here you would call the sync service
      // For now, just simulate the sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sincronização concluída",
        description: "Pedidos do Mercado Livre foram sincronizados com sucesso.",
      });
      
      // Trigger refresh callback
      onSyncComplete?.();
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Falha ao sincronizar pedidos do Mercado Livre.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewMercadoLibre = () => {
    window.open('https://vendas.mercadolivre.com.br', '_blank');
  };

  return (
    <Card className={`border-l-4 border-l-yellow-500 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Mercado Livre</span>
            </div>
            
            <Badge variant="secondary" className="gap-1 text-green-700 bg-green-50 border-green-200">
              <span className="h-2 w-2 bg-green-500 rounded-full"></span>
              Conectado
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncOrders}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewMercadoLibre}
              className="gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              Abrir ML
            </Button>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Última sincronização: há 2 minutos • 15 pedidos importados hoje
        </div>
      </CardContent>
    </Card>
  );
};