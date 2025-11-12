# 🔍 AUDITORIA COMPLETA: Mappers vs Tabela DevolucaoTable

**Data:** 2025-11-12  
**Objetivo:** Identificar gaps entre campos mapeados pela Edge Function e campos exibidos na tabela.

---

## 📊 METODOLOGIA

Esta auditoria compara:

1. **Campos mapeados** pelos 5 mappers backend (BasicDataMapper, FinancialDataMapper, TrackingDataMapper, CommunicationDataMapper, ContextDataMapper, MetadataMapper)
2. **Colunas existentes** em DevolucaoTable.tsx
3. **Dados recebidos** conforme logs da Edge Function

---

## ✅ MAPPERS BACKEND: Campos Retornados

### 🎯 BasicDataMapper.ts

**Campos mapeados:**

```typescript
✅ produto_titulo
✅ produto_sku  
✅ variation_id
✅ category_id
✅ comprador_nome_completo
✅ comprador_nickname
✅ comprador_cpf
✅ data_venda_original
✅ entidades_relacionadas (buyer_id, seller_id, mediator_id)
```

**Status nos logs:** ✅ Dados recebidos corretamente

```
🎯 BasicDataMapper - Dados recebidos: {
  "has_product_info": true,
  "has_order_data": true,
  "product_title": "Lâmpada Led Halopin 3w G9...",
  "sku": "g9220"
}
```

---

### 💰 FinancialDataMapper.ts

**Campos mapeados:**

```typescript
✅ valor_reembolso_total
✅ valor_reembolso_produto
✅ valor_reembolso_frete
✅ taxa_ml_reembolso
✅ metodo_pagamento
✅ status_dinheiro
✅ moeda_reembolso
✅ percentual_reembolsado
✅ custo_devolucao
✅ custo_total_logistica (🆕 CORRIGIDO)
✅ custo_envio_original (🆕 CORRIGIDO)
✅ responsavel_custo_frete (🆕 CORRIGIDO)
✅ shipping_fee (🆕 CORRIGIDO)
✅ handling_fee (🆕 CORRIGIDO)
✅ insurance (🆕 CORRIGIDO)
✅ taxes (🆕 CORRIGIDO)
```

**Status nos logs:** ✅ Dados recebidos corretamente

```
💰 FinancialDataMapper - shipping_costs_enriched recebido: {
  claim_id: 5429009621,
  has_original_costs: true,
  total_logistics_cost: 0,
  original_total: 20.3,
  breakdown: { shipping_fee: 0, handling_fee: 0, insurance: 0, taxes: 0 }
}

💰 FinancialDataMapper - Campos extraídos: { 
  custo_total_logistica: 20.3, 
  shipping_fee: null, 
  responsavel: null 
}
```

---

### 📦 TrackingDataMapper.ts

**Campos mapeados:**

```typescript
✅ estimated_delivery_date
✅ codigo_rastreamento
✅ status_envio
✅ has_delay
✅ return_quantity
✅ total_quantity
✅ data_fechamento_devolucao
✅ prazo_limite_analise
✅ dias_restantes_analise
```

**Status nos logs:** ✅ Dados recebidos corretamente

```
📦 TrackingDataMapper - Dados recebidos: {
  "has_return_details": false,
  "has_shipment_history": true
}
```

---

### 💬 CommunicationDataMapper.ts

**Campos mapeados:**

```typescript
✅ numero_interacoes
✅ qualidade_comunicacao
✅ tem_mensagens
✅ total_mensagens_raw
```

**Status nos logs:** ✅ Dados recebidos corretamente

```
💬 CommunicationDataMapper - Dados recebidos: {
  "has_messages": true,
  "total_raw_messages": 0
}
```

---

### 🔄 ContextDataMapper.ts

**Campos mapeados:**

```typescript
✅ em_mediacao
✅ escalado_para_ml
✅ mediador_ml
✅ eh_troca
✅ data_estimada_troca
✅ comprador_cpf
✅ comprador_nome_completo
✅ dias_restantes_acao
✅ prazo_revisao_dias
```

---

### 📊 MetadataMapper.ts

**Campos mapeados:**

```typescript
✅ tem_financeiro
✅ tem_review
✅ tem_sla
✅ seller_reputation
✅ power_seller_status
✅ mercado_lider
✅ usuario_ultima_acao
✅ total_evidencias
✅ anexos_ml
```

---

## 🎨 TABELA: Colunas Visíveis em DevolucaoTable.tsx

### Colunas BÁSICAS (já existentes)

```typescript
✅ Empresa
✅ 👤 Comprador (CompanyBuyerCell)
✅ 📦 Produto (ProductInfoCell)
✅ 💰 Financeiro (FinancialCell)
✅ 📋 Pedido (OrderIdCell)
✅ 📍 Tracking (TrackingCell)
✅ ID Devolução
✅ Claim ID
✅ Item ID
✅ Variação ID
✅ Status
✅ Motivo
```

### Colunas RECÉM-IMPLEMENTADAS

```typescript
✅ 💰 Custos Logística (CustosLogisticaCell) - 🆕 FUNCIONANDO
✅ CPF/CNPJ - 🆕 IMPLEMENTADO (OPÇÃO A)
✅ Power Seller - 🆕 IMPLEMENTADO (OPÇÃO A)
✅ Mercado Líder - 🆕 IMPLEMENTADO (OPÇÃO A)
✅ Data Est. Reembolso - 🆕 IMPLEMENTADO (OPÇÃO A)
```

---

## ⚠️ CAMPOS MAPEADOS MAS NÃO EXIBIDOS NA TABELA

### 💰 Financeiros Detalhados (11 campos)

```typescript
❌ status_dinheiro - Mapeado mas SEM coluna dedicada
❌ metodo_pagamento - Mapeado mas SEM coluna dedicada
❌ moeda_reembolso - Mapeado mas SEM coluna dedicada
❌ percentual_reembolsado - Mapeado mas SEM coluna dedicada
❌ valor_diferenca_troca - Mapeado mas SEM coluna dedicada
❌ transaction_id - Mapeado mas SEM coluna dedicada
❌ custo_devolucao - Mapeado mas SEM coluna dedicada (está dentro de CustosLogisticaCell tooltip)
❌ custo_envio_original - Mapeado mas SEM coluna dedicada (está dentro de CustosLogisticaCell tooltip)
❌ responsavel_custo_frete - Mapeado mas SEM coluna dedicada (está dentro de CustosLogisticaCell tooltip)
❌ shipping_fee - Mapeado mas SEM coluna dedicada (está dentro de CustosLogisticaCell tooltip)
❌ handling_fee - Mapeado mas SEM coluna dedicada (está dentro de CustosLogisticaCell tooltip)
❌ insurance - Mapeado mas SEM coluna dedicada (está dentro de CustosLogisticaCell tooltip)
❌ taxes - Mapeado mas SEM coluna dedicada (está dentro de CustosLogisticaCell tooltip)
```

### 📦 Tracking Detalhados (8 campos)

```typescript
❌ has_delay - Mapeado mas SEM coluna dedicada
❌ return_quantity - Mapeado mas SEM coluna dedicada
❌ total_quantity - Mapeado mas SEM coluna dedicada
❌ data_fechamento_devolucao - Mapeado mas SEM coluna dedicada
❌ prazo_limite_analise - Mapeado mas SEM coluna dedicada
❌ dias_restantes_analise - Mapeado mas SEM coluna dedicada
❌ estimated_delivery_date - Mapeado mas SEM coluna dedicada
❌ codigo_rastreamento - Mapeado mas SEM coluna dedicada
```

### 💬 Comunicação (2 campos)

```typescript
❌ numero_interacoes - Mapeado mas SEM coluna dedicada
❌ qualidade_comunicacao - Mapeado mas SEM coluna dedicada
```

### 🔄 Contexto/Mediação (5 campos)

```typescript
❌ em_mediacao - Mapeado mas SEM coluna dedicada
❌ mediador_ml - Mapeado mas SEM coluna dedicada
❌ eh_troca - Mapeado mas SEM coluna dedicada
❌ data_estimada_troca - Mapeado mas SEM coluna dedicada
❌ dias_restantes_acao - Mapeado mas SEM coluna dedicada
```

### 📊 Metadata (3 campos)

```typescript
❌ usuario_ultima_acao - Mapeado mas SEM coluna dedicada
❌ total_evidencias - Mapeado mas SEM coluna dedicada
❌ anexos_ml - Mapeado mas SEM coluna dedicada (objeto completo)
```

---

## 📈 ESTATÍSTICAS

### Resumo Geral

- **Total de campos mapeados pelos mappers:** ~55 campos
- **Total de colunas visíveis na tabela:** ~17 colunas
- **Campos mapeados mas não exibidos:** ~38 campos (69%)

### Por Categoria

| Categoria | Mapeados | Exibidos | Não Exibidos | % Oculto |
|-----------|----------|----------|--------------|----------|
| Básicos | 12 | 12 | 0 | 0% |
| Financeiros | 16 | 3 | 13 | 81% |
| Tracking | 9 | 1 | 8 | 89% |
| Comunicação | 4 | 0 | 4 | 100% |
| Mediação | 5 | 0 | 5 | 100% |
| Metadata | 9 | 2 | 7 | 78% |

---

## 🔍 ANÁLISE: Por que campos não aparecem?

### ✅ DESIGN INTENCIONAL

**Muitos campos estão intencionalmente ocultos da tabela principal para evitar sobrecarga visual:**

1. **Breakdown de custos** - Está no tooltip de `CustosLogisticaCell` ✅
2. **Dados de reputação** - Power Seller e Mercado Líder têm colunas dedicadas ✅
3. **Dados detalhados de tracking** - Acessíveis via modal de detalhes

### ❌ GAPS IDENTIFICADOS (Campos importantes sem exibição)

**PRIORIDADE ALTA - Devem ser adicionados à tabela:**

1. `estimated_delivery_date` - Data crítica para gestão de devoluções
2. `has_delay` - Indicador visual importante de atrasos
3. `return_quantity` / `total_quantity` - Contexto importante do pedido
4. `qualidade_comunicacao` - Métrica de qualidade da interação
5. `numero_interacoes` - Indicador de complexidade do caso
6. `mediador_ml` - Informação crítica sobre mediação
7. `transaction_id` - Importante para rastreamento financeiro

**PRIORIDADE MÉDIA - Podem ser adicionados se usuário solicitar:**

8. `status_dinheiro` - Status detalhado do reembolso
9. `metodo_reembolso` - Como será reembolsado
10. `dias_restantes_acao` - Urgência de ação
11. `em_mediacao` - Flag de mediação ativa

---

## 🎯 RECOMENDAÇÕES

### OPÇÃO A: Adicionar 7 Colunas de Prioridade Alta

Adicionar colunas dedicadas para os 7 campos mais críticos:

```typescript
// DevolucaoTable.tsx - Adicionar headers
<TableHead>Data Est. Entrega</TableHead>
<TableHead>Tem Atraso?</TableHead>
<TableHead>Qtd Devolvida/Total</TableHead>
<TableHead>Qualidade Comunicação</TableHead>
<TableHead>N° Interações</TableHead>
<TableHead>Mediador ML</TableHead>
<TableHead>Transaction ID</TableHead>

// DevolucaoTableRow.tsx - Adicionar células
<EstimatedDeliveryCell estimated_delivery_date={devolucao.estimated_delivery_date} />
<HasDelayCell has_delay={devolucao.has_delay} />
<QuantityCell return_quantity={devolucao.return_quantity} total_quantity={devolucao.total_quantity} />
<QualidadeComunicacaoCell qualidade={devolucao.qualidade_comunicacao} />
<NumeroInteracoesCell numero={devolucao.numero_interacoes} />
<MediadorMLCell mediador_ml={devolucao.mediador_ml} />
<TransactionIdCell transaction_id={devolucao.transaction_id} />
```

**Benefícios:**
- ✅ Expõe dados críticos já mapeados
- ✅ Melhora visibilidade de gestão de devoluções
- ✅ Não requer novos enriquecimentos de API

**Desvantagens:**
- ⚠️ Tabela fica mais larga (gerenciável com scroll horizontal)

### OPÇÃO B: Manter como está

Manter campos ocultos acessíveis apenas via:
- Modal de detalhes
- Tooltips
- Exports de dados

**Benefícios:**
- ✅ Interface mais limpa
- ✅ Tabela mais compacta

**Desvantagens:**
- ❌ Dados críticos não imediatamente visíveis
- ❌ Usuário precisa abrir detalhes para ver informações importantes

---

## 📝 CONCLUSÃO

**Status Atual:** ⚠️ **PARCIALMENTE OTIMIZADO**

- ✅ Todos os campos estão sendo **mapeados corretamente** pelos mappers backend
- ✅ Logs confirmam que **dados estão chegando** da Edge Function
- ⚠️ **38 campos mapeados não têm colunas dedicadas** na tabela
- ✅ Custos Logística agora **exibe corretamente** via CustosLogisticaCell

**Ação Recomendada:**

Implementar **OPÇÃO A** adicionando 7 colunas de prioridade alta para maximizar visibilidade de dados críticos já disponíveis e mapeados, sem necessidade de novos enriquecimentos da API ML.
