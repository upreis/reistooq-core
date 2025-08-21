import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticCheck {
  name: string;
  ok: boolean;
  detail?: any;
  fix?: string;
}

interface DiagnosticResult {
  ok: boolean;
  checks: DiagnosticCheck[];
}

export function MLDiagnosticsTest() {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadolivre-diagnose?autofix=1`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      setResult({
        ok: false,
        checks: [{ name: 'error', ok: false, fix: `Erro: ${error?.message ?? String(error)}` }]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (ok: boolean) => {
    return ok ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Diagnóstico do Mercado Livre
        </CardTitle>
        <CardDescription>
          Testa todas as configurações necessárias para a integração com o Mercado Livre
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Executando diagnóstico...' : '🧪 Executar Diagnóstico'}
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={result.ok ? 'default' : 'destructive'}>
                {result.ok ? 'TODOS OS CHECKS PASSARAM' : 'PROBLEMAS ENCONTRADOS'}
              </Badge>
            </div>

            <div className="space-y-2">
              {result.checks.map((check, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-card"
                >
                  {getStatusIcon(check.ok)}
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">{check.name}</div>
                    {check.detail && (
                      <div className="text-xs text-muted-foreground">
                        {typeof check.detail === 'string' 
                          ? check.detail 
                          : JSON.stringify(check.detail)
                        }
                      </div>
                    )}
                    {!check.ok && check.fix && (
                      <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border">
                        💡 {check.fix}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}