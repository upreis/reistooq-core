#!/usr/bin/env node

const SUPABASE_URL = "https://tdjyfqnxvjgossuncpwm.supabase.co";

async function testSmoothService() {
  console.log("🧪 Teste 1: Validando smooth-service com parâmetros de teste...");
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/smooth-service?code=TEST&state=TEST`);
    const text = await response.text();
    
    if (text.includes("Missing code or state") || text.includes("Invalid or expired state")) {
      console.log("✅ smooth-service está funcionando corretamente (retornou erro esperado para parâmetros de teste)");
      return true;
    } else {
      console.log("❌ smooth-service não retornou o erro esperado");
      console.log("Resposta:", text.substring(0, 200) + "...");
      return false;
    }
  } catch (error) {
    console.log("❌ Erro ao testar smooth-service:", error.message);
    return false;
  }
}

async function testHyperFunction() {
  console.log("🧪 Teste 2: Validando hyper-function (sem autenticação)...");
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usePkce: true }),
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log("✅ hyper-function está funcionando corretamente (requer autenticação)");
      return true;
    }
    
    if (data.ok && data.url && data.url.startsWith("https://auth.mercadolivre.com.br/authorization")) {
      console.log("✅ hyper-function retornou URL válida do MercadoLibre");
      console.log("URL gerada:", data.url.substring(0, 80) + "...");
      return true;
    } else {
      console.log("❌ hyper-function não retornou URL válida");
      console.log("Resposta:", JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log("❌ Erro ao testar hyper-function:", error.message);
    return false;
  }
}

async function testEdgeFunctionsAvailability() {
  console.log("🧪 Teste 3: Verificando disponibilidade das Edge Functions...");
  
  const functions = ['hyper-function', 'smooth-service', 'smart-responder', 'rapid-responder'];
  let allAvailable = true;
  
  for (const func of functions) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${func}`, {
        method: 'OPTIONS'
      });
      
      if (response.status === 200 || response.status === 204) {
        console.log(`✅ ${func} está disponível`);
      } else {
        console.log(`❌ ${func} retornou status ${response.status}`);
        allAvailable = false;
      }
    } catch (error) {
      console.log(`❌ ${func} não está disponível:`, error.message);
      allAvailable = false;
    }
  }
  
  return allAvailable;
}

async function runSmokeTests() {
  console.log("🚀 Iniciando testes de integração do MercadoLibre...\n");
  
  const results = [];
  
  results.push(await testEdgeFunctionsAvailability());
  console.log("");
  
  results.push(await testSmoothService());
  console.log("");
  
  results.push(await testHyperFunction());
  console.log("");
  
  const allPassed = results.every(result => result);
  
  console.log("📊 Resumo dos testes:");
  console.log(`✅ Passou: ${results.filter(r => r).length}/${results.length}`);
  console.log(`❌ Falhou: ${results.filter(r => !r).length}/${results.length}`);
  
  if (allPassed) {
    console.log("\n🎉 Todos os testes passaram! A integração está pronta.");
    console.log("\nPróximos passos:");
    console.log("1. Configure as secrets no Supabase: ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI");
    console.log("2. Registre a URL de callback no MercadoLibre: https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/smooth-service");
    console.log("3. Teste a integração completa através da interface do usuário");
    process.exit(0);
  } else {
    console.log("\n⚠️  Alguns testes falharam. Verifique a configuração.");
    process.exit(1);
  }
}

if (typeof module !== 'undefined' && require.main === module) {
  runSmokeTests();
}