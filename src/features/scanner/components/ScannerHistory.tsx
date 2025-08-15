// =============================================================================
// SCANNER HISTORY COMPONENT - Histórico e analytics
// =============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, 
  BarChart3, 
  Clock, 
  Package, 
  TrendingUp, 
  Download,
  Trash2,
  Search
} from 'lucide-react';
import { ScanHistory } from '../types/scanner.types';
import { useScannerHistory } from '../hooks/useScannerHistory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScannerHistoryProps {
  className?: string;
}

export const ScannerHistory: React.FC<ScannerHistoryProps> = ({
  className = ''
}) => {
  const {
    history,
    analytics,
    getRecentScans,
    getSuccessfulScans,
    clearHistory,
    exportHistory,
    getSessionStats
  } = useScannerHistory();

  const [activeTab, setActiveTab] = useState('recent');
  
  const recentScans = getRecentScans(10);
  const successfulScans = getSuccessfulScans().slice(0, 10);
  const sessionStats = getSessionStats();

  const handleExport = async () => {
    try {
      const blob = await exportHistory();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scanner-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Export failed:', error);
    }
  };

  const ScanItem: React.FC<{ scan: ScanHistory }> = ({ scan }) => (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      {/* Product Image/Icon */}
      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
        {scan.produto?.url_imagem ? (
          <img
            src={scan.produto.url_imagem}
            alt={scan.produto.nome}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <Package className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Scan Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{scan.codigo}</span>
          <Badge variant={scan.found ? 'default' : 'secondary'}>
            {scan.found ? 'Encontrado' : 'Não encontrado'}
          </Badge>
        </div>
        
        {scan.produto && (
          <div className="text-sm text-muted-foreground truncate">
            {scan.produto.nome}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(scan.timestamp, { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </div>
      </div>

      {/* Stock Info */}
      {scan.produto && (
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-medium">
            {scan.produto.quantidade_atual}
          </div>
          <div className="text-xs text-muted-foreground">
            estoque
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico & Analytics
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearHistory}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent">Recentes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="session">Sessão</TabsTrigger>
          </TabsList>

          {/* Recent Scans */}
          <TabsContent value="recent" className="space-y-4">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {recentScans.length > 0 ? (
                  recentScans.map((scan) => (
                    <ScanItem key={scan.id} scan={scan} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-2" />
                    <p>Nenhum escaneamento ainda</p>
                    <p className="text-xs">Comece escaneando um código</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Daily Scans */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Hoje</span>
                </div>
                <div className="text-2xl font-bold">{analytics.daily_scans}</div>
                <div className="text-xs text-muted-foreground">escaneamentos</div>
              </div>

              {/* Success Rate */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Sucesso</span>
                </div>
                <div className="text-2xl font-bold">{analytics.success_rate}%</div>
                <div className="text-xs text-muted-foreground">taxa de acerto</div>
              </div>
            </div>

            {/* Popular Products */}
            {analytics.popular_products.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Produtos Mais Escaneados</h4>
                <div className="space-y-2">
                  {analytics.popular_products.slice(0, 5).map((item, index) => (
                    <div key={item.product_id} className="flex items-center justify-between text-sm">
                      <span className="truncate">Produto #{item.product_id.slice(0, 8)}</span>
                      <Badge variant="outline">{item.scan_count}x</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div>
              <h4 className="text-sm font-medium mb-2">Métricas de Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tempo médio por scan:</span>
                  <span>{analytics.performance_metrics.average_scan_time.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de erro:</span>
                  <span>{analytics.performance_metrics.error_rate}%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Session Stats */}
          <TabsContent value="session" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Tentativas</span>
                </div>
                <div className="text-2xl font-bold">{sessionStats.scans_attempted}</div>
                <div className="text-xs text-muted-foreground">nesta sessão</div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Sucessos</span>
                </div>
                <div className="text-2xl font-bold">{sessionStats.scans_successful}</div>
                <div className="text-xs text-muted-foreground">produtos encontrados</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Duração da sessão:</span>
                <span>{Math.floor(sessionStats.session_duration / 60)}min {sessionStats.session_duration % 60}s</span>
              </div>
              <div className="flex justify-between">
                <span>Produtos únicos:</span>
                <span>{sessionStats.unique_products}</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo médio:</span>
                <span>{sessionStats.average_scan_time.toFixed(1)}s por scan</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ScannerHistory;