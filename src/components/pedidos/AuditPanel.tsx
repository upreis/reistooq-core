// src/components/pedidos/AuditPanel.tsx
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { runUnifiedOrdersSnapshot, getStoredSnapshot } from '@/dev/auditUnifiedOrders';
import { get, show } from '@/services/orders';

interface AuditPanelProps {
  rows: any[];
  integrationAccountId: string;
}

export function AuditPanel({ rows, integrationAccountId }: AuditPanelProps) {
  const [snapshot, setSnapshot] = useState(getStoredSnapshot());
  const [isRunning, setIsRunning] = useState(false);

  const runSnapshot = async () => {
    setIsRunning(true);
    try {
      const result = await runUnifiedOrdersSnapshot(integrationAccountId);
      if (result.data) {
        setSnapshot(result.data);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const firstRow = rows[0];
  const sampleRaw = snapshot?.analysis?.sampleData?.raw;
  const sampleUnified = snapshot?.analysis?.sampleData?.unified;

  // Key path checks
  const keyChecks = [
    // RAW checks
    { path: 'raw.pack_id', value: get(sampleRaw, 'pack_id'), category: 'RAW' },
    { path: 'raw.pickup_id', value: get(sampleRaw, 'pickup_id'), category: 'RAW' },
    { path: 'raw.shipping.id', value: get(sampleRaw, 'shipping.id'), category: 'RAW' },
    { path: 'raw.buyer.id', value: get(sampleRaw, 'buyer.id'), category: 'RAW' },
    { path: 'raw.seller.id', value: get(sampleRaw, 'seller.id'), category: 'RAW' },
    { path: 'raw.status', value: get(sampleRaw, 'status'), category: 'RAW' },
    { path: 'raw.status_detail', value: get(sampleRaw, 'status_detail'), category: 'RAW' },
    { path: 'raw.comment', value: get(sampleRaw, 'comment'), category: 'RAW' },
    { path: 'raw.tags', value: get(sampleRaw, 'tags'), category: 'RAW' },
    { path: 'raw.order_items[0].item.seller_sku', value: get(sampleRaw, 'order_items.0.item.seller_sku'), category: 'RAW' },
    
    // UNIFIED checks
    { path: 'unified.numero', value: get(sampleUnified, 'numero'), category: 'UNIFIED' },
    { path: 'unified.nome_cliente', value: get(sampleUnified, 'nome_cliente'), category: 'UNIFIED' },
    { path: 'unified.valor_total', value: get(sampleUnified, 'valor_total'), category: 'UNIFIED' },
    { path: 'unified.situacao', value: get(sampleUnified, 'situacao'), category: 'UNIFIED' },
  ];

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5" />
          Painel de Auditoria
        </h3>
        <Button 
          onClick={runSnapshot} 
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          {isRunning ? 'Executando...' : 'Executar Snapshot'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="raw">RAW Data</TabsTrigger>
          <TabsTrigger value="unified">Unified Data</TabsTrigger>
          <TabsTrigger value="checks">Path Checks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rows Loaded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rows.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Snapshot Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={snapshot ? 'default' : 'secondary'}>
                  {snapshot ? 'Available' : 'Not Available'}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Data Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div>Raw Results: {snapshot?.analysis?.totalResults ?? 'N/A'}</div>
                  <div>Unified Results: {snapshot?.analysis?.totalUnified ?? 'N/A'}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {firstRow && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">First Row Structure</div>
                <div className="text-sm mt-1">
                  <div>Keys: {Object.keys(firstRow).join(', ')}</div>
                  <div className="mt-2">
                    Raw: {firstRow.raw ? 'Available' : 'Missing'} | 
                    Unified: {firstRow.unified ? 'Available' : 'Missing'}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          {sampleRaw ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sample RAW Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                  {JSON.stringify(sampleRaw, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhum dado RAW disponível. Execute o snapshot primeiro.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="unified" className="space-y-4">
          {sampleUnified ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sample Unified Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                  {JSON.stringify(sampleUnified, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhum dado UNIFIED disponível. Execute o snapshot primeiro.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <div className="space-y-2">
            {keyChecks.map((check, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {check.category}
                  </Badge>
                  <code className="text-xs">{check.path}</code>
                </div>
                <div className="flex items-center gap-2">
                  {check.value !== undefined ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-xs font-mono">
                    {show(check.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}