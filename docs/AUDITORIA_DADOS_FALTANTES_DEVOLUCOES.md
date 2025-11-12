# 🔍 AUDITORIA: Dados Faltantes na Página /devolucoes-ml

**Data:** 12/11/2025  
**Objetivo:** Identificar dados importantes da API ML que ainda não estamos trazendo

---

## 📊 DADOS ATUALMENTE IMPLEMENTADOS

### ✅ Endpoints já sendo chamados:
1. `/post-purchase/v1/claims/search` - Claims principais
2. `/orders/{order_id}` - Dados do pedido original
3. `/post-purchase/v1/claims/{claim_id}/messages` - Mensagens
4. `/post-purchase/v2/claims/{claim_id}/returns` - Detalhes de devolução
5. `/post-purchase/v1/returns/{return_id}/reviews` - Revisões
6. `/items/{item_id}` - Info do produto (thumbnail, SKU, etc.)
7. `/orders/{order_id}/billing_info` - CPF/CNPJ do comprador
8. `/users/{seller_id}` - Reputação vendedor (power seller, mercado líder)
9. `/shipments/{shipment_id}` - Histórico de rastreamento
10. `/post-purchase/v1/claims/{claim_id}/change_details` - Detalhes de troca
11. `/post-purchase/v1/claims/{claim_id}/attachments` - Anexos/evidências

### ✅ Campos já mapeados (91+ campos):
- **Básicos:** order_id, claim_id, status, data_criacao, comprador, produto
- **Financeiros:** valor_reembolso, taxa_ml, método_pagamento, parcelas, moeda
- **Rastreamento:** tracking_number, estimated_delivery, has_delay, quantities
- **Comunicação:** mensagens, timeline, qualidade_comunicacao, anexos
- **Mediação:** mediador_ml, resultado, detalhes, dias_restantes
- **Metadata:** power_seller, mercado_líder, CPF/CNPJ
- **Pack Data:** pack_id, items, cancel_detail

---

## 🆕 DADOS FALTANTES IMPORTANTES (Segundo Documentação ML)

### **FASE 1: DADOS TEMPORAIS CRÍTICOS** 🔥

#### 1. **Data da Venda Original** ⭐
- **Endpoint:** Já temos em `order_data.date_created`
- **Campo:** `data_venda_original`
- **Importância:** ALTA - usuário quer saber quando foi a venda que gerou a devolução
- **Status:** ✅ JÁ MAPEADO em BasicDataMapper.ts linha 24
- **Ação:** Verificar se está populando corretamente

#### 2. **Data de Fechamento da Devolução** ⭐
- **Endpoint:** `return_details.closed_at`
- **Campo:** `data_fechamento_devolucao`
- **Importância:** ALTA - quando a devolução foi concluída
- **Status:** ✅ JÁ MAPEADO em TrackingDataMapper.ts linha 20
- **Ação:** Verificar se está populando

#### 3. **Prazo Limite para Análise** ⭐⭐⭐
- **Endpoint:** `return_details.estimated_handling_limit.date`
- **Campo:** `prazo_limite_analise`
- **Importância:** CRÍTICA - usuário precisa saber até quando deve analisar
- **Status:** ✅ JÁ MAPEADO em TrackingDataMapper.ts linha 21
- **Ação:** Verificar se está populando

#### 4. **Dias Restantes para Análise** ⭐⭐⭐
- **Cálculo:** Diferença entre `prazo_limite_analise` e hoje
- **Campo:** `dias_restantes_analise`
- **Importância:** CRÍTICA - alerta visual de urgência
- **Status:** ✅ JÁ MAPEADO em TrackingDataMapper.ts linhas 48-56
- **Ação:** Verificar se está sendo calculado corretamente

#### 5. **Entidades Relacionadas** ⭐
- **Dados:** IDs de comprador, vendedor, mediador
- **Campo:** `entidades_relacionadas`
- **Importância:** ALTA - rastreabilidade completa
- **Status:** ✅ JÁ MAPEADO em BasicDataMapper.ts linhas 64-68
- **Ação:** Verificar estrutura

#### 6. **Data Estimada de Reembolso** ⭐⭐
- **Cálculo:** `refund_at` ou prazo_limite + 7 dias
- **Campo:** `data_estimada_reembolso`
- **Importância:** ALTA - expectativa do vendedor
- **Status:** ✅ JÁ MAPEADO em FinancialDataMapper.ts linhas 42-56
- **Ação:** Verificar se cálculo está correto

---

### **FASE 2: DADOS DE SHIPPING AVANÇADOS** 🚚

#### 7. **Shipment History Enriched** ⭐⭐
- **Service:** `ShipmentHistoryService.ts`
- **Endpoint:** `/shipments/{shipment_id}/history`
- **Dados:** 
  - Histórico completo de movimentações
  - Status intermediários (em trânsito, aguardando retirada, etc.)
  - Localização atual do produto
  - Data de cada checkpoint
- **Importância:** ALTA - usuário quer saber onde está o produto devolvido
- **Status:** ⚠️ IMPLEMENTADO mas pode não estar populando
- **Ação:** Criar campos dedicados:
  - `localizacao_atual_produto`
  - `status_transporte_atual`
  - `tempo_em_transito_dias`
  - `previsao_chegada_vendedor`

#### 8. **Shipping Costs Enriched** ⭐⭐
- **Service:** `ShippingCostsService.ts`
- **Endpoint:** `/shipments/{shipment_id}/costs`
- **Dados:**
  - Custo de envio original
  - Custo de devolução (quem paga: comprador/vendedor/ML)
  - Breakdown: frete + manuseio + seguro + taxas
  - Custo total de logística da devolução
- **Importância:** ALTA - impacto financeiro real
- **Status:** ✅ IMPLEMENTADO via CustosLogisticaCell
- **Ação:** Verificar se dados estão populando no tooltip

---

### **FASE 3: DADOS DE REASONS (Motivos)** 📋

#### 9. **Reason Details Enriched**
- **Endpoint:** `/claims/reasons/{reason_id}`
- **Dados já mapeados:**
  - `reason_detail` - detalhes do motivo
  - `reason_flow` - fluxo do processo
  - `tipo_problema` / `subtipo_problema`
  - `nivel_prioridade` - triage automático
- **Status:** ✅ JÁ MAPEADO em BasicDataMapper.ts
- **Ação:** Verificar se `dados_reasons` está sendo passado corretamente

---

### **FASE 4: DADOS DE CHANGE (Trocas)** 🔄

#### 10. **Change Details**
- **Endpoint:** `/post-purchase/v1/claims/{claim_id}/change_details`
- **Dados importantes:**
  - Novo produto da troca
  - Diferença de preço
  - Data estimada de chegada do novo produto
  - Novo order_id gerado pela troca
- **Status:** ✅ IMPLEMENTADO mas falta enriquecimento
- **Campos faltantes:**
  - `novo_produto_titulo`
  - `novo_produto_preco`
  - `data_estimada_troca_completa`
  - `status_novo_pedido`

---

## 📊 RESUMO DA AUDITORIA

### ✅ Dados já implementados mas podem não estar populando:
1. ✅ data_venda_original
2. ✅ data_fechamento_devolucao
3. ✅ prazo_limite_analise
4. ✅ dias_restantes_analise
5. ✅ entidades_relacionadas
6. ✅ data_estimada_reembolso
7. ⚠️ shipment_history_enriched (dados existem mas falta UI dedicada)
8. ✅ shipping_costs_enriched (via CustosLogisticaCell)
9. ✅ reason details
10. ⚠️ change_details (dados existem mas falta UI dedicada)

### 🆕 Dados completamente novos a implementar:

#### **ALTA PRIORIDADE:**
1. **Localização Atual Produto** (`localizacao_atual_produto`)
   - Extrair de `shipment_history_enriched.return_shipment.tracking_history[-1].location`
   
2. **Tempo em Trânsito** (`tempo_transito_dias`)
   - Calcular diferença entre primeira e última movimentação
   
3. **Previsão Chegada ao Vendedor** (`previsao_chegada_vendedor`)
   - De `return_details.estimated_delivery_date`

4. **Status Novo Pedido (Troca)** (`status_novo_pedido`)
   - Buscar `/orders/{novo_pedido_id}` quando `novo_pedido_id` existe

#### **MÉDIA PRIORIDADE:**
5. **Histórico Completo Status** (`historico_status_detalhado`)
   - Timeline consolidada de todas as mudanças de status
   
6. **Métricas de SLA** (campos já mapeados mas vazios):
   - `tempo_primeira_resposta_vendedor`
   - `tempo_resposta_comprador`
   - `tempo_analise_ml`
   - `sla_cumprido`

---

## 🎯 RECOMENDAÇÕES

### **IMPLEMENTAR AGORA (FASE 1):**
✅ Verificar se os 6 campos temporais críticos estão populando:
1. data_venda_original
2. data_fechamento_devolucao
3. prazo_limite_analise
4. dias_restantes_analise
5. entidades_relacionadas
6. data_estimada_reembolso

**Ação:** Adicionar colunas dedicadas na tabela para estes campos se ainda não estiverem visíveis.

### **IMPLEMENTAR DEPOIS (FASE 2):**
🚀 Enriquecer UI com dados de shipping:
1. Adicionar coluna "Localização Produto"
2. Adicionar badge "Em Trânsito há X dias"
3. Adicionar "Previsão Chegada"

### **FUTURO (FASE 3):**
📊 Métricas de performance:
1. Implementar cálculo real de SLA
2. Dashboard de métricas agregadas
3. Alertas automáticos de prazos vencendo
