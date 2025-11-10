import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle2, XCircle } from 'lucide-react';
import { LoadTestService, LoadTestResult } from '../../services/loadTestService';

/**
 * SPRINT 4: Dashboard de Testes de Carga
 */
export const LoadTestDashboard = memo(() => {
  const [results, setResults] = useState<LoadTestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);

  const runTests = async () => {
    setTesting(true);
    setProgress(0);
    
    try {
      const testResults = await LoadTestService.runFullLoadTestSuite();
      setResults(testResults);
      setProgress(100);
    } catch (error) {
      console.error('Erro nos testes:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Testes de Carga - SPRINT 4</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTests} disabled={testing} className="w-full">
            <PlayCircle className="h-4 w-4 mr-2" />
            {testing ? 'Executando Testes...' : 'Iniciar Testes de Carga'}
          </Button>
          
          {testing && <Progress value={progress} />}
          
          {results.length > 0 && (
            <div className="space-y-3 mt-4">
              {results.map((result, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        Teste {idx + 1}: {result.recordCount} iterações
                      </span>
                      {result.successRate === 100 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Avg: {result.avgQueryTime.toFixed(1)}ms</div>
                      <div>Max: {result.maxQueryTime.toFixed(1)}ms</div>
                      <div>Min: {result.minQueryTime.toFixed(1)}ms</div>
                      <div>
                        <Badge variant={result.successRate === 100 ? 'default' : 'destructive'}>
                          {result.successRate.toFixed(0)}% sucesso
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

LoadTestDashboard.displayName = 'LoadTestDashboard';
