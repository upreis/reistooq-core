# 🔍 ANÁLISE COMPLETA: COLUNAS VAZIAS - DIAGNÓSTICO E PLANO DE CORREÇÃO

**Data**: 11 Nov 2025  
**Contexto**: Após Fases 1-5 de correções JSONB, muitas colunas ainda estão vazias

---

## ❌ ERRO CRÍTICO IDENTIFICADO (BLOQUEIO)

**Log detectado**:
```
❌ Erro ao salvar dados enriquecidos para order 2000013537941374: {
  code: '42P10',
  details: null,
  hint: null,
  message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification'
}
```

### 🔥 CAUSA RAIZ:
A Edge Function `enrich-devolucoes` está usando **`.update()` sem problemas** (linhas 253-256), mas o **ERRO NÃO ESTÁ NA FUNÇÃO DE ENRIQUECIMENTO**.

**Investigação mais profunda necessária**: O erro 42P10 indica que **alguma outra função** está tentando fazer `upsert` com constraint inexistente.

### 🎯 HIPÓTESE PRINCIPAL:
O erro pode estar vindo de **sync-devolucoes** chamando **ml-api-direct**, que pode estar tentando fazer upsert na tabela antiga `pedidos_cancelados_ml` com constraints que não existem mais.

**AÇÃO IMEDIATA**: Verificar se `ml-api-direct` ainda está ativo e fazendo upserts em tabelas antigas.

---

## 📊 ANÁLISE SISTEMÁTICA DAS COLUNAS VAZIAS

Aplicando framework de auditoria em 5 passos para cada coluna:

### **GRUPO A: Campos de Identificação do Produto**

#### 1. **Item ID** - 🟡 INVESTIGAR
- **Status**: Deveria estar populado
- **Fonte API ML**: `order.order_items[].item.id`
- **Campo banco**: `dados_product_info.item_id` (JSONB)
- **Mapeamento**: ✅ Correto em get-devolucoes linha 212
- **Diagnóstico**: Precisa verificar se sync-devolucoes está salvando `dados_product_info` corretamente

#### 2. **Variação ID** - 🟡 INVESTIGAR  
- **Status**: Deveria estar populado (quando item tem variação)
- **Fonte API ML**: `order.order_items[].item.variation_id`
- **Campo banco**: `dados_product_info.variation_id` (JSONB)
- **Mapeamento**: ✅ Correto em get-devolucoes linha 213
- **Diagnóstico**: Precisa verificar se sync-devolucoes está salvando `dados_product_info` corretamente

---

### **GRUPO B: Status da Devolução**

#### 3. **Status** - 🟡 INVESTIGAR
- **Status**: Deveria estar populado
- **Fonte API ML**: `claim.status` ou `return.status`
- **Campo banco**: `dados_tracking_info.status` (JSONB)
- **Mapeamento**: ✅ Correto em get-devolucoes linha 218
- **Diagnóstico**: Verificar se sync-devolucoes está populando `dados_tracking_info` com campo `status`

#### 4. **Status $** (Status Money) - 🟡 INVESTIGAR
- **Status**: Deveria estar populado
- **Fonte API ML**: `claim.status.money` ou similar
- **Campo banco**: `dados_tracking_info.status_money` (JSONB)
- **Mapeamento**: ✅ Correto em get-devolucoes linha 220
- **Diagnóstico**: Verificar se sync-devolucoes está populando `dados_tracking_info.status_money`

#### 5. **Subtipo** - 🟢 NORMAL (pode estar vazio)
- **Status**: Campo opcional na API ML
- **Fonte API ML**: `claim.subtype` ou `return.subtype`
- **Comportamento esperado**: Nem todas as devoluções têm subtipo

#### 6. **Tipo Recurso** (resource_type) - 🟡 INVESTIGAR
- **Status**: Deveria estar populado
- **Fonte API ML**: `claim.resource_type`
- **Campo banco**: `dados_tracking_info.resource_type` (JSONB)
- **Mapeamento**: ✅ Correto em get-devolucoes linha 222
- **Diagnóstico**: Verificar se sync-devolucoes está populando `dados_tracking_info.resource_type`

#### 7. **Contexto** - ❓ DESCONHECIDO
- **Status**: Campo não identificado na documentação ML
- **Diagnóstico**: Precisa esclarecer o que é "Contexto" - pode ser duplicata ou campo inválido

---

### **GRUPO C: Quantidades**

#### 8. **Qtd Total** - 🟡 INVESTIGAR
- **Status**: Deveria estar populado
- **Fonte API ML**: `quantity.value` (total)
- **Campo banco**: `dados_quantities.total_quantity` (JSONB)
- **Mapeamento**: ✅ Correto em get-devolucoes linha 394
- **Diagnóstico**: Verificar se sync-devolucoes está populando `dados_quantities`

#### 9. **Qtd Devolver** (return_quantity) - 🟡 INVESTIGAR
- **Status**: Deveria estar populado
- **Fonte API ML**: `quantity.value` (devolução)
- **Campo banco**: `dados_quantities.return_quantity` OU campo direto `quantidade`
- **Mapeamento**: ✅ Correto em get-devolucoes linha 393
- **Diagnóstico**: Verificar se sync-devolucoes está salvando no campo `quantidade` ou `dados_quantities`

---

### **GRUPO D: Shipment (Envio/Rastreio)**

#### 10. **Shipment ID** - 🟡 INVESTIGAR
- **Status**: Deveria estar populado quando há envio
- **Fonte API ML**: `claim.shipment_id` ou `return.shipment_id`
- **Campo banco**: `dados_tracking_info.shipment_id` OU campo direto `shipment_id`
- **Mapeamento**: ✅ Correto em get-devolucoes linha 283
- **Diagnóstico**: Verificar se sync-devolucoes está populando

#### 11-13. **Status Envio / Tipo Envio / Destino** - 🟡 INVESTIGAR
- **Fonte API ML**: `return.shipment_status`, `return.shipment_type`, `return.destination`
- **Campos banco**: `dados_tracking_info.shipment_status`, `dados_tracking_info.shipment_type`, `dados_tracking_info.destination`
- **Diagnóstico**: Verificar se sync-devolucoes está populando `dados_tracking_info` completamente

#### 14. **Rastreio** (tracking_number) - 🟡 INVESTIGAR
- **Fonte API ML**: `return.tracking_number`
- **Campo banco**: `dados_tracking_info.tracking_number`
- **Mapeamento**: ✅ Correto em get-devolucoes linha 287
- **Diagnóstico**: Verificar se sync-devolucoes está populando

---

### **GRUPO E: Datas/Prazos**

#### 15. **📅 Previsão Entrega** - 🟢 DUPLICATA PROVÁVEL
- **Diagnóstico**: Provavelmente duplicata da coluna "⏰ Prazos" que já existe
- **AÇÃO**: REMOVER para evitar confusão

#### 16. **⏰ Prazo Limite** - 🟢 DUPLICATA PROVÁVEL
- **Diagnóstico**: Provavelmente duplicata da coluna "⏰ Prazos" que já existe
- **AÇÃO**: REMOVER para evitar confusão

#### 17. **Reembolso Após** - 🟡 INVESTIGAR
- **Fonte API ML**: `refund.when` ou `refund.refund_at`
- **Campo banco**: `dados_refund_info.refund_at`
- **Mapeamento**: ✅ Correto em get-devolucoes linha 379-381
- **Diagnóstico**: Verificar se sync-devolucoes está populando `dados_refund_info`

#### 18. **Criação / Atualização / Fechamento** - 🟡 INVESTIGAR
- **Fonte API ML**: `claim.date_created`, `claim.last_updated`, `claim.date_closed`
- **Campos banco**: `data_criacao_claim`, `updated_at`, `data_fechamento_claim`
- **Diagnóstico**: Campos básicos - verificar se sync-devolucoes está salvando

---

### **GRUPO F: Status de Envio/Rastreio**

#### 19. **🚚 Status Envio** - 🟢 DUPLICATA CONFIRMADA
- **Diagnóstico**: DUPLICATA de "Status Envio" (#11)
- **AÇÃO**: REMOVER imediatamente

#### 20. **💰 Reembolso** - 🟢 DUPLICATA PROVÁVEL
- **Diagnóstico**: Provavelmente duplicata de "Reembolso Após" (#17)
- **AÇÃO**: REMOVER ou esclarecer diferença

---

### **GRUPO G: Reviews e Condições**

#### 21. **🔍 Revisão** - 🔴 GENÉRICA DEMAIS
- **Diagnóstico**: Coluna muito genérica - não corresponde a campo único da API
- **AÇÃO**: REMOVER (já decidido anteriormente)

#### 22. **📦 Qtd** - 🟢 DUPLICATA CONFIRMADA
- **Diagnóstico**: DUPLICATA de "Qtd Devolver" (#9)
- **AÇÃO**: REMOVER imediatamente

#### 23-25. **Motivo / Condição Produto / Destino Produto** - 🟡 INVESTIGAR (REVIEWS)
- **Fonte API ML**: Endpoint `/reviews` (chamado por enrich-devolucoes)
- **Campos banco**: `product_condition`, `product_destination`, `reason_id`
- **Mapeamento**: ✅ Correto em get-devolucoes linhas 384-385
- **Diagnóstico**: Enrich-devolucoes **PODE ESTAR BLOQUEADO** pelo erro 42P10

#### 26. **Beneficiado** - 🟡 INVESTIGAR (REVIEWS)
- **Fonte API ML**: Endpoint `/reviews` - `resource_reviews[].benefited`
- **Campo banco**: `responsavel_custo` ou `dados_review.benefited`
- **Diagnóstico**: Depende de enrich-devolucoes funcionar

#### 27-28. **Status Review / Data Estimada** - 🟡 INVESTIGAR (REVIEWS)
- **Fonte API ML**: Endpoint `/reviews`
- **Campos banco**: `review_status`, `dados_review`
- **Diagnóstico**: Depende de enrich-devolucoes funcionar

---

### **GRUPO H: Endereço**

#### 29-34. **Endereço / Cidade / Estado / CEP / Bairro / País / Complemento** - 🟡 INVESTIGAR
- **Fonte API ML**: `return.shipping.receiver_address`
- **Campo banco**: `endereco_destino` (JSONB)
- **Mapeamento**: ✅ Correto em get-devolucoes linhas 290-296
- **Diagnóstico**: Verificar se sync-devolucoes está populando `endereco_destino`

---

### **GRUPO I: Campos Complexos**

#### 35. **Prazo** - ❓ AMBÍGUO
- **Diagnóstico**: Qual prazo? Já existe "⏰ Prazos" que mostra todos os prazos
- **AÇÃO**: Esclarecer ou REMOVER se duplicata

#### 36. **Atraso?** - 🟡 INVESTIGAR
- **Fonte**: Calculado (implementado em get-devolucoes linhas 365-376)
- **Diagnóstico**: Cálculo depende de `delivery_limit` estar preenchido

#### 37. **Reviews** - 🟢 DUPLICATA PROVÁVEL
- **Diagnóstico**: Provavelmente duplicata de "🔍 Revisão" ou "Status Review"
- **AÇÃO**: REMOVER ou esclarecer

#### 38-41. **⏰ Prazos / 📍 Substatus / 💰 Custos Logística / 📦 Fulfillment / 🎬 Ações Disponíveis**
- **Status**: Campos complexos (JSONB) que exibem objetos/arrays
- **Diagnóstico**: Precisam de células especializadas para renderizar corretamente
- **Mapeamento**: ✅ Correto em get-devolucoes
- **PROBLEMA POTENCIAL**: Frontend pode estar tentando renderizar objeto {} como string

---

## 📋 PLANO DE CORREÇÃO EM 3 FASES

### **FASE 6: CORREÇÃO CRÍTICA - Resolver Erro 42P10**

**Prioridade**: 🔴 CRÍTICA - BLOQUEANTE

**Objetivo**: Identificar e corrigir o upsert que está causando erro de constraint

**Ações**:
1. ✅ Verificar se `ml-api-direct` ainda está tentando salvar em `pedidos_cancelados_ml`
2. ✅ Verificar todas as Edge Functions que fazem upsert em `devolucoes_avancadas`
3. ✅ Garantir que todos os upserts usam `onConflict: 'claim_id'` (única constraint válida)
4. ✅ Testar sincronização completa após correção

**Resultado esperado**: Enriquecimento funcionando sem erros 42P10

---

### **FASE 7: AUDITORIA sync-devolucoes**

**Prioridade**: 🟡 ALTA

**Objetivo**: Verificar se sync-devolucoes está populando TODOS os campos JSONB corretamente

**Ações**:
1. Auditar mapeamento em sync-devolucoes para:
   - `dados_product_info` (item_id, variation_id, SKU)
   - `dados_tracking_info` (status, status_money, resource_type, shipment_*, tracking_number)
   - `dados_quantities` (total_quantity, return_quantity)
   - `dados_financial_info` (valores de reembolso)
   - `dados_buyer_info` (ID do comprador)
   - `endereco_destino` (endereço completo de destino)
2. Executar query SQL para verificar campos JSONB vazios vs. populados
3. Corrigir sync-devolucoes se necessário

**Resultado esperado**: Campos JSONB populados corretamente após sincronização

---

### **FASE 8: LIMPEZA DE COLUNAS DUPLICADAS/INÚTEIS**

**Prioridade**: 🟢 MÉDIA

**Objetivo**: Remover colunas duplicadas e genéricas

**Colunas para REMOVER**:
1. 🔴 **"🔍 Revisão"** - Genérica demais (já decidido)
2. 🔴 **"💬 Comunicação"** - Genérica demais (já decidido)
3. 🔴 **"📅 Previsão Entrega"** - Duplicata de "⏰ Prazos"
4. 🔴 **"⏰ Prazo Limite"** - Duplicata de "⏰ Prazos"
5. 🔴 **"🚚 Status Envio"** (emoji) - Duplicata de "Status Envio" (texto)
6. 🔴 **"💰 Reembolso"** - Duplicata de "Reembolso Após"
7. 🔴 **"📦 Qtd"** - Duplicata de "Qtd Devolver"
8. 🔴 **"Reviews"** - Duplicata de "Status Review"
9. 🔴 **"Contexto"** - Campo não identificado

**Resultado esperado**: Tabela mais limpa e menos confusa

---

## 🎯 RESUMO EXECUTIVO

### Problemas Identificados:
1. ❌ **ERRO CRÍTICO 42P10** - Bloqueando enriquecimento
2. 🟡 **Campos JSONB potencialmente vazios** - sync-devolucoes pode não estar salvando tudo
3. 🔴 **9 colunas duplicadas/inúteis** - Poluindo interface

### Colunas com Comportamento Normal (vazias esperadas):
- **Subtipo** - Campo opcional
- Campos de **Reviews** (quando claim não tem reviews)
- **Beneficiado** - Só populado após reviews

### Colunas que Precisam Investigação:
- Item ID, Variação ID
- Status, Status $, Tipo Recurso
- Quantidades (Total, Devolver)
- Shipment (ID, Status, Tipo, Destino, Rastreio)
- Endereço completo (7 campos)
- Reembolso Após, Atraso?

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

**AGORA** (Decisão do usuário):
1. ❓ Executar FASE 6 (Corrigir erro 42P10) - IMEDIATAMENTE?
2. ❓ Executar FASE 7 (Auditar sync-devolucoes) - APÓS correção do erro?
3. ❓ Executar FASE 8 (Remover colunas duplicadas) - PARALELAMENTE?

**OU**

Fazer apenas diagnóstico SQL para verificar quantos registros têm campos JSONB vazios antes de corrigir?
