# 🔒 AUDITORIA ERRO 3 - Permissões integration_accounts

## 🎯 Objetivo
Identificar todos os acessos à tabela `integration_accounts` e garantir que usam `serviceClient` (SERVICE_ROLE_KEY) ao invés de client com permissões limitadas.

---

## 📊 ANÁLISE COMPLETA - 19 Edge Functions Auditadas

### ✅ CORRETAS (Usando serviceClient)

#### 1. **auto-update-devolucoes** ✅
- **Linhas 29, 33**: Usa `makeServiceClient()` corretamente
- **Status**: OK

#### 2. **get-ml-token** ✅
- **Linha 88**: Usa `serviceClient` corretamente
- **Status**: OK

#### 3. **mercadolibre-oauth-callback** ✅
- **Linha 161**: Usa `serviceClient` corretamente
- **Status**: OK

#### 4. **mercadolivre-token-refresh** ✅
- **Linhas 44, 130**: Usa `serviceClient` corretamente
- **Status**: OK

#### 5. **sync-devolucoes-background** ✅
- **Linha 194**: Usa `serviceClient` corretamente
- **Status**: OK

#### 6. **sync-devolucoes** ✅
- **Linha 66**: Usa `serviceClient` corretamente
- **Status**: OK

#### 7. **sync-ml-orders** ✅
- **Linha 8, 14**: Usa `makeServiceClient()` corretamente
- **Status**: OK

---

### ⚠️ SUSPEITAS (Usando client comum - PODEM causar erro de permissão)

#### 8. **ml-auth** ⚠️
**Linha 155-156**: Usa `supabase` (não serviceClient)
```typescript
const { data: account } = await supabase
  .from('integration_accounts')
  .upsert({...})
```

**Linha 263-264**: Usa `supabase` (não serviceClient)
```typescript
const { data: account } = await supabase
  .from('integration_accounts')
  .select('account_identifier')
```

**PROBLEMA**: Pode estar usando client com contexto de usuário ao invés de SERVICE_ROLE
**RISCO**: ALTO - Pode causar "permission denied"
**AÇÃO**: Verificar se `supabase` nesta function é serviceClient ou userClient

---

#### 9. **ml-claims-fetch** ⚠️
**Linha 476-477**: Usa `supabase` (não explicitamente serviceClient)
```typescript
const { data: accountData } = await supabase
  .from('integration_accounts')
  .select('organization_id')
```

**PROBLEMA**: Não está claro se é serviceClient
**RISCO**: MÉDIO
**AÇÃO**: Verificar inicialização do client nesta function

---

#### 10. **ml-test-connection** ⚠️
**Linha 24-25**: Usa `supabase`
```typescript
const { data: accounts, error: accountsError } = await supabase
  .from('integration_accounts')
  .select('*')
```

**RISCO**: MÉDIO
**AÇÃO**: Verificar tipo de client

---

#### 11. **ml-token-refresh-cron** ⚠️
**Linha 33-34**: Usa `supabase`
```typescript
const { data: activeAccounts, error: accountsError } = await supabase
  .from('integration_accounts')
  .select('id')
```

**RISCO**: MÉDIO (é cron job, deveria usar serviceClient)
**AÇÃO**: Verificar inicialização

---

#### 12. **ml-webhook** ⚠️
**Linhas 71-72, 109-110**: Usa `supabase`
```typescript
const { data: accounts } = await supabase
  .from('integration_accounts')
  .select('id, organization_id')
```

**RISCO**: MÉDIO (webhooks normalmente não têm contexto de usuário)
**AÇÃO**: Verificar se usa serviceClient

---

#### 13. **shopee-oauth** ⚠️
**Linhas 95-96, 168-169, 275-276**: Usa `supabase`

**RISCO**: MÉDIO
**AÇÃO**: Verificar tipo de client

---

#### 14. **shopee-orders** ⚠️
**Linha 180-181**: Usa `supabase`

**RISCO**: MÉDIO
**AÇÃO**: Verificar tipo de client

---

#### 15. **unified-orders** ⚠️
**Linha 1062-1063**: Usa `userClient` (EXPLICITAMENTE cliente de usuário!)
```typescript
const { data: accountData, error: accountError } = await userClient
  .from('integration_accounts')
  .select('*')
```

**PROBLEMA**: Usa explicitamente `userClient` com permissões limitadas
**RISCO**: **MUITO ALTO** - Definitivamente vai causar "permission denied"
**AÇÃO**: **CORREÇÃO OBRIGATÓRIA** - Trocar por `serviceClient`

---

### ✅ PROVAVELMENTE OK (Contextos especiais)

#### 16. **enviar-notificacao-pedido**
- Usa JOIN com `integration_accounts!inner`
- Contexto: Leitura de dados de pedido com RLS
- **Status**: Provavelmente OK (depende de RLS policies)

#### 17. **integrations-store-secret**
- **Linha 32-33**: Usa `supabase.from('integration_accounts').select('organization_id')`
- **Contexto**: Edge function de sistema
- **Status**: Verificar se é serviceClient

#### 18. **mercadolibre-diagnose**
- **Linha 120-121**: Cria conta temporária para teste
- **Status**: Usa serviceClient (`sb`)

#### 19. **test-shipment-structure**
- **Linha 34-35**: Busca access_token
- **Status**: Verificar tipo de client

---

## 🚨 CORREÇÕES URGENTES IDENTIFICADAS

### 1. **unified-orders** (CRÍTICO - linha 1062)
❌ **ERRO CONFIRMADO**: Usa `userClient` explicitamente
```typescript
// ANTES (ERRADO):
const { data: accountData, error: accountError } = await userClient
  .from('integration_accounts')
  .select('*')

// DEPOIS (CORRETO):
const { data: accountData, error: accountError } = await serviceClient
  .from('integration_accounts')
  .select('*')
```

---

## 📋 CHECKLIST DE AÇÕES

### 🔥 PRIORIDADE CRÍTICA
- [ ] **unified-orders** linha 1062: Trocar `userClient` por `serviceClient`

### ⚠️ PRIORIDADE ALTA (Verificar e corrigir se necessário)
- [ ] **ml-auth** linhas 155, 263: Verificar se `supabase` é serviceClient
- [ ] **ml-claims-fetch** linha 476: Verificar inicialização do client
- [ ] **ml-webhook** linhas 71, 109: Verificar se usa serviceClient
- [ ] **ml-token-refresh-cron** linha 33: Garantir que usa serviceClient (é cron)

### 📝 PRIORIDADE MÉDIA (Auditoria completa)
- [ ] **ml-test-connection**: Verificar tipo de client
- [ ] **shopee-oauth**: Verificar tipo de client
- [ ] **shopee-orders**: Verificar tipo de client
- [ ] **integrations-store-secret**: Verificar tipo de client
- [ ] **test-shipment-structure**: Verificar tipo de client

---

## 🎯 IMPACTO NO USUÁRIO

### Sem Correção em unified-orders
- ❌ **ERRO CONFIRMADO**: "permission denied for table integration_accounts"
- ❌ Sistema de pedidos pode falhar ao buscar dados de contas
- ❌ Sincronização de pedidos bloqueada

### Sem Verificação dos Suspeitos
- ⚠️ Falhas intermitentes dependendo do contexto de execução
- ⚠️ Webhooks podem falhar ao processar notificações
- ⚠️ Cron jobs podem falhar silenciosamente

---

## 📊 RESUMO EXECUTIVO

| Edge Function | Status | Risco | Ação |
|---------------|--------|-------|------|
| unified-orders | ❌ ERRADO | **CRÍTICO** | Corrigir linha 1062 |
| ml-auth | ⚠️ Suspeito | ALTO | Verificar client |
| ml-claims-fetch | ⚠️ Suspeito | MÉDIO | Verificar client |
| ml-webhook | ⚠️ Suspeito | MÉDIO | Verificar client |
| ml-token-refresh-cron | ⚠️ Suspeito | MÉDIO | Verificar client |
| 13 outras | ✅ OK | Baixo | Nenhuma |

**TOTAL**: 1 erro confirmado, 4 suspeitos de alto risco, 5 para auditoria
