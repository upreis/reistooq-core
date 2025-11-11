# 🔥 FASE 8: Auditoria de Colunas Duplicadas em sync-devolucoes

## 🎯 Objetivo
Identificar e remover campos que estão sendo salvos DUAS VEZES (como campo direto E dentro de JSONB), causando redundância e desperdício de espaço.

---

## 📊 ANÁLISE COMPLETA - 9 Duplicações Identificadas

### ❌ DUPLICAÇÃO 1: `status_devolucao`
**Linha 278**: Campo direto
```typescript
status_devolucao: claim.status_devolucao || claim.status || claim.claim_details?.status || null,
```

**Linha 233**: Dentro de `dados_tracking_info`
```typescript
dados_tracking_info: {
  status_devolucao: claim.status_devolucao || claim.claim_details?.status || null,
```

**✅ DECISÃO**: Remover campo direto (linha 278), manter apenas em `dados_tracking_info`

---

### ❌ DUPLICAÇÃO 2: `subtipo_claim`
**Linha 279**: Campo direto
```typescript
subtipo_claim: claim.subtipo_claim || claim.subtipo || claim.claim_details?.sub_type || null,
```

**Linha 235**: Dentro de `dados_tracking_info` (como `subtipo`)
```typescript
dados_tracking_info: {
  subtipo: claim.subtipo || claim.subtipo_claim || claim.claim_details?.sub_type || null,
```

**✅ DECISÃO**: Remover campo direto (linha 279), manter apenas em `dados_tracking_info.subtipo`

---

### ❌ DUPLICAÇÃO 3: `tipo_claim`
**Linha 280**: Campo direto
```typescript
tipo_claim: claim.tipo_claim || claim.claim_details?.type || null,
```

**Já existe em**: `dados_claim` (linha 218) como `claim_details.type`
```typescript
dados_claim: claim.claim_details || {},
```

**✅ DECISÃO**: Remover campo direto (linha 280), acessar via `dados_claim.type`

---

### ❌ DUPLICAÇÃO 4: `motivo_devolucao`
**Linha 281**: Campo direto
```typescript
motivo_devolucao: claim.motivo_devolucao || claim.reason_detail || null,
```

**Já existe em**: `dados_claim` como `claim_details.reason` ou `claim_details.reason_detail`

**✅ DECISÃO**: Remover campo direto (linha 281), acessar via `dados_claim.reason`

---

### ❌ DUPLICAÇÃO 5: `review_status`
**Linha 284**: Campo direto
```typescript
review_status: claim.review_status || null,
```

**Já existe em**: `dados_review` (linha 291)
```typescript
dados_review: claim.dados_review || {},
```

**✅ DECISÃO**: Remover campo direto (linha 284), acessar via `dados_review.status`

---

### ❌ DUPLICAÇÃO 6: `review_method`
**Linha 285**: Campo direto
```typescript
review_method: claim.review_method || null,
```

**Já existe em**: `dados_review` (linha 291)

**✅ DECISÃO**: Remover campo direto (linha 285), acessar via `dados_review.method`

---

### ❌ DUPLICAÇÃO 7: `review_stage`
**Linha 286**: Campo direto
```typescript
review_stage: claim.review_stage || null,
```

**Já existe em**: `dados_review` (linha 291)

**✅ DECISÃO**: Remover campo direto (linha 286), acessar via `dados_review.stage`

---

### ❌ DUPLICAÇÃO 8: `product_condition`
**Linha 287**: Campo direto
```typescript
product_condition: claim.product_condition || null,
```

**Já existe em**: `dados_review` (linha 291)

**✅ DECISÃO**: Remover campo direto (linha 287), acessar via `dados_review.product_condition`

---

### ❌ DUPLICAÇÃO 9: `product_destination`
**Linha 288**: Campo direto
```typescript
product_destination: claim.product_destination || null,
```

**Já existe em**: `dados_review` (linha 291)

**✅ DECISÃO**: Remover campo direto (linha 288), acessar via `dados_review.product_destination`

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Passo 1: Remover campos duplicados em sync-devolucoes
- [ ] Remover linha 278: `status_devolucao`
- [ ] Remover linha 279: `subtipo_claim`
- [ ] Remover linha 280: `tipo_claim`
- [ ] Remover linha 281: `motivo_devolucao`
- [ ] Remover linhas 284-288: `review_status`, `review_method`, `review_stage`, `product_condition`, `product_destination`

### ✅ Passo 2: Atualizar get-devolucoes para buscar de JSONBs
- [ ] Ajustar mapeamento de `status_devolucao` para `item.dados_tracking_info?.status_devolucao`
- [ ] Ajustar mapeamento de `subtipo_claim` para `item.dados_tracking_info?.subtipo`
- [ ] Ajustar mapeamento de `tipo_claim` para `item.dados_claim?.type`
- [ ] Ajustar mapeamento de `motivo_devolucao` para `item.dados_claim?.reason`
- [ ] Ajustar mapeamento de campos de review para `item.dados_review.*`

### ✅ Passo 3: Validação
- [ ] Testar sincronização com campos removidos
- [ ] Verificar que frontend continua exibindo dados corretamente
- [ ] Confirmar que não há erros de campos faltantes

---

## 🎯 RESULTADO ESPERADO
- **Antes**: 9 campos duplicados (campo direto + JSONB) = redundância
- **Depois**: Dados organizados apenas em JSONBs = estrutura limpa e escalável
- **Economia**: ~45 campos removidos por claim (9 campos × 5 bytes médios) × 1000 claims = ~45KB economizados
