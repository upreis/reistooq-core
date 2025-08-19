# Teste do Sistema Híbrido de Pedidos

## Comandos de Teste

### 1. Teste via cURL (Edge Function)
```bash
# Substitua <ANON> pelo token real do projeto
export ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"

curl -X POST "https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/unified-orders" \
  -H "Authorization: Bearer $ANON" \
  -H "apikey: $ANON" \
  -H "Content-Type: application/json" \
  -d '{
    "integration_account_id": "5740f717-1771-4298-b8c9-464ffb8d8dce",
    "status": "paid",
    "limit": 5,
    "debug": true
  }' | jq
```

### 2. Teste via Console do Navegador
```javascript
// Testar edge function diretamente
await supabase.functions.invoke('unified-orders', {
  body: {
    integration_account_id: '5740f717-1771-4298-b8c9-464ffb8d8dce',
    status: 'paid',
    limit: 3
  }
});

// Testar query ao banco
await supabase
  .from('pedidos')
  .select('*', { count: 'exact' })
  .eq('integration_account_id', '5740f717-1771-4298-b8c9-464ffb8d8dce')
  .limit(5);
```

## Comportamento Esperado

### Cenário 1: Banco com dados
- Toggle "Banco" ativo
- Tabela mostra dados de `public.pedidos`
- Paginação funcional
- Sem alerta de fallback

### Cenário 2: Banco vazio (fallback)
- Toggle inicia em "Banco" mas muda automaticamente para "Tempo real"
- Alerta amarelo: "Sem dados na tabela. Exibindo pedidos em tempo real (Mercado Livre)."
- Tabela mostra dados do ML via `unified-orders`
- Console mostra: `[PedidosHybrid] fonte=tempo-real rows=X`

### Cenário 3: Forçar tempo real
- Usuário clica em "Tempo real"
- Pula consulta ao banco
- Mostra dados do ML imediatamente
- Console mostra: `[PedidosHybrid] Forçando fonte tempo-real`

## Logs Esperados no Console
```
[PedidosHybrid] Iniciando busca. Fonte preferida: banco
[PedidosHybrid] fonte=banco rows=25
// OU
[PedidosHybrid] Banco vazio, fazendo fallback para tempo-real
[PedidosHybrid] fonte=tempo-real rows=10
```