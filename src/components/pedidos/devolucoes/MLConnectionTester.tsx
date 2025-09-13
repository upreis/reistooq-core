import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MLTestResult {
  account_id: string;
  account_name: string;
  account_identifier: string;
  token_status: string;
  api_test: string;
  expires_at?: string;
  error?: string;
}

interface MLTestResponse {
  success: boolean;
  accounts_tested: number;
  results: MLTestResult[];
  summary: {
    total_accounts: number;
    with_valid_tokens: number;
    api_success: number;
  };
  error?: string;
}

export function MLConnectionTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<MLTestResponse | null>(null);

  const handleTest = async () => {
    setTesting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ml-test-connection', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setResults(data);
      
      if (data.success) {
        toast.success(`Teste concluído: ${data.summary.api_success}/${data.summary.total_accounts} contas funcionando`);
      } else {
        toast.error('Erro no teste de conexão');
      }
    } catch (error: any) {
      console.error('Erro no teste:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (tokenStatus: string, apiTest: string) => {
    if (apiTest === 'success') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Conectado</Badge>;
    }
    if (tokenStatus === 'token_valid' && apiTest.startsWith('error_')) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />API Error {apiTest.split('_')[1]}</Badge>;
    }
    if (tokenStatus === 'secret_not_found') {
      return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Sem Secret</Badge>;
    }
    if (tokenStatus === 'token_missing') {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Token Expirado</Badge>;
    }
    return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Desconhecido</Badge>;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔧 Teste de Conexão ML</span>
          <Button 
            onClick={handleTest}
            disabled={testing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testando...' : 'Testar Conexões'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold">{results.summary.total_accounts}</div>
                <div className="text-sm text-muted-foreground">Contas Total</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-blue-600">{results.summary.with_valid_tokens}</div>
                <div className="text-sm text-muted-foreground">Com Tokens</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-green-600">{results.summary.api_success}</div>
                <div className="text-sm text-muted-foreground">API OK</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Detalhes por Conta:</h4>
              {results.results.map((result) => (
                <div key={result.account_id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{result.account_name}</div>
                    <div className="text-sm text-muted-foreground">ID: {result.account_identifier}</div>
                    {result.expires_at && (
                      <div className="text-xs text-muted-foreground">
                        Expira: {new Date(result.expires_at).toLocaleString()}
                      </div>
                    )}
                    {result.error && (
                      <div className="text-xs text-red-600">Erro: {result.error}</div>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(result.token_status, result.api_test)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!results && (
          <div className="text-center py-8 text-muted-foreground">
            Clique em "Testar Conexões" para verificar o status das integrações do Mercado Livre
          </div>
        )}
      </CardContent>
    </Card>
  );
}