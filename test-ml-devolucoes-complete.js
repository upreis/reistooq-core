#!/usr/bin/env node

/**
 * SMOKE TEST COMPLETO - ML DEVOLUÇÕES
 * Testa: token refresh, mode claims, mode returns, retry após 401
 */

const SUPABASE_URL = "https://tdjyfqnxvjgossuncpwm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk";

// Token fictício para teste (será substituído pelo real em produção)
const TEST_AUTH_TOKEN = `Bearer ${SUPABASE_ANON_KEY}`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': TEST_AUTH_TOKEN,
  'x-internal-call': 'true',
  'x-internal-token': 'ML_DEV_2025_INTERNAL_TOKEN'
};

async function testTokenRefresh() {
  console.log('🔄 Testando refresh de token...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mercadolibre-token-refresh`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integration_account_id: '4d22ffe5-0b02-4cd2-ab42-b3f168307425' // Account ID de teste
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Token refresh: OK');
      return true;
    } else {
      console.log(`⚠️ Token refresh: ${response.status} - ${result.error || 'Erro desconhecido'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Token refresh: ${error.message}`);
    return false;
  }
}

async function testDevolucoesClaims() {
  console.log('📋 Testando mode: claims...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ml-devolucoes-sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integration_account_id: '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
        mode: 'claims',
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        date_to: new Date().toISOString()
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Claims: ${result.stats?.found || 0} encontrados, ${result.stats?.saved || 0} salvos`);
      return { success: true, stats: result.stats };
    } else {
      console.log(`⚠️ Claims: ${response.status} - ${result.error || 'Erro desconhecido'}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.log(`❌ Claims: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDevolucoesReturns() {
  console.log('🔄 Testando mode: returns...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ml-devolucoes-sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integration_account_id: '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
        mode: 'returns',
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        date_to: new Date().toISOString()
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Returns: ${result.stats?.found || 0} encontrados, ${result.stats?.saved || 0} salvos`);
      return { success: true, stats: result.stats };
    } else {
      console.log(`⚠️ Returns: ${response.status} - ${result.error || 'Erro desconhecido'}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.log(`❌ Returns: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testRetryAfter401() {
  console.log('🔒 Testando retry após 401...');
  
  // Primeiro, usar token inválido para forçar 401
  const invalidHeaders = {
    ...headers,
    'Authorization': 'Bearer token_invalido_teste'
  };
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ml-devolucoes-sync`, {
      method: 'POST',
      headers: invalidHeaders,
      body: JSON.stringify({
        integration_account_id: '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
        mode: 'claims'
      })
    });

    if (response.status === 401) {
      console.log('✅ 401 handling: OK (rejeitou token inválido)');
      
      // Agora testar com token válido
      const retryResponse = await fetch(`${SUPABASE_URL}/functions/v1/ml-devolucoes-sync`, {
        method: 'POST',
        headers, // Token válido
        body: JSON.stringify({
          integration_account_id: '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
          mode: 'claims'
        })
      });
      
      if (retryResponse.ok) {
        console.log('✅ Retry após 401: OK');
        return true;
      } else {
        console.log(`⚠️ Retry falhou: ${retryResponse.status}`);
        return false;
      }
    } else {
      console.log(`⚠️ Esperava 401, mas recebeu: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Teste 401: ${error.message}`);
    return false;
  }
}

async function runSmokeTests() {
  console.log('🧪 INICIANDO SMOKE TESTS ML DEVOLUÇÕES');
  console.log('=' .repeat(50));
  
  const results = {
    tokenRefresh: false,
    claims: { success: false, stats: null },
    returns: { success: false, stats: null },
    retry401: false
  };
  
  // 1. Teste de refresh de token
  results.tokenRefresh = await testTokenRefresh();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 2. Teste mode claims
  results.claims = await testDevolucoesClaims();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. Teste mode returns
  results.returns = await testDevolucoesReturns();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 4. Teste retry após 401
  results.retry401 = await testRetryAfter401();
  
  // RESUMO
  console.log('\n' + '=' .repeat(50));
  console.log('📊 RESUMO DOS TESTES:');
  console.log(`🔄 Token Refresh: ${results.tokenRefresh ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`📋 Mode Claims: ${results.claims.success ? '✅ OK' : '❌ FALHOU'}`);
  if (results.claims.success && results.claims.stats) {
    console.log(`   └─ ${results.claims.stats.found || 0} encontrados, ${results.claims.stats.saved || 0} salvos`);
  }
  console.log(`🔄 Mode Returns: ${results.returns.success ? '✅ OK' : '❌ FALHOU'}`);
  if (results.returns.success && results.returns.stats) {
    console.log(`   └─ ${results.returns.stats.found || 0} encontrados, ${results.returns.stats.saved || 0} salvos`);
  }
  console.log(`🔒 Retry 401: ${results.retry401 ? '✅ OK' : '❌ FALHOU'}`);
  
  const allPassed = results.tokenRefresh && results.claims.success && 
                   results.returns.success && results.retry401;
  
  if (allPassed) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema ML Devoluções está funcionando corretamente');
    return 0;
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM');
    console.log('❌ Verifique as configurações e logs das Edge Functions');
    return 1;
  }
}

// Executar se chamado diretamente
if (import.meta.main) {
  runSmokeTests()
    .then(code => Deno.exit(code))
    .catch(error => {
      console.error('❌ Erro crítico nos testes:', error);
      Deno.exit(1);
    });
}