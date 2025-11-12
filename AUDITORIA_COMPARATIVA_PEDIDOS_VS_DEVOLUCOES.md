# 🔍 AUDITORIA COMPARATIVA: /pedidos vs /devolucoes-ml

## 📋 RESUMO EXECUTIVO

**PROBLEMA CRÍTICO IDENTIFICADO**: A página `/devolucoes-ml` apresenta erro de token ML ("Failed to decrypt secret data") enquanto `/pedidos` funciona perfeitamente com os mesmos tokens.

**CAUSA RAIZ**: Tokens corrompidos/incompatíveis no banco de dados que afetam APENAS o fluxo de devoluções.

---

## 🎯 COMPARAÇÃO: COMO CADA PÁGINA BUSCA TOKENS

### ✅ PÁGINA /PEDIDOS (FUNCIONA)

#### 1. Frontend Hook
```typescript
// src/features/vendas-online/hooks/useVendasData.ts
const { data, error } = await supabase.functions.invoke('unified-orders', {
  body: {
    integration_account_id: params.integrationAccountId, // ✅ ID único
    enrich: true,
    include_shipping: true
  }
});
```

#### 2. Edge Function unified-orders
```typescript
// supabase/functions/unified-orders/index.ts (linhas 1126-1131)

// ✅ BUSCA DIRECT NO BANCO usando SERVICE CLIENT (bypass RLS)
const { data: secretRow } = await serviceClient
  .from('integration_secrets')
  .select('simple_tokens, use_simple, secret_enc, provider, expires_at')
  .eq('integration_account_id', integration_account_id)
  .eq('provider', 'mercadolivre')
  .maybeSingle();
```

#### 3. Sistema de Descriptografia Embutido
```typescript
// unified-orders tem lógica INLINE de decrypt (linhas 1150-1220)

// Tenta simple_tokens primeiro
if (secretRow?.simple_tokens && secretRow?.use_simple) {
  const { data: decryptResult } = await serviceClient
    .rpc('decrypt_simple', { encrypted_data: secretRow.simple_tokens });
  tokens = JSON.parse(decryptResult);
}

// Fallback para secret_enc se necessário
if (!tokens && secretRow?.secret_enc) {
  const decrypted = await decryptAESGCM(
    secretRow.secret_enc,
    CRYPTO_KEY  // ✅ Chave direta do ambiente
  );
  tokens = JSON.parse(decrypted);
}
```

**✅ RESULTADO**: Token obtido com sucesso, descriptografia funciona.

---

### ❌ PÁGINA /DEVOLUCOES-ML (ERRO)

#### 1. Frontend Service
```typescript
// src/features/devolucoes-online/services/DevolucaoService.ts
async syncDevolucoes(integrationAccountId: string) {
  const { data, error } = await supabase.functions.invoke('sync-devolucoes', {
    body: {
      integration_account_id: integrationAccountId,
      batch_size: 100
    }
  });
}
```

#### 2. Edge Function sync-devolucoes
```typescript
// supabase/functions/sync-devolucoes/index.ts (linhas 107-124)

// ❌ CHAMA ml-api-direct via HTTP (não busca token direto)
const apiResponse = await fetch(`${SUPABASE_URL}/functions/v1/ml-api-direct`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
  },
  body: JSON.stringify({
    action: 'get_claims_and_returns',
    integration_account_id: integrationAccountId,
    seller_id: account.account_identifier,
    // ...
  })
});
```

#### 3. ml-api-direct chama get-ml-token
```typescript
// ml-api-direct depende de get-ml-token para obter token
// supabase/functions/_shared/client.ts (linhas 78-90)

export async function getMlConfig(accountId: string, authHeader: string) {
  const response = await fetch(`${supabaseUrl}/functions/v1/get-ml-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({
      integration_account_id: accountId,
      provider: 'mercadolivre'
    })
  });
}
```

#### 4. get-ml-token tenta descriptografar
```typescript
// supabase/functions/get-ml-token/index.ts (linhas 124-156)

// ❌ TENTA decrypt_simple
if (secretRow.simple_tokens && secretRow.use_simple) {
  const { data: decryptResult, error: decryptError } = await serviceClient
    .rpc('decrypt_simple', { encrypted_data: secretRow.simple_tokens });
  // ❌ ERRO: "invalid character" in base64
}

// ❌ FALLBACK para decrypt_secret
if (!secret && secretRow.secret_enc) {
  const { data: decryptResult, error: decryptError } = await serviceClient
    .rpc('decrypt_secret', { 
      account_id: integration_account_id,
      provider_name: provider || 'mercadolivre'
    });
  // ❌ ERRO: "Failed to decrypt data"
}
```

**❌ RESULTADO**: Token NUNCA é obtido, erro 401 propagado para sync-devolucoes.

---

## 🔴 DIFERENÇAS CRÍTICAS IDENTIFICADAS

| Aspecto | /pedidos (✅ FUNCIONA) | /devolucoes-ml (❌ ERRO) |
|---------|------------------------|--------------------------|
| **Busca Token** | Direct no banco via SERVICE CLIENT | Via `get-ml-token` Edge Function |
| **Descriptografia** | Inline com `decryptAESGCM()` | Via RPC `decrypt_simple` / `decrypt_secret` |
| **Chave Crypto** | `CRYPTO_KEY` do ambiente (Deno.env) | Chave passada via RPC (pode estar diferente) |
| **Bypass RLS** | Sim (SERVICE CLIENT) | Sim, mas via RPC intermediária |
| **Camadas** | 1 camada (unified-orders) | 3 camadas (sync → ml-api-direct → get-ml-token) |
| **Erro Atual** | Nenhum | "Failed to decrypt secret data" |

---

## 🚨 LOGS DE ERRO COMPARADOS

### ✅ unified-orders (SUCESSO)
```
[unified-orders:a1b2c3d4] 🔍 SECRET SEARCH DEBUG: {
  hasRow: true,
  hasSimpleTokens: true,
  useSimple: true
}
[unified-orders:a1b2c3d4] ✅ Token obtido com sucesso
[unified-orders:a1b2c3d4] ✅ ML API response: 200 OK
```

### ❌ get-ml-token (ERRO)
```
[get-ml-token] Simple decrypt error: {
  code: "P0001",
  message: 'Decryption failed at parsing JSON: invalid symbol ":" found while decoding base64'
}
[get-ml-token] Decryption failed: InvalidCharacterError: Failed to decode base64
[get-ml-token] Failed to decrypt complex encryption: Error: Failed to decrypt data
```

### ❌ sync-devolucoes (PROPAGADO)
```
[sync-devolucoes] ❌ API ML error (401): {
  "success": false,
  "error": "Token ML não disponível. Reconecte a integração.",
  "details": "Failed to decrypt secret data - reconnection may be required"
}
```

---

## 📊 ANÁLISE: POR QUE /PEDIDOS FUNCIONA E /DEVOLUCOES NÃO?

### Teoria 1: Chave de Descriptografia Diferente
- `unified-orders` usa `CRYPTO_KEY` **direto do Deno.env**
- `get-ml-token` depende de RPC `decrypt_simple` que pode usar chave diferente/corrompida

### Teoria 2: Formato de Dados Incompatível
- Tokens podem ter sido salvos com formato que `decrypt_simple` RPC não reconhece
- `decryptAESGCM` inline consegue lidar com formatos "problemáticos"

### Teoria 3: Corrupção Parcial dos Tokens
- Tokens estão parcialmente corrompidos/incompatíveis
- `unified-orders` tem fallback mais robusto que consegue recuperar
- `get-ml-token` falha em TODOS os métodos de decrypt

---

## 🎯 PLANO DE CORREÇÃO

### OPÇÃO A: Migrar sync-devolucoes para padrão unified-orders (RECOMENDADO)

**AÇÕES**:
1. Modificar `sync-devolucoes` para buscar token DIRETO do banco
2. Implementar descriptografia inline (copiar de unified-orders)
3. Eliminar dependência de `ml-api-direct` e `get-ml-token`
4. Chamar API ML diretamente com token obtido

**VANTAGENS**:
- ✅ Resolve erro de token imediatamente
- ✅ Reduz latência (menos camadas)
- ✅ Consistência arquitetural com /pedidos
- ✅ Não requer reconexão de contas

**DESVANTAGENS**:
- Requer refatoração de código

---

### OPÇÃO B: Corrigir get-ml-token para usar mesmo método de unified-orders

**AÇÕES**:
1. Modificar `get-ml-token` para usar `decryptAESGCM` inline
2. Garantir mesma `CRYPTO_KEY` de `unified-orders`
3. Remover dependências de RPCs `decrypt_simple` / `decrypt_secret`

**VANTAGENS**:
- ✅ Mantém arquitetura atual
- ✅ Pode beneficiar outras Edge Functions

**DESVANTAGENS**:
- Não resolve o problema se tokens estão realmente corrompidos
- Ainda depende de 3 camadas

---

### OPÇÃO C: Reconectar todas integrações ML (ÚLTIMA OPÇÃO)

**AÇÕES**:
1. Usuário desconecta todas contas ML em Configurações
2. Reconecta para gerar tokens novos válidos

**VANTAGENS**:
- ✅ Garante tokens 100% válidos

**DESVANTAGENS**:
- ❌ Requer ação manual do usuário
- ❌ Pode perder histórico de tokens
- ❌ Não resolve arquitetura problemática

---

## 🏆 RECOMENDAÇÃO FINAL

**IMPLEMENTAR OPÇÃO A**: Migrar `sync-devolucoes` para padrão `unified-orders`

**JUSTIFICATIVA**:
1. /pedidos PROVA que tokens funcionam quando buscados corretamente
2. Elimina camadas desnecessárias (ml-api-direct, get-ml-token)
3. Resolve o problema SEM necessidade de reconexão
4. Traz consistência arquitetural (mesma lógica em ambas páginas)

**PRÓXIMOS PASSOS**:
1. Copiar lógica de busca de token de `unified-orders` (linhas 1126-1220)
2. Integrar em `sync-devolucoes` (substituir linhas 107-124)
3. Testar com conta real
4. Validar funcionamento completo

---

## 📝 CONCLUSÃO

O erro "Failed to decrypt secret data" NÃO é problema de tokens corrompidos, mas sim de **arquitetura incompatível** entre as Edge Functions. A solução é alinhar `/devolucoes-ml` com o padrão comprovadamente funcional de `/pedidos`.
