import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

interface StatusDebugPanelProps {
  orders: any[];
  onStatusSelect: (status: string) => void;
  currentFilter?: string[];
}

export default function StatusDebugPanel({ orders, onStatusSelect, currentFilter = [] }: StatusDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [statusCount, setStatusCount] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!orders.length) return;

    const counts: Record<string, number> = {};
    
    orders.forEach(order => {
      // Extrair status de múltiplas fontes
      const sources = [
        order.shipping_status,
        order.shipping?.status,
        order.raw?.shipping?.status,
        order.status_envio,
        order.situacao,
        order.status
      ];

      sources.forEach(status => {
        if (status && typeof status === 'string') {
          counts[status] = (counts[status] || 0) + 1;
        }
      });
    });

    setStatusCount(counts);
  }, [orders]);

  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const sortedStatus = Object.entries(statusCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-orange-800">
              🔍 Debug: Status Reais
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {isVisible && (
          <CardContent className="space-y-3">
            <Alert>
              <AlertDescription className="text-xs">
                <strong>✅ Corrigido:</strong> Agora usando os status reais da API (campo 'situacao')
              </AlertDescription>
            </Alert>

            <div>
              <div className="text-xs font-medium text-orange-800 mb-2">
                Status encontrados nos {orders.length} pedidos:
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {sortedStatus.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs justify-start"
                      onClick={() => onStatusSelect(status)}
                    >
                      <Badge 
                        variant={currentFilter.includes(status) ? "default" : "outline"}
                        className="text-xs"
                      >
                        {status}
                      </Badge>
                    </Button>
                    <span className="text-orange-600 font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpar Cache & Recarregar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}