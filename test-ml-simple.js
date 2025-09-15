// Teste rápido das Edge Functions
const SUPABASE_URL = "https://tdjyfqnxvjgossuncpwm.supabase.co";

async function testMLDevolucoes() {
  console.log('🧪 Teste rápido ML Devoluções');
  
  // Teste básico de conectividade
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ml-devolucoes-sync`, {
    method: 'OPTIONS'
  });
  
  console.log(`CORS: ${response.status === 200 ? '✅ OK' : '❌ FALHOU'}`);
  
  // Teste POST com dados mínimos
  const postResponse = await fetch(`${SUPABASE_URL}/functions/v1/ml-devolucoes-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk'
    },
    body: JSON.stringify({
      integration_account_id: '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
      mode: 'claims'
    })
  });
  
  const result = await postResponse.json();
  console.log(`POST: ${postResponse.status}`);
  console.log('Response:', JSON.stringify(result, null, 2));
}

testMLDevolucoes().catch(console.error);