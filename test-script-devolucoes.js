// 🔧 Script de Teste Manual para Devoluções ML
// Execute no Console do Browser na aba de Devoluções

async function testDevolucoes() {
  console.log('🧪 TESTE MANUAL - DEVOLUÇÕES ML');
  console.log('================================');
  
  // 1. Testar função de sincronização
  console.log('🔄 Testando sincronização...');
  
  try {
    const response = await supabase.functions.invoke('ml-devolucoes-sync', {
      body: {
        integration_account_id: 'a9491ae8-6bf9-4f5f-a956-1f5ce2c596cd',
        date_from: '2025-08-13T00:00:00.000Z',
        date_to: new Date().toISOString()
      }
    });
    
    console.log('📡 Resposta da sincronização:', response);
    
    if (response.error) {
      console.error('❌ Erro na sincronização:', response.error);
    } else {
      console.log('✅ Sincronização executada:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Erro ao chamar função:', error);
  }
  
  // 2. Verificar dados na tabela
  console.log('\n📊 Verificando dados sincronizados...');
  
  try {
    const { data: claims, error } = await supabase
      .from('ml_devolucoes_reclamacoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('❌ Erro ao buscar claims:', error);
    } else {
      console.log('📋 Claims encontradas:', claims.length);
      console.table(claims);
    }
    
  } catch (error) {
    console.error('❌ Erro na query:', error);
  }
  
  // 3. Verificar token ML
  console.log('\n🔑 Verificando token ML...');
  
  try {
    const { data: secrets } = await supabase
      .from('integration_secrets')
      .select('expires_at, last_accessed_at')
      .eq('integration_account_id', 'a9491ae8-6bf9-4f5f-a956-1f5ce2c596cd')
      .single();
      
    console.log('🔐 Status do token:', {
      expires_at: secrets?.expires_at,
      expired: new Date(secrets?.expires_at) < new Date(),
      last_accessed: secrets?.last_accessed_at
    });
    
  } catch (error) {
    console.log('⚠️ Não foi possível verificar token (normal por segurança)');
  }
}

// Execute o teste
testDevolucoes();