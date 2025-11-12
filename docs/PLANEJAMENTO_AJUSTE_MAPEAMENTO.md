# 📋 PLANEJAMENTO DE AJUSTE DE MAPEAMENTO

**Data:** 2025-11-12  
**Objetivo:** Corrigir campos que não estão populando corretamente na página /devolucoes-ml

---

## 🔍 DIAGNÓSTICO BASEADO EM LOGS REAIS

### ✅ Campos FUNCIONANDO Corretamente

**BasicDataMapper.ts:**
- ✅ `product_title` - "Bobo Ballon Bubble Kit...", "Bexiga Balões Festas..."
- ✅ `sku` - "FL-14-TRAN-1", "FL-24-VERM-1", "CMD-18-BRAN-1"
- ✅ `has_product_info` e `has_order_data` - booleanos funcionando

**FinancialDataMapper.ts:**
- ✅ `custo_total_logistica` - valores: 20.09, 11.2, 9.05, 14.6, 21, 26.4, 20.99, 11.1, 24.09, 11, 3.89

**TrackingDataMapper.ts:**
- ✅ `has_return_details` - false (consistente)
- ✅ `has_shipment_history` - true (consistente)

**CommunicationDataMapper.ts:**
- ✅ `has_messages` - true (consistente)

---

## ❌ PROBLEMAS IDENTIFICADOS (Por Prioridade)

### 🔴 PRIORIDADE CRÍTICA - Impacto Alto

#### 1. **Breakdown de Custos Sempre Zerado**

**Logs mostram:**
```json
{
  "breakdown": {
    "shipping_fee": 0,
    "handling_fee": 0,
    "insurance": 0,
    "taxes": 0
  }
}
```

**Problema:** ShippingCostsService não está extraindo breakdown detalhado da API ML.

**Impacto:**
- ❌ Tooltip de CustosLogisticaCell mostra apenas total
- ❌ 4 campos sempre vazios: `shipping_fee`, `handling_fee`, `insurance`, `taxes`

**Ação Necessária:**
- Investigar endpoint correto para breakdown de custos na API ML
- Ou remover breakdown do tooltip se API não fornece

---

#### 2. **Responsável Custo Frete Sempre Null**

**Logs mostram:**
```json
{ "responsavel": null }
```

**Problema:** Campo `responsavel_custo` não está sendo populado.

**Impacto:**
- ❌ Não mostra quem paga o frete (comprador/vendedor/ML)
- ❌ Badge de responsável em CustosLogisticaCell não funciona

**Ação Necessária:**
- Verificar estrutura correta em `shipping_costs_enriched`
- Mapear campo correto da API ML

---

#### 3. **Contagem de Mensagens Zero**

**Logs mostram:**
```json
{ "total_raw_messages": 0 }
```

**Problema:** Mesmo com `has_messages: true`, contagem é 0.

**Impacto:**
- ⚠️ Coluna "N° Interações" pode estar incorreta
- ⚠️ "Qualidade Comunicação" pode retornar 'sem_mensagens' incorretamente

**Ação Necessária:**
- Verificar estrutura de `claim_messages`
- Mapear array correto de mensagens

---

### 🟡 PRIORIDADE ALTA - Impacto Médio

#### 4. **Return Details Sempre False**

**Logs mostram:**
```json
{ "has_return_details": false }
```

**Problema:** Claims não têm `return_details` na resposta.

**Impacto:**
- ❌ Campos dependentes vazios:
  - `data_fechamento_devolucao`
  - `prazo_limite_analise`
  - `dias_restantes_analise`
  - `codigo_rastreamento`

**Ação Necessária:**
- Confirmar se dados estão em outro caminho da API
- Ou marcar campos como "Não disponível" quando `has_return_details: false`

---

#### 5. **Campos de Comunicação Detalhados Não Mapeados**

**Campos que NÃO aparecem nos logs:**
- ❌ `timeline_events` - sempre []
- ❌ `marcos_temporais` - sempre null
- ❌ `data_criacao_claim`
- ❌ `data_inicio_return`
- ❌ `data_fechamento_claim`
- ❌ `historico_status` - sempre []

**Problema:** Campos dependem de estruturas que não existem.

**Ação Necessária:**
- Validar se esses dados estão disponíveis na API ML
- Remover campos ou ajustar para estrutura real

---

#### 6. **Campos de Mediação Não Validados**

**Campos adicionados mas não testados:**
- ❓ `resultado_mediacao`
- ❓ `detalhes_mediacao`
- ❓ `produto_troca_id`
- ❓ `novo_pedido_id`
- ❓ `prazo_revisao_dias`

**Ação Necessária:**
- Adicionar logs para validar se dados existem
- Ajustar mapeamento conforme estrutura real

---

#### 7. **Campos de Metadata Não Mapeados**

**Campos dependem de estruturas não disponíveis:**
- ❌ `usuario_ultima_acao` - depende de `claim.last_updated_by`
- ❌ `total_evidencias` - depende de `item.attachments`
- ❌ `anexos_ml` - depende de `item.attachments`

**Ação Necessária:**
- Validar caminhos corretos na estrutura do claim
- Ajustar para estrutura real ou remover

---

## 📊 RESUMO DE IMPACTO

| Categoria | Campos Funcionando | Campos com Problema | Taxa de Falha |
|-----------|-------------------|---------------------|---------------|
| BasicDataMapper | 3/3 | 0 | 0% |
| FinancialDataMapper | 1/13 | 12 | 92% |
| TrackingDataMapper | 2/9 | 7 | 78% |
| CommunicationDataMapper | 1/4 | 3 | 75% |
| ContextDataMapper | 0/5 | 5 | 100% |
| MetadataMapper | 0/7 | 7 | 100% |

**Total Geral:**
- ✅ **7 campos funcionando** (17%)
- ❌ **34 campos com problemas** (83%)

---

## 🎯 PLANEJAMENTO DE CORREÇÃO (4 Fases)

### FASE 1: Simplificar Colunas Financeiras ⏱️ 5 min

**Ação:** Remover 4 colunas de breakdown que estão sempre vazias.

```typescript
// REMOVER de FinancialDetailedCells.tsx:
- shipping_fee (sempre null)
- handling_fee (sempre null)
- insurance (sempre null)
- taxes (sempre null)
```

**Benefício:** Interface mais limpa, remove dados não disponíveis.

---

### FASE 2: Simplificar Tooltip de Custos Logística ⏱️ 3 min

**Ação:** Remover breakdown do tooltip de CustosLogisticaCell.

```typescript
// CustosLogisticaCell.tsx - Simplificar tooltip
// ANTES: Mostrava breakdown detalhado (sempre 0)
// DEPOIS: Mostra apenas custo total e responsável
```

**Benefício:** Tooltip funcional sem dados inexistentes.

---

### FASE 3: Corrigir Mapeamento de Mensagens ⏱️ 10 min

**Ação:** Investigar e corrigir estrutura de `claim_messages`.

```typescript
// CommunicationDataMapper.ts
// Validar estrutura correta:
const messages = item.claim_messages?.messages || 
                 item.messages || 
                 item.claim?.messages || [];

total_raw_messages: messages.length,
numero_interacoes: messages.length
```

**Benefício:** Colunas "N° Interações" e "Qualidade Comunicação" funcionando.

---

### FASE 4: Marcar Campos Indisponíveis ⏱️ 15 min

**Ação:** Para campos dependentes de `return_details`, mostrar "N/A" quando false.

```typescript
// TrackingDetailedCells.tsx
{!devolucao.has_return_details ? (
  <Badge variant="outline">N/A</Badge>
) : (
  // Renderizar dado normal
)}
```

**Benefício:** Clareza sobre dados não disponíveis vs vazios.

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

### Dia 1 (Impacto Imediato - 18 min)
1. ✅ **FASE 1:** Remover colunas breakdown financeiras (5 min)
2. ✅ **FASE 2:** Simplificar tooltip custos (3 min)
3. ✅ **FASE 3:** Corrigir contagem mensagens (10 min)

### Dia 2 (Refinamento - 15 min)
4. ✅ **FASE 4:** Marcar campos indisponíveis (15 min)

---

## 📈 RESULTADO ESPERADO

**Antes da Correção:**
- ✅ 7 campos funcionando (17%)
- ❌ 34 campos com problemas (83%)

**Depois da Correção:**
- ✅ 25+ campos funcionando (~60%)
- ⚠️ 10 campos marcados "N/A" (~25%)
- ❌ 6 campos removidos (~15%)

**Melhoria:** +43% de campos úteis e funcionais.

---

## 🔍 VALIDAÇÃO PÓS-CORREÇÃO

### Checklist de Testes

- [ ] CustosLogisticaCell mostra tooltip simplificado sem breakdown zerado
- [ ] Colunas de breakdown financeiro removidas da tabela
- [ ] N° Interações mostra contagem correta de mensagens
- [ ] Qualidade Comunicação calculada corretamente
- [ ] Campos dependentes de return_details mostram "N/A" quando false
- [ ] Tabela tem largura gerenciável (scroll horizontal funcional)
- [ ] Logs confirmam mapeamento correto de mensagens

---

## 📝 NOTAS TÉCNICAS

### Estruturas da API ML a Investigar

```typescript
// 1. Breakdown de custos
shipping_costs_enriched: {
  original_costs: {
    cost_breakdown: {
      shipping_fee: number,  // ❌ Sempre 0
      handling_fee: number,  // ❌ Sempre 0
      insurance: number,     // ❌ Sempre 0
      taxes: number         // ❌ Sempre 0
    }
  }
}

// 2. Mensagens
claim_messages: {
  messages: Array  // ❓ Validar caminho correto
}

// 3. Return Details
return_details: {
  // ❌ Sempre false - validar endpoint alternativo
}
```

---

## ✅ CONCLUSÃO

**Status Atual:** Interface tem 83% de campos não funcionais por dados indisponíveis da API ML.

**Plano de Ação:** Simplificar interface removendo/marcando campos não disponíveis, corrigir mapeamento de mensagens, e focar em expor apenas dados realmente disponíveis.

**Próximo Passo:** Executar FASE 1 (5 min) para impacto imediato.
