/**
 * 🧪 TESTE DE PERFORMANCE - FASE 3
 * Comparação entre abordagem antiga (ml-returns) vs nova (get-devolucoes)
 * 
 * Componente de teste para demonstrar a melhoria de performance
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Clock, Database, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceResult {
  method: string;
  timeMs: number;
  recordCount: number;
  success: boolean;
  error?: string;
}

export function PerformanceTestPanel() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<PerformanceResult[]>([]);

  const testOldMethod = async (integrationAccountId: string): Promise<PerformanceResult> => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('ml-returns', {
        body: {
          integration_account_id: integrationAccountId,
          limit: 50,
          offset: 0
        }
      });

      const timeMs = Date.now() - startTime;

      if (error) {
        return {
          method: 'ml-returns (Antiga - API Externa)',
          timeMs,
          recordCount: 0,
          success: false,
          error: error.message
        };
      }

      return {
        method: 'ml-returns (Antiga - API Externa)',
        timeMs,
        recordCount: data?.claims?.length || 0,
        success: true
      };
    } catch (error) {
      return {
        method: 'ml-returns (Antiga - API Externa)',
        timeMs: Date.now() - startTime,
        recordCount: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const testNewMethod = async (integrationAccountId: string): Promise<PerformanceResult> => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('get-devolucoes', {
        body: {
          filters: {
            integrationAccountId
          },
          pagination: {
            page: 1,
            limit: 50
          },
          includeStats: true
        }
      });

      const timeMs = Date.now() - startTime;

      if (error) {
        return {
          method: 'get-devolucoes (Nova - Dados Locais)',
          timeMs,
          recordCount: 0,
          success: false,
          error: error.message
        };
      }

      return {
        method: 'get-devolucoes (Nova - Dados Locais)',
        timeMs,
        recordCount: data?.data?.length || 0,
        success: true
      };
    } catch (error) {
      return {
        method: 'get-devolucoes (Nova - Dados Locais)',
        timeMs: Date.now() - startTime,
        recordCount: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const runPerformanceTest = async () => {
    setTesting(true);
    setResults([]);

    try {
      // Buscar integration_account_id
      const { data: accounts, error: accountError } = await supabase
        .from('integration_accounts')
        .select('id')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .limit(1);

      if (accountError || !accounts || accounts.length === 0) {
        toast.error('Nenhuma conta do Mercado Livre encontrada');
        return;
      }

      const integrationAccountId = accounts[0].id;

      toast.info('Iniciando teste de performance...');

      // Testar método antigo
      toast.info('🔄 Testando método antigo (ml-returns)...');
      const oldResult = await testOldMethod(integrationAccountId);
      setResults(prev => [...prev, oldResult]);

      // Aguardar 2 segundos entre testes
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Testar método novo
      toast.info('⚡ Testando método novo (get-devolucoes)...');
      const newResult = await testNewMethod(integrationAccountId);
      setResults(prev => [...prev, newResult]);

      // Calcular melhoria
      if (oldResult.success && newResult.success) {
        const improvement = ((oldResult.timeMs - newResult.timeMs) / oldResult.timeMs * 100).toFixed(1);
        const speedup = (oldResult.timeMs / newResult.timeMs).toFixed(1);
        
        toast.success(
          `🎉 Performance melhorada em ${improvement}%! ${speedup}x mais rápido!`,
          { duration: 5000 }
        );
      }

    } catch (error) {
      toast.error('Erro ao executar teste de performance');
      console.error(error);
    } finally {
      setTesting(false);
    }
  };

  const getVariant = (result: PerformanceResult) => {
    if (!result.success) return 'destructive';
    if (result.timeMs < 1000) return 'default';
    if (result.timeMs < 5000) return 'secondary';
    return 'outline';
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Teste de Performance - Fase 3
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Compare a performance entre a abordagem antiga (API externa) e a nova (dados locais)
          </p>
        </div>
        
        <Button 
          onClick={runPerformanceTest}
          disabled={testing}
        >
          {testing ? 'Testando...' : 'Executar Teste'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div 
              key={index}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.method.includes('Nova') ? (
                    <Database className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="font-medium">{result.method}</span>
                </div>
                
                <Badge variant={getVariant(result)}>
                  {result.success ? 'Sucesso' : 'Falha'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tempo:</span>
                  <span className="ml-2 font-semibold">{formatTime(result.timeMs)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Registros:</span>
                  <span className="ml-2 font-semibold">{result.recordCount}</span>
                </div>
              </div>

              {result.error && (
                <div className="text-sm text-destructive">
                  Erro: {result.error}
                </div>
              )}
            </div>
          ))}

          {results.length === 2 && results[0].success && results[1].success && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">Resultado</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Melhoria:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {((results[0].timeMs - results[1].timeMs) / results[0].timeMs * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Velocidade:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {(results[0].timeMs / results[1].timeMs).toFixed(1)}x mais rápido
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {results.length === 0 && !testing && (
        <div className="text-center py-8 text-muted-foreground">
          Clique em "Executar Teste" para comparar a performance
        </div>
      )}
    </Card>
  );
}
