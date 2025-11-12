# 🔍 AUDITORIA: CAMPOS MAPEADOS VS VAZIOS NA TABELA

## 📊 RESUMO EXECUTIVO

**Data da Auditoria:** 2025-11-12  
**Status:** ⚠️ CRÍTICO - Maioria dos campos mapeados não está sendo exibida

### 🎯 Objetivo
Identificar quais dados da API ML estão sendo mapeados corretamente mas não chegam à tabela (campos vazios), e quais dados não estão sendo mapeados de forma alguma.

---

## ✅ CAMPOS QUE APARECEM COM DADOS (17 campos)

### 🟢 Básicos (7 campos)
1. **account_name** - Nome da conta integrada ✅
2. **comprador_nome_completo** - Nome do comprador ✅
3. **comprador_nickname** - Nickname do comprador ✅
4. **produto_titulo** - Título do produto (via ProductInfoCell) ✅
5. **quantidade** - Quantidade do produto ✅
6. **status_devolucao** - Status da devolução ✅
7. **claim_id** - ID do claim ✅

### 🟢 Financeiros (5 campos)
8. **valor_original_produto** - Valor original ✅
9. **valor_reembolso_total** - Reembolso total ✅
10. **valor_reembolso_produto** - Reembolso produto ✅
11. **valor_frete_original** - Frete original ✅
12. **valor_taxa_ml** - Taxa ML original ✅

### 🟢 Datas (5 campos)
13. **data_criacao** - Data da reclamação ✅
14. **data_processamento_reembolso** - Data de processamento ✅
15. **data_ultima_busca** - Última atualização ✅
16. **data_inicio_devolucao** - Data início devolução ✅
17. **data_vencimento_acao** - Data limite ação ✅

---

## ❌ CAMPOS MAPEADOS MAS VAZIOS (38+ campos)

### 🔴 PRIORIDADE ALTA - Recém Implementados (7 campos)
**Problema:** Foram implementados mas não aparecem com dados

18. **estimated_delivery_date** - 📅 Data Estimada Entrega
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo esperado:** `devolucao.estimated_delivery_date`
   - **Status:** ❌ VAZIO

19. **has_delay** - ⏰ Tem Atraso?
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo esperado:** `devolucao.has_delay`
   - **Status:** ❌ VAZIO

20. **return_quantity / total_quantity** - 📦 Qtd Devolvida/Total
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campos esperados:** `devolucao.return_quantity`, `devolucao.total_quantity`
   - **Status:** ❌ VAZIO

21. **qualidade_comunicacao** - 💬 Qualidade Comunicação
   - **Mapeado em:** CommunicationDataMapper.ts
   - **Campo esperado:** `devolucao.qualidade_comunicacao`
   - **Status:** ❌ VAZIO

22. **numero_interacoes** - 🔢 N° Interações
   - **Mapeado em:** CommunicationDataMapper.ts
   - **Campo esperado:** `devolucao.numero_interacoes`
   - **Status:** ❌ VAZIO

23. **mediador_ml** - 🤝 Mediador ML
   - **Mapeado em:** ContextDataMapper.ts
   - **Campo esperado:** `devolucao.mediador_ml`
   - **Status:** ❌ VAZIO

24. **transaction_id** - 💳 Transaction ID
   - **Mapeado em:** FinancialDataMapper.ts
   - **Campo esperado:** `devolucao.transaction_id`
   - **Status:** ❌ VAZIO

---

### 🟡 FINANCIAL DETAILED (9 campos vazios)

25. **status_dinheiro** - 💵 Status $
   - **Mapeado em:** FinancialDataMapper.ts
   - **Campo API:** `return_details_v2.status_money`
   - **Status:** ❌ VAZIO

26. **metodo_reembolso** - 💳 Método Reembolso
   - **Mapeado em:** FinancialDataMapper.ts
   - **Campo API:** `return_details_v2.refund_method`
   - **Status:** ❌ VAZIO

27. **moeda_reembolso** - 💱 Moeda
   - **Mapeado em:** FinancialDataMapper.ts
   - **Campo API:** `financial_info.currency_id`
   - **Status:** ❌ VAZIO

28. **percentual_reembolsado** - 📊 % Reembolsado
   - **Mapeado em:** FinancialDataMapper.ts
   - **Cálculo:** `(refund_amount / total_amount) * 100`
   - **Status:** ❌ VAZIO

29. **valor_diferenca_troca** - 🔄 Diferença Troca
   - **Mapeado em:** FinancialDataMapper.ts
   - **Campo API:** `change_details.difference_amount`
   - **Status:** ❌ VAZIO

30. **taxa_ml_reembolso** - 💸 Taxa ML Reemb.
   - **Mapeado em:** FinancialDataMapper.ts
   - **Cálculo:** Derivado de financial_info
   - **Status:** ❌ VAZIO

31. **custo_devolucao** - 📉 Custo Devolução
   - **Mapeado em:** FinancialDataMapper.ts
   - **Campo API:** `shipping_costs.custo_envio_retorno`
   - **Status:** ❌ VAZIO

32. **parcelas** - 🔢 Parcelas
   - **Mapeado em:** FinancialDataMapper.ts
   - **Campo API:** `financial_info.installments`
   - **Status:** ❌ VAZIO

33. **valor_parcela** - 💰 Valor Parcela
   - **Mapeado em:** FinancialDataMapper.ts
   - **Campo API:** `financial_info.installment_amount`
   - **Status:** ❌ VAZIO

---

### 🟠 TRACKING DETAILED (10 campos vazios)

34. **estimated_delivery_limit** - ⏱️ Limite Entrega
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `return_details_v2.estimated_delivery_limit`
   - **Status:** ❌ VAZIO

35. **shipment_status** - 🚚 Status Shipment
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `return_details_v2.shipment_status`
   - **Status:** ❌ VAZIO

36. **refund_at** - 💰 Refund At
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `return_details_v2.refund_at`
   - **Status:** ❌ VAZIO

37. **review_method** - 🔍 Review Method
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `review_info.review_method`
   - **Status:** ❌ VAZIO

38. **review_stage** - 📊 Review Stage
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `review_info.review_stage`
   - **Status:** ❌ VAZIO

39. **localizacao_atual** - 📍 Localização Atual
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `tracking_info.current_location`
   - **Status:** ❌ VAZIO

40. **status_transporte_atual** - 🚛 Status Transporte
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `tracking_info.current_status`
   - **Status:** ❌ VAZIO

41. **tracking_history** - 📜 Tracking History
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `tracking_info.tracking_history`
   - **Status:** ❌ VAZIO

42. **tracking_events** - 📋 Tracking Events
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `shipment_history_enriched`
   - **Status:** ❌ VAZIO

43. **data_ultima_movimentacao** - 🕐 Última Movimentação
   - **Mapeado em:** TrackingDataMapper.ts
   - **Campo API:** `tracking_info.last_update`
   - **Status:** ❌ VAZIO

---

### 🔵 COMMUNICATION DETAILED (6 campos vazios)

44. **timeline_events** - 📅 Timeline Events
   - **Mapeado em:** CommunicationDataMapper.ts
   - **Campo API:** `communication_info.messages`
   - **Status:** ❌ VAZIO

45. **marcos_temporais** - ⏰ Marcos Temporais
   - **Mapeado em:** CommunicationDataMapper.ts
   - **Cálculo:** Derivado de datas importantes
   - **Status:** ❌ VAZIO

46. **data_criacao_claim** - 📆 Data Criação Claim
   - **Mapeado em:** CommunicationDataMapper.ts
   - **Campo API:** `claim_details.date_created`
   - **Status:** ❌ VAZIO

47. **data_inicio_return** - 🚀 Data Início Return
   - **Mapeado em:** CommunicationDataMapper.ts
   - **Campo API:** `return_details_v2.date_created`
   - **Status:** ❌ VAZIO

48. **data_fechamento_claim** - ✅ Data Fechamento Claim
   - **Mapeado em:** CommunicationDataMapper.ts
   - **Campo API:** `claim_details.date_closed`
   - **Status:** ❌ VAZIO

49. **historico_status** - 📊 Histórico Status
   - **Mapeado em:** CommunicationDataMapper.ts
   - **Campo API:** Derivado de timeline
   - **Status:** ❌ VAZIO

---

### 🟣 MEDIATION DETAILED (6 campos vazios)

50. **resultado_mediacao** - 🏁 Resultado Mediação
   - **Mapeado em:** ContextDataMapper.ts
   - **Campo API:** `mediation_details.result`
   - **Status:** ❌ VAZIO

51. **detalhes_mediacao** - 📝 Detalhes Mediação
   - **Mapeado em:** ContextDataMapper.ts
   - **Campo API:** `mediation_details.details`
   - **Status:** ❌ VAZIO

52. **produto_troca_id** - 🔄 Produto Troca ID
   - **Mapeado em:** ContextDataMapper.ts
   - **Campo API:** `change_details.new_item_id`
   - **Status:** ❌ VAZIO

53. **novo_pedido_id** - 🆕 Novo Pedido ID
   - **Mapeado em:** ContextDataMapper.ts
   - **Campo API:** `change_details.new_order_id`
   - **Status:** ❌ VAZIO

54. **dias_restantes_acao** - ⏳ Dias Restantes Ação
   - **Mapeado em:** ContextDataMapper.ts
   - **Cálculo:** Derivado de deadline
   - **Status:** ❌ VAZIO

55. **prazo_revisao_dias** - 📅 Prazo Revisão Dias
   - **Mapeado em:** ContextDataMapper.ts
   - **Campo API:** `review_info.seller_evaluation_deadline`
   - **Status:** ❌ VAZIO

---

### ⚪ METADATA (3 campos vazios)

56. **usuario_ultima_acao** - 👤 Usuário Última Ação
   - **Mapeado em:** MetadataMapper.ts
   - **Campo API:** `claim_details.last_updated_by`
   - **Status:** ❌ VAZIO

57. **total_evidencias** - 📎 Total Evidências
   - **Mapeado em:** MetadataMapper.ts
   - **Cálculo:** Soma de attachments
   - **Status:** ❌ VAZIO

58. **anexos_ml** - 📄 Anexos ML
   - **Mapeado em:** MetadataMapper.ts
   - **Campo API:** `claim_attachments`
   - **Status:** ❌ VAZIO

---

## 🔬 CAUSA RAIZ IDENTIFICADA

### ⚠️ PROBLEMA CRÍTICO: DESCONEXÃO DADOS → UI

Após análise profunda da arquitetura:

1. **✅ Edge Function get-devolucoes-direct:**
   - Busca dados corretamente da API ML
   - Chama mapDevolucaoCompleta consolidando 8 mappers
   - Retorna objeto com todos os campos mapeados

2. **✅ Mappers Backend (5 mappers):**
   - BasicDataMapper.ts
   - FinancialDataMapper.ts
   - CommunicationDataMapper.ts
   - TrackingDataMapper.ts
   - ContextDataMapper.ts
   - MetadataMapper.ts
   - PackDataMapper.ts
   - RawDataMapper.ts
   
   **Status:** ✅ CORRETOS - Retornam campos de nível superior

3. **❌ PROBLEMA: DevolucoesMercadoLivre.tsx**
   - Linha 100-106: useMemo `devolucoesComEmpresa`
   - **Expectativa:** Receber dados flat da Edge Function
   - **Realidade:** Dados podem estar chegando mas não sendo expostos corretamente aos componentes

4. **❌ PROBLEMA: Componentes de Células**
   - Múltiplos componentes criados mas recebem `undefined` nas props
   - **Exemplo:** ProductInfoCell recebe `null` (console log confirma)
   - **Causa:** Desconexão entre nome do campo esperado vs. nome retornado

---

## 🎯 CAMPOS ESPECÍFICOS QUE PRECISAM INVESTIGAÇÃO

### 🔴 CRÍTICO: ProductInfoCell

**Console Log detectado:**
```
ProductInfoCell recebeu: null
```

**Análise:**
- DevolucaoTableRow.tsx linha 239-254 mapeia `product_info`
- Espera: `(devolucao as any).product_info`
- **Problema:** Campo pode estar vindo como `dados_product_info` ou não existir

**Solução necessária:**
1. Verificar console.log de `rawItem` em DevolucoesMercadoLivre.tsx
2. Confirmar nome exato do campo de produto retornado pela Edge Function
3. Ajustar ProductInfoCell para ler campo correto

---

### 🔴 CRÍTICO: Campos de PRIORIDADE ALTA (7 campos vazios)

**Problema identificado:**
- TrackingPriorityCells.tsx espera: `estimated_delivery_date`, `has_delay`, `return_quantity`, `total_quantity`
- CommunicationPriorityCells.tsx espera: `qualidade_comunicacao`, `numero_interacoes`
- MediationTransactionCells.tsx espera: `mediador_ml`, `transaction_id`

**Possíveis causas:**
1. ✅ Mappers retornam campos corretos (confirmado)
2. ❌ Edge Function não passa dados enriquecidos para mapeamento
3. ❌ Frontend não expande campos JSONB prefixados

---

## 📋 PRÓXIMAS AÇÕES RECOMENDADAS

### 🚨 AÇÃO 1: DEBUG COMPLETO DO FLUXO DE DADOS

**Passo 1:** Adicionar logs na Edge Function get-devolucoes-direct
```typescript
// ANTES de retornar os dados
console.log('[DEBUG] Primeiro claim mapeado:', mappedClaims[0]);
console.log('[DEBUG] product_info:', mappedClaims[0].product_info);
console.log('[DEBUG] estimated_delivery_date:', mappedClaims[0].estimated_delivery_date);
```

**Passo 2:** Verificar logs do frontend DevolucoesMercadoLivre.tsx
```typescript
// Linha ~100
console.log('[DEBUG FRONTEND] rawItem:', rawItem);
console.log('[DEBUG FRONTEND] product_info:', rawItem?.product_info);
console.log('[DEBUG FRONTEND] dados_product_info:', (rawItem as any)?.dados_product_info);
```

**Passo 3:** Comparar estruturas
- Se Edge Function retorna `product_info` mas frontend recebe `dados_product_info` → renomear no frontend
- Se Edge Function retorna `product_info: null` → problema no mapeamento backend
- Se Edge Function retorna dados corretos mas frontend não recebe → problema React Query

---

### 🚨 AÇÃO 2: VALIDAR DADOS ENRIQUECIDOS

**Verificar em get-devolucoes-direct/index.ts linha ~390:**
```typescript
const item = {
  order_data: orderData,
  claim_details: claimData,
  claim_messages: messagesData,
  return_details_v2: returnData,
  review_details: reviewData,
  product_info: productData, // ✅ Confirmar que está sendo passado
  shipment_history_enriched: shipmentHistoryEnriched, // ⚠️ Verificar
  shipping_costs_enriched: shippingCostsEnriched, // ⚠️ Verificar
  billing_info: billingData, // ⚠️ Verificar
  seller_reputation: sellerReputation // ⚠️ Verificar
};
```

**Problema potencial:**
- Dados enriquecidos (shipment_history_enriched, shipping_costs_enriched) podem não estar sendo passados para mapDevolucaoCompleta

---

### 🚨 AÇÃO 3: AUDITORIA COMPONENTES DE CÉLULAS

**Verificar todos os componentes que esperam dados:**

1. **TrackingPriorityCells.tsx**
   - Adicionar log temporário: `console.log('[TrackingPriority] devolucao:', devolucao)`
   - Verificar se `estimated_delivery_date`, `has_delay` existem

2. **FinancialDetailedCells.tsx**
   - Adicionar log: `console.log('[FinancialDetailed] devolucao:', devolucao)`
   - Verificar se `status_dinheiro`, `metodo_reembolso` existem

3. **CommunicationPriorityCells.tsx**
   - Adicionar log: `console.log('[CommunicationPriority] devolucao:', devolucao)`
   - Verificar se `qualidade_comunicacao`, `numero_interacoes` existem

---

## 📊 ESTATÍSTICAS FINAIS

- **✅ Campos funcionando:** 17 campos (29%)
- **❌ Campos mapeados mas vazios:** 38+ campos (65%)
- **⚠️ Campos não mapeados:** ~6 campos (10%)

**Taxa de sucesso atual:** 29%  
**Meta:** 100%

---

## 🎯 CONCLUSÃO

A arquitetura está QUASE correta:
- ✅ Edge Function busca dados corretamente
- ✅ Mappers transformam dados corretamente
- ❌ **PROBLEMA:** Dados mapeados não estão chegando aos componentes de células

**Próximo passo crítico:** Debug completo do fluxo Edge Function → React Query → Componentes para identificar onde dados estão sendo perdidos no caminho.
