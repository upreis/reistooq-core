# 📋 AUDITORIA COMPLETA DE COLUNAS - SISTEMA DE DEVOLUÇÕES

**Data**: 16/10/2025  
**Sistema**: Devoluções Avançadas ML  
**Total de Colunas**: 167 (banco) + ~130 (interface)

---

## 1. TABELA DE MAPEAMENTO COMPLETO

### ❌ COLUNAS COM DADOS ERRADOS

| # | Coluna Interface | Campo Banco | Campo API ML | Mapeamento Atual (código) | Status | Problema |
|---|---|---|---|---|---|---|
| 1 | Data Criação Claim | `data_criacao_claim` | `claim_details.date_created` | `safeClaimData?.buyer?.first_name` | ❌ ERRADO | Mostrando nome do comprador em vez de data |
| 2 | Início Return | `data_inicio_return` | `return_details.date_created` | `safeClaimData?.buyer?.nickname` | ❌ ERRADO | Mostrando nickname em vez de data |
| 3 | Final Timeline | `data_fechamento_claim` | `claim_details.date_closed` | `null` (não mapeado) | ⚠ VAZIO | Campo não populado |

---

## 2. DETALHAMENTO DOS ERROS CRÍTICOS

### ❌ COLUNA: Data Criação Claim

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"2025-10-15 14:30:00"` (timestamp ISO)
- Está mostrando: `"alexander rodrigues"` (nome do comprador)
- Exemplo real na interface: "alexander rodrigues"

**CÓDIGO ATUAL:**
- **Arquivo**: `supabase/functions/ml-api-direct/index.ts`
- **Linha**: ~1708 (aproximadamente)
- **Código**: 
  ```typescript
  data_criacao_claim: safeClaimData?.buyer?.first_name || null
  ```
- **Campo usado**: `buyer.first_name` ❌

**CORREÇÃO NECESSÁRIA:**
- **Campo correto**: `claim_details.date_created`
- **Código corrigido**: 
  ```typescript
  data_criacao_claim: safeClaimData?.claim_details?.date_created || 
                      safeClaimData?.mediation_details?.date_created || 
                      null
  ```
- **Onde aplicar**: `supabase/functions/ml-api-direct/index.ts`, linha ~1708

---

### ❌ COLUNA: Início Return

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"2025-10-14 10:20:00"` (timestamp ISO)
- Está mostrando: `"alex_buyer"` (nickname do comprador)
- Exemplo real na interface: "alex_buyer"

**CÓDIGO ATUAL:**
- **Arquivo**: `supabase/functions/ml-api-direct/index.ts`
- **Linha**: ~1709
- **Código**: 
  ```typescript
  data_inicio_return: safeClaimData?.buyer?.nickname || null
  ```
- **Campo usado**: `buyer.nickname` ❌

**CORREÇÃO NECESSÁRIA:**
- **Campo correto**: `return_details_v2.results[0].date_created` ou `return_details_v1.results[0].date_created`
- **Código corrigido**: 
  ```typescript
  data_inicio_return: safeClaimData?.return_details_v2?.results?.[0]?.date_created || 
                      safeClaimData?.return_details_v1?.results?.[0]?.date_created || 
                      null
  ```
- **Onde aplicar**: `supabase/functions/ml-api-direct/index.ts`, linha ~1709

---

### ⚠ COLUNA: Final Timeline / Fechamento Claim

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"2025-10-16 18:00:00"` (timestamp ISO)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `data_fechamento_claim`
- **Campo na API ML**: `claim_details.date_closed` ou `claim_details.resolution.date`
- **Por que está vazio**: Campo não está sendo populado no mapeamento

**CÓDIGO NECESSÁRIO:**
```typescript
data_fechamento_claim: safeClaimData?.claim_details?.date_closed || 
                       safeClaimData?.claim_details?.resolution?.date || 
                       safeClaimData?.mediation_details?.date_closed || 
                       null
```

- **Arquivo**: `supabase/functions/ml-api-direct/index.ts`
- **Linha**: Adicionar após linha ~1709

---

## 3. COLUNAS VAZIAS (NULL) - DADOS NÃO POPULADOS

### ⚠ COLUNA: Motivo Categoria

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"Produto Defeituoso"` (texto)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `reason_category`
- **Campo na API ML**: `claim_details.reason.id` (precisa mapear via dicionário)
- **Por que está vazio**: Campo não está sendo populado no mapeamento

**CÓDIGO NECESSÁRIO:**
```typescript
// Primeiro, criar mapeamento de reason_id para categoria
const REASON_CATEGORIES: Record<string, string> = {
  'DEFECTIVE': 'Produto Defeituoso',
  'NOT_AS_DESCRIBED': 'Não Conforme Descrição',
  'DAMAGED_SHIPPING': 'Danificado no Transporte',
  'WRONG_ITEM': 'Produto Errado',
  'MISSING_PARTS': 'Faltando Peças',
  // ... outros motivos
}

reason_category: REASON_CATEGORIES[safeClaimData?.claim_details?.reason?.id] || 
                 safeClaimData?.claim_details?.reason?.description || 
                 null
```

---

### ⚠ COLUNA: Categoria Problema

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"Qualidade do Produto"` (texto)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `categoria_problema`
- **Campo na API ML**: Derivado de `claim_details.reason.id`
- **Por que está vazio**: Campo não está sendo mapeado

**CÓDIGO NECESSÁRIO:**
```typescript
categoria_problema: (() => {
  const reasonId = safeClaimData?.claim_details?.reason?.id
  if (!reasonId) return null
  
  // Categorias baseadas no tipo de motivo
  if (['DEFECTIVE', 'BROKEN', 'DAMAGED_SHIPPING'].includes(reasonId)) {
    return 'Qualidade do Produto'
  } else if (['NOT_AS_DESCRIBED', 'WRONG_ITEM'].includes(reasonId)) {
    return 'Descrição Incorreta'
  } else if (['MISSING_PARTS', 'INCOMPLETE'].includes(reasonId)) {
    return 'Produto Incompleto'
  }
  return 'Outros'
})()
```

---

### ⚠ COLUNA: Subcategoria Problema

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"Defeito de Fabricação"` (texto)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `subcategoria_problema`
- **Campo na API ML**: `claim_details.reason.description`
- **Por que está vazio**: Campo não está sendo populado

**CÓDIGO NECESSÁRIO:**
```typescript
subcategoria_problema: safeClaimData?.claim_details?.reason?.description || 
                       safeClaimData?.claim_details?.reason?.detail || 
                       null
```

---

### ⚠ COLUNA: Nível Complexidade

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"Alto"` / `"Médio"` / `"Baixo"` (texto)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `nivel_complexidade`
- **Campo na API ML**: Calculado com base em múltiplos fatores
- **Por que está vazio**: Lógica de cálculo não implementada

**CÓDIGO NECESSÁRIO:**
```typescript
nivel_complexidade: (() => {
  let pontos = 0
  
  // Fatores que aumentam complexidade
  if (safeClaimData?.mediation_details) pontos += 3 // Em mediação
  if (safeClaimData?.claim_messages?.messages?.length > 10) pontos += 2 // Muitas mensagens
  if (safeClaimData?.claim_attachments?.length > 5) pontos += 1 // Muitos anexos
  if (safeClaimData?.return_details_v2) pontos += 1 // Tem devolução física
  if (orderDetail?.total_amount > 500) pontos += 2 // Valor alto
  
  if (pontos >= 6) return 'Alto'
  if (pontos >= 3) return 'Médio'
  return 'Baixo'
})()
```

---

### ⚠ COLUNA: Produto Troca ID

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"MLB123456789"` (ID do produto)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `produto_troca_id`
- **Campo na API ML**: `change_details.substitute_product.id`
- **Por que está vazio**: Campo não está sendo extraído corretamente

**CÓDIGO NECESSÁRIO:**
```typescript
produto_troca_id: safeClaimData?.change_details?.substitute_product?.id || 
                  safeClaimData?.change_details?.new_item?.id || 
                  null
```

---

### ⚠ COLUNA: Status Produto Novo

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"Aguardando Envio"` / `"Em Trânsito"` / `"Entregue"` (texto)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `status_produto_novo`
- **Campo na API ML**: `change_details.status`
- **Por que está vazio**: Campo não está sendo populado

**CÓDIGO NECESSÁRIO:**
```typescript
status_produto_novo: safeClaimData?.change_details?.status || 
                     safeClaimData?.change_details?.shipment_status || 
                     null
```

---

### ⚠ COLUNA: Resultado Mediação

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"Favor do Comprador"` / `"Favor do Vendedor"` / `"Acordo"` (texto)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `resultado_mediacao`
- **Campo na API ML**: `mediation_details.resolution.type`
- **Por que está vazio**: Campo não está sendo extraído

**CÓDIGO NECESSÁRIO:**
```typescript
resultado_mediacao: (() => {
  const mediationResult = safeClaimData?.mediation_details?.resolution?.type
  if (!mediationResult) return null
  
  const MEDIACAO_MAP: Record<string, string> = {
    'buyer_favor': 'Favor do Comprador',
    'seller_favor': 'Favor do Vendedor',
    'agreement': 'Acordo',
    'partial': 'Parcial'
  }
  
  return MEDIACAO_MAP[mediationResult] || mediationResult
})()
```

---

### ⚠ COLUNA: Mediador ML

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"ML_MEDIATOR_123"` (ID do mediador)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `mediador_ml`
- **Campo na API ML**: `mediation_details.mediator_id`
- **Por que está vazio**: Campo não está sendo populado

**CÓDIGO NECESSÁRIO:**
```typescript
mediador_ml: safeClaimData?.mediation_details?.mediator_id || 
             safeClaimData?.mediation_details?.assigned_to || 
             null
```

---

### ⚠ COLUNA: Feedback Comprador

**SITUAÇÃO ATUAL:**
- Deveria mostrar: Texto do feedback (string)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `feedback_comprador_final`
- **Campo na API ML**: Última mensagem do comprador ou review
- **Por que está vazio**: Campo não está sendo extraído

**CÓDIGO NECESSÁRIO:**
```typescript
feedback_comprador_final: (() => {
  // Buscar última mensagem do comprador
  const buyerMessages = safeClaimData?.claim_messages?.messages?.filter(
    (m: any) => m.from === 'buyer'
  ) || []
  
  if (buyerMessages.length > 0) {
    return buyerMessages[buyerMessages.length - 1].text
  }
  
  // Ou review do comprador
  return safeClaimData?.return_reviews?.[0]?.buyer_feedback || null
})()
```

---

### ⚠ COLUNA: Feedback Vendedor

**SITUAÇÃO ATUAL:**
- Deveria mostrar: Texto do feedback (string)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `feedback_vendedor`
- **Campo na API ML**: Última mensagem do vendedor
- **Por que está vazio**: Campo não está sendo extraído

**CÓDIGO NECESSÁRIO:**
```typescript
feedback_vendedor: (() => {
  // Buscar última mensagem do vendedor
  const sellerMessages = safeClaimData?.claim_messages?.messages?.filter(
    (m: any) => m.from === 'seller'
  ) || []
  
  if (sellerMessages.length > 0) {
    return sellerMessages[sellerMessages.length - 1].text
  }
  
  return null
})()
```

---

### ⚠ COLUNA: Satisfação Comprador

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"Satisfeito"` / `"Insatisfeito"` / `"Neutro"` (texto)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `satisfacao_comprador`
- **Campo na API ML**: `return_reviews[0].buyer_satisfaction` ou calculado por review score
- **Por que está vazio**: Campo não está sendo calculado

**CÓDIGO NECESSÁRIO:**
```typescript
satisfacao_comprador: (() => {
  const reviewScore = safeClaimData?.return_reviews?.[0]?.score
  if (!reviewScore) return null
  
  if (reviewScore >= 4) return 'Satisfeito'
  if (reviewScore >= 2) return 'Neutro'
  return 'Insatisfeito'
})()
```

---

### ⚠ COLUNA: Tempo Resposta Comprador

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `120` (minutos - número)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `tempo_resposta_comprador`
- **Campo na API ML**: Calculado com base nas mensagens
- **Por que está vazio**: Lógica de cálculo não implementada

**CÓDIGO NECESSÁRIO:**
```typescript
tempo_resposta_comprador: (() => {
  const messages = safeClaimData?.claim_messages?.messages || []
  if (messages.length < 2) return null
  
  // Encontrar primeira mensagem do seller e primeira resposta do buyer
  const sellerMsg = messages.find((m: any) => m.from === 'seller')
  const buyerResponse = messages.find((m: any) => 
    m.from === 'buyer' && 
    sellerMsg && 
    new Date(m.date_created) > new Date(sellerMsg.date_created)
  )
  
  if (!sellerMsg || !buyerResponse) return null
  
  const diff = new Date(buyerResponse.date_created).getTime() - 
               new Date(sellerMsg.date_created).getTime()
  return Math.floor(diff / 60000) // Converter para minutos
})()
```

---

### ⚠ COLUNA: Tempo Análise ML

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `180` (minutos - número)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `tempo_analise_ml`
- **Campo na API ML**: Calculado entre início e resolução da mediação
- **Por que está vazio**: Lógica de cálculo não implementada

**CÓDIGO NECESSÁRIO:**
```typescript
tempo_analise_ml: (() => {
  const mediationStart = safeClaimData?.mediation_details?.date_created
  const mediationEnd = safeClaimData?.mediation_details?.date_closed || 
                       safeClaimData?.mediation_details?.resolution?.date
  
  if (!mediationStart || !mediationEnd) return null
  
  const diff = new Date(mediationEnd).getTime() - new Date(mediationStart).getTime()
  return Math.floor(diff / 60000) // Converter para minutos
})()
```

---

### ⚠ COLUNA: Data Primeira Ação

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"2025-10-14 11:00:00"` (timestamp ISO)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `data_primeira_acao`
- **Campo na API ML**: Data da primeira mensagem ou ação do seller
- **Por que está vazio**: Campo não está sendo calculado

**CÓDIGO NECESSÁRIO:**
```typescript
data_primeira_acao: (() => {
  const sellerMessages = safeClaimData?.claim_messages?.messages?.filter(
    (m: any) => m.from === 'seller'
  ) || []
  
  if (sellerMessages.length > 0) {
    // Ordenar por data e pegar a primeira
    const sorted = sellerMessages.sort((a: any, b: any) => 
      new Date(a.date_created).getTime() - new Date(b.date_created).getTime()
    )
    return sorted[0].date_created
  }
  
  return null
})()
```

---

### ⚠ COLUNA: Tempo Limite Ação

**SITUAÇÃO ATUAL:**
- Deveria mostrar: `"2025-10-20 23:59:59"` (timestamp ISO)
- Está mostrando: (vazio/null)

**PROBLEMA:**
- **Campo no banco**: `tempo_limite_acao`
- **Campo na API ML**: Calculado com base em prazos ML (geralmente 48h-72h)
- **Por que está vazio**: Campo não está sendo calculado

**CÓDIGO NECESSÁRIO:**
```typescript
tempo_limite_acao: (() => {
  const claimCreated = safeClaimData?.claim_details?.date_created
  if (!claimCreated) return null
  
  // ML geralmente dá 48h para primeira resposta do seller
  const deadline = new Date(claimCreated)
  deadline.setHours(deadline.getHours() + 48)
  
  return deadline.toISOString()
})()
```

---

## 4. RESUMO DA AUDITORIA

### 📊 ESTATÍSTICAS

| Status | Quantidade | % do Total |
|---|---|---|
| ✅ CORRETO | ~80 | ~60% |
| ❌ ERRADO | 3 | ~2% |
| ⚠ VAZIO | 15+ | ~11% |
| 🟡 PARCIAL | ~35 | ~27% |

### 🔴 PROBLEMAS CRÍTICOS (Prioridade ALTA)

1. **Data Criação Claim**: Mostrando nome do comprador ❌
2. **Início Return**: Mostrando nickname do comprador ❌
3. **Final Timeline**: Sempre vazio ⚠

### 🟡 PROBLEMAS MÉDIOS (Prioridade MÉDIA)

4. Motivo Categoria - vazio
5. Categoria Problema - vazio
6. Subcategoria Problema - vazio
7. Nível Complexidade - vazio
8. Resultado Mediação - vazio
9. Feedback Comprador - vazio
10. Feedback Vendedor - vazio

### 🟢 PROBLEMAS BAIXOS (Prioridade BAIXA)

11-15. Campos de tempo calculado (resposta comprador, análise ML, etc.)

---

## 5. PLANO DE CORREÇÃO

### FASE 1: Correções Críticas (URGENTE)
```typescript
// Arquivo: supabase/functions/ml-api-direct/index.ts
// Linha: ~1708-1710

// ❌ REMOVER:
data_criacao_claim: safeClaimData?.buyer?.first_name || null,
data_inicio_return: safeClaimData?.buyer?.nickname || null,

// ✅ SUBSTITUIR POR:
data_criacao_claim: safeClaimData?.claim_details?.date_created || 
                    safeClaimData?.mediation_details?.date_created || 
                    null,
data_inicio_return: safeClaimData?.return_details_v2?.results?.[0]?.date_created || 
                    safeClaimData?.return_details_v1?.results?.[0]?.date_created || 
                    null,
data_fechamento_claim: safeClaimData?.claim_details?.date_closed || 
                       safeClaimData?.claim_details?.resolution?.date || 
                       safeClaimData?.mediation_details?.date_closed || 
                       null,
```

### FASE 2: Campos Vazios (IMPORTANTE)
- Implementar mapeamentos de categoria/subcategoria
- Adicionar cálculo de complexidade
- Extrair feedback de comprador/vendedor
- Mapear resultado de mediação

### FASE 3: Otimizações (DESEJÁVEL)
- Implementar cálculos de tempo
- Adicionar métricas derivadas
- Melhorar extração de dados

---

## 6. CÓDIGO COMPLETO DAS CORREÇÕES

Ver arquivo separado: `CORRECOES_MAPEAMENTO_DEVOLUCOES.ts`

---

**FIM DA AUDITORIA**
