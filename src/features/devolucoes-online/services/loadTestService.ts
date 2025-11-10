import { PerformanceDiagnostics } from './performanceDiagnostics';

/**
 * SPRINT 4: Testes de Carga Simplificados
 * Simula diferentes volumes de dados e mede performance
 */

export interface LoadTestResult {
  recordCount: number;
  avgQueryTime: number;
  maxQueryTime: number;
  minQueryTime: number;
  successRate: number;
  timestamp: Date;
}

export class LoadTestService {
  /**
   * Executa teste de carga com N iterações
   */
  static async runLoadTest(iterations: number = 10): Promise<LoadTestResult> {
    const times: number[] = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      try {
        await PerformanceDiagnostics.runFullDiagnostics();
        const elapsed = performance.now() - start;
        times.push(elapsed);
        successCount++;
      } catch (error) {
        console.error('Load test iteration failed:', error);
      }
    }

    return {
      recordCount: iterations,
      avgQueryTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxQueryTime: Math.max(...times),
      minQueryTime: Math.min(...times),
      successRate: (successCount / iterations) * 100,
      timestamp: new Date()
    };
  }

  /**
   * Executa bateria completa de testes (100, 1000, 5000)
   */
  static async runFullLoadTestSuite(): Promise<LoadTestResult[]> {
    console.log('Iniciando bateria de testes de carga...');
    
    const results: LoadTestResult[] = [];
    
    // Teste com 10 iterações (simula 100 registros)
    console.log('Teste 1/3: 10 iterações');
    results.push(await this.runLoadTest(10));
    
    // Teste com 50 iterações (simula 1000 registros)
    console.log('Teste 2/3: 50 iterações');
    results.push(await this.runLoadTest(50));
    
    // Teste com 100 iterações (simula 5000 registros)
    console.log('Teste 3/3: 100 iterações');
    results.push(await this.runLoadTest(100));
    
    console.log('Bateria de testes concluída!');
    return results;
  }
}
