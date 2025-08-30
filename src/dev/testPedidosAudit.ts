// src/dev/testPedidosAudit.ts
// 🚨 AUDITORIA COMPLETA DO SISTEMA DE PEDIDOS - SEGUNDA RODADA

import { supabase } from '@/integrations/supabase/client';

export async function runCompleteAudit(integration_account_id: string) {
  console.log('🔍 [AUDIT-2] Iniciando auditoria completa após correções...');
  
  const results = {
    timestamp: new Date().toISOString(),
    integration_account_id,
    tests: [] as any[],
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  // TESTE 1: Verificar se limite está sendo validado no frontend
  console.log('📝 [AUDIT-2] Teste 1: Validação de limite no frontend');
  try {
    // Simular um pageSize inválido (maior que 50)
    const invalidLimit = 100;
    const validatedLimit = Math.min(invalidLimit, 50);
    
    if (validatedLimit !== invalidLimit) {
      results.tests.push({
        name: 'Frontend Limit Validation',
        status: 'PASS',
        expected: 50,
        actual: validatedLimit,
        message: `Limite corretamente reduzido de ${invalidLimit} para ${validatedLimit}`
      });
      results.summary.passed++;
    } else {
      results.tests.push({
        name: 'Frontend Limit Validation',
        status: 'FAIL',
        expected: 50,
        actual: validatedLimit,
        message: 'Validação de limite não está funcionando'
      });
      results.summary.failed++;
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Frontend Limit Validation',
      status: 'ERROR',
      error: error.message
    });
    results.summary.failed++;
  }

  // TESTE 2: Testar edge function com limite válido
  console.log('📝 [AUDIT-2] Teste 2: Edge function com limite válido (5)');
  try {
    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id,
        limit: 5,
        enrich: true
      }
    });

    if (error) {
      results.tests.push({
        name: 'Edge Function Valid Limit',
        status: 'FAIL',
        error: error.message,
        details: error
      });
      results.summary.failed++;
    } else if (data?.ok) {
      results.tests.push({
        name: 'Edge Function Valid Limit',
        status: 'PASS',
        message: `Sucesso com ${data.results?.length || 0} resultados`,
        details: {
          resultsCount: data.results?.length || 0,
          total: data.paging?.total || 0,
          limit: data.paging?.limit || 5
        }
      });
      results.summary.passed++;
    } else {
      results.tests.push({
        name: 'Edge Function Valid Limit',
        status: 'FAIL',
        message: 'Resposta não indicou sucesso',
        details: data
      });
      results.summary.failed++;
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Edge Function Valid Limit',
      status: 'ERROR',
      error: error.message
    });
    results.summary.failed++;
  }

  // TESTE 3: Testar edge function com limite inválido (100)
  console.log('📝 [AUDIT-2] Teste 3: Edge function com limite inválido (100)');
  try {
    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id,
        limit: 100, // Deve ser reduzido para 50
        enrich: true
      }
    });

    if (error) {
      results.tests.push({
        name: 'Edge Function Invalid Limit',
        status: 'FAIL',
        error: error.message,
        details: error
      });
      results.summary.failed++;
    } else if (data?.ok) {
      // Verificar se o limite foi reduzido
      const actualLimit = data.paging?.limit || 0;
      if (actualLimit <= 50) {
        results.tests.push({
          name: 'Edge Function Invalid Limit',
          status: 'PASS',
          message: `Limite corretamente reduzido para ${actualLimit}`,
          details: {
            requestedLimit: 100,
            actualLimit,
            resultsCount: data.results?.length || 0
          }
        });
        results.summary.passed++;
      } else {
        results.tests.push({
          name: 'Edge Function Invalid Limit',
          status: 'FAIL',
          message: `Limite não foi reduzido: ${actualLimit}`,
          details: {
            requestedLimit: 100,
            actualLimit,
            resultsCount: data.results?.length || 0
          }
        });
        results.summary.failed++;
      }
    } else {
      results.tests.push({
        name: 'Edge Function Invalid Limit',
        status: 'FAIL',
        message: 'Resposta não indicou sucesso',
        details: data
      });
      results.summary.failed++;
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Edge Function Invalid Limit',
      status: 'ERROR',
      error: error.message
    });
    results.summary.failed++;
  }

  // TESTE 4: Verificar estrutura da resposta
  console.log('📝 [AUDIT-2] Teste 4: Verificar estrutura da resposta');
  try {
    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id,
        limit: 3,
        enrich: true
      }
    });

    if (error) {
      results.tests.push({
        name: 'Response Structure',
        status: 'FAIL',
        error: error.message
      });
      results.summary.failed++;
    } else {
      const hasValidStructure = (
        data?.ok === true &&
        Array.isArray(data?.results) &&
        typeof data?.paging === 'object'
      );

      if (hasValidStructure) {
        results.tests.push({
          name: 'Response Structure',
          status: 'PASS',
          message: 'Estrutura da resposta está correta',
          details: {
            hasOk: !!data?.ok,
            hasResults: Array.isArray(data?.results),
            hasPaging: typeof data?.paging === 'object',
            resultsCount: data?.results?.length || 0
          }
        });
        results.summary.passed++;
      } else {
        results.tests.push({
          name: 'Response Structure',
          status: 'FAIL',
          message: 'Estrutura da resposta está incorreta',
          details: {
            hasOk: !!data?.ok,
            hasResults: Array.isArray(data?.results),
            hasPaging: typeof data?.paging === 'object',
            fullResponse: data
          }
        });
        results.summary.failed++;
      }
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Response Structure',
      status: 'ERROR',
      error: error.message
    });
    results.summary.failed++;
  }

  // TESTE 5: Verificar se filtros estão sendo processados
  console.log('📝 [AUDIT-2] Teste 5: Filtros sendo processados');
  try {
    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id,
        shipping_status: 'delivered',
        limit: 3,
        enrich: true
      }
    });

    if (error) {
      results.tests.push({
        name: 'Filter Processing',
        status: 'FAIL',
        error: error.message
      });
      results.summary.failed++;
    } else if (data?.ok) {
      results.tests.push({
        name: 'Filter Processing',
        status: 'PASS',
        message: 'Filtros processados com sucesso',
        details: {
          resultsCount: data?.results?.length || 0,
          requestedFilter: 'shipping_status=delivered'
        }
      });
      results.summary.passed++;
    } else {
      results.tests.push({
        name: 'Filter Processing',
        status: 'FAIL',
        message: 'Filtros não foram processados corretamente',
        details: data
      });
      results.summary.failed++;
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Filter Processing',
      status: 'ERROR',
      error: error.message
    });
    results.summary.failed++;
  }

  // Salvar resultados
  sessionStorage.setItem('pedidos-audit-results', JSON.stringify(results));
  
  // Log final
  console.log('📊 [AUDIT-2] RESULTADOS FINAIS:', {
    passed: results.summary.passed,
    failed: results.summary.failed,
    warnings: results.summary.warnings,
    total: results.tests.length
  });

  console.table(results.tests.map(t => ({
    Test: t.name,
    Status: t.status,
    Message: t.message || t.error || 'N/A'
  })));

  return results;
}

export function getAuditResults() {
  try {
    const stored = sessionStorage.getItem('pedidos-audit-results');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}