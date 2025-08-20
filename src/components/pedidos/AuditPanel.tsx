import { useState, useEffect } from 'react';
import { Row } from '@/services/orders';
import { runUnifiedOrdersSnapshot, AuditResult } from '@/dev/auditUnifiedOrders';
import { get, show } from '@/types/ml';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, AlertTriangle, CheckCircle, Play, Copy } from 'lucide-react';

interface AuditPanelProps {
  integrationAccountId: string;
  rows: Row[];
}

interface FieldCheck {
  field: string;
  path: string;
  value: any;
  status: 'ok' | 'missing' | 'null';
  source: 'raw' | 'unified';
}

export function AuditPanel({ integrationAccountId, rows }: AuditPanelProps) {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      const result = await runUnifiedOrdersSnapshot(integrationAccountId);
      setAuditResult(result);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Field checks for the first row
  const fieldChecks: FieldCheck[] = [];
  if (rows.length > 0) {
    const row = rows[0];
    
    // Raw ML fields checks
    const rawChecks = [
      { field: 'Pack ID', path: 'pack_id', source: 'raw' as const },
      { field: 'Pickup ID', path: 'pickup_id', source: 'raw' as const },
      { field: 'Manufacturing Date', path: 'manufacturing_ending_date', source: 'raw' as const },
      { field: 'Comment', path: 'comment', source: 'raw' as const },
      { field: 'Status', path: 'status', source: 'raw' as const },
      { field: 'Status Detail', path: 'status_detail', source: 'raw' as const },
      { field: 'Tags', path: 'tags', source: 'raw' as const },
      { field: 'Buyer ID', path: 'buyer.id', source: 'raw' as const },
      { field: 'Seller ID', path: 'seller.id', source: 'raw' as const },
      { field: 'Shipping ID', path: 'shipping.id', source: 'raw' as const },
      { field: 'Order Items', path: 'order_items', source: 'raw' as const },
    ];

    // Unified fields checks
    const unifiedChecks = [
      { field: 'Nome Cliente', path: 'nome_cliente', source: 'unified' as const },
      { field: 'CPF/CNPJ', path: 'cpf_cnpj', source: 'unified' as const },
      { field: 'Valor Frete', path: 'valor_frete', source: 'unified' as const },
      { field: 'Valor Desconto', path: 'valor_desconto', source: 'unified' as const },
      { field: 'Código Rastreamento', path: 'codigo_rastreamento', source: 'unified' as const },
      { field: 'URL Rastreamento', path: 'url_rastreamento', source: 'unified' as const },
      { field: 'Cidade', path: 'cidade', source: 'unified' as const },
      { field: 'UF', path: 'uf', source: 'unified' as const },
    ];

    [...rawChecks, ...unifiedChecks].forEach(check => {
      const sourceData = check.source === 'raw' ? row.raw : row.unified;
      const value = get(sourceData, check.path);
      let status: 'ok' | 'missing' | 'null' = 'missing';
      
      if (sourceData && check.path in sourceData) {
        status = value !== null && value !== undefined ? 'ok' : 'null';
      }

      fieldChecks.push({
        field: check.field,
        path: check.path,
        value,
        status,
        source: check.source
      });
    });
  }

  const okCount = fieldChecks.filter(f => f.status === 'ok').length;
  const nullCount = fieldChecks.filter(f => f.status === 'null').length;
  const missingCount = fieldChecks.filter(f => f.status === 'missing').length;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🔍 Auditoria de Pedidos</h3>
        <Button 
          onClick={runAudit} 
          disabled={loading}
          size="sm"
          variant="outline"
        >
          <Play className="h-4 w-4 mr-2" />
          {loading ? 'Executando...' : 'Executar Diagnóstico'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Campos OK</div>
            <div className="text-lg font-semibold text-green-700">{okCount}</div>
          </AlertDescription>
        </Alert>
        
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Campos Null</div>
            <div className="text-lg font-semibold text-yellow-700">{nullCount}</div>
          </AlertDescription>
        </Alert>
        
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Campos Missing</div>
            <div className="text-lg font-semibold text-red-700">{missingCount}</div>
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList>
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
          <TabsTrigger value="unified">Unified Data</TabsTrigger>
          {auditResult && <TabsTrigger value="edge">Edge Response</TabsTrigger>}
        </TabsList>

        <TabsContent value="fields" className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {fieldChecks.map((check, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={check.status === 'ok' ? 'default' : check.status === 'null' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {check.source.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{check.field}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-1 rounded">{check.path}</code>
                  <Badge 
                    variant={check.status === 'ok' ? 'default' : check.status === 'null' ? 'secondary' : 'destructive'}
                  >
                    {check.status === 'ok' ? '✓' : check.status === 'null' ? '∅' : '✗'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="raw">
          {rows.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Raw ML Data (primeiro pedido)</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(rows[0].raw, null, 2))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-96">
                  {JSON.stringify(rows[0].raw, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unified">
          {rows.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Unified Data (primeiro pedido)</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(rows[0].unified, null, 2))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-96">
                  {JSON.stringify(rows[0].unified, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {auditResult && (
          <TabsContent value="edge">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Edge Function Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {auditResult.success ? (
                  <div>
                    <Alert className="border-green-200 bg-green-50 mb-4">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Edge function executada com sucesso!
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <strong>Results Count:</strong> {auditResult.analysis.counts.results}
                      </div>
                      <div>
                        <strong>Unified Count:</strong> {auditResult.analysis.counts.unified}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <strong>Results Keys:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {auditResult.analysis.resultsKeys.map(key => (
                            <Badge key={key} variant="outline" className="text-xs">{key}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <strong>Unified Keys:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {auditResult.analysis.unifiedKeys.map(key => (
                            <Badge key={key} variant="secondary" className="text-xs">{key}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <strong>Item Keys:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {auditResult.analysis.itemKeys.map(key => (
                            <Badge key={key} variant="outline" className="text-xs">{key}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Erro:</strong> {auditResult.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}