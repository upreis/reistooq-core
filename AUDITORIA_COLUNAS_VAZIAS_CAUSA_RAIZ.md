# 🔍 AUDITORIA: COLUNAS VAZIAS - CAUSA RAIZ IDENTIFICADA

## 📋 DATA: 2025-11-11
## ⚠️ PRIORIDADE: CRÍTICA

---

## 🎯 PROBLEMA IDENTIFICADO

**CAUSA RAIZ**: A migração de `sync-devolucoes` para o padrão `unified-orders` quebrou a arquitetura de fluxo de dados porque:

### 1. **ml-api-direct retorna campos com NOMES ANTIGOS** (claim_details, order_data)
   - Linha 2650 em `ml-api-direct/index.ts`:
     ```typescript
     return {
       data: ordersCancelados, // Array de objetos com nomes ANTIGOS
       total: totalAvailable,
       hasMore: ...
     }
     ```

### 2. **sync-devolucoes TRANSFORMA os nomes** (claim_details → dados_claim, order_data → dados_order)
   - Linhas 201-224 em `sync-devolucoes/index.ts`:
     ```typescript
     const transformed: any = {
       ...claim,
       dados_claim: claim.claim_details || null,  // ✅ TRANSFORMA
       dados_order: claim.order_data || null,     // ✅ TRANSFORMA
     };
     delete transformed.claim_details;
     delete transformed.order_data;
     ```

### 3. **MAS TODOS OS OUTROS CAMPOS SÃO SALVOS COM NOMES ERRADOS**
   - `item_id`, `variation_id`, `status`, `status_money`, `subtipo`, `resource_type`, etc.
   - NÃO EXISTEM na tabela `devolucoes_avancadas`!
   - Query SQL falhou: `column "item_id" does not exist`

---

## 📊 DADOS REAIS NO BANCO (Query de Teste)

```sql
SELECT claim_id, order_id, status_devolucao, quantidade, 
       dados_claim, dados_order
FROM devolucoes_avancadas LIMIT 2
```

**RESULTADO:**
```
claim_id: 5428420740
dados_claim: <nil>    ❌ VAZIO
dados_order: <nil>    ❌ VAZIO
```

**POR QUÊ?** Porque `ml-api-direct` retorna objetos com campos `claim_details` e `order_data`, mas eles NÃO SÃO arrays - são OBJETOS ÚNICOS por claim.

Exemplo do que `ml-api-direct` retorna:
```typescript
{
  claim_id: "123",
  order_id: "456",
  claim_details: { ... dados do claim ... },  // OBJETO
  order_data: { ... dados do order ... },     // OBJETO
  item_id: "789",
  variation_id: "ABC",
  // ... 200+ campos adicionais
}
```

---

## 🔥 INCONSISTÊNCIAS CRÍTICAS

### ❌ **PROBLEMA 1: Campos não mapeados**
`ml-api-direct` retorna 200+ campos que `sync-devolucoes` salva diretamente no banco, mas a tabela `devolucoes_avancadas` NÃO TEM essas colunas:

| Campo retornado por ml-api-direct | Existe na tabela? | Status |
|-----------------------------------|-------------------|--------|
| `item_id` | ❌ NÃO | Erro |
| `variation_id` | ❌ NÃO | Erro |
| `status` | ❌ NÃO | Erro (coluna get-devolucoes tenta usar `.status`) |
| `status_money` | ❌ NÃO | Erro |
| `subtipo` | ❌ NÃO | Erro |
| `resource_type` | ❌ NÃO | Erro |
| `context` | ❌ NÃO | Erro |
| `quantidade_total` | ❌ NÃO | Erro |
| `claim_quantity_type` | ❌ NÃO | Erro |
| `... 180+ outros campos` | ❌ NÃO | Erro |

### ❌ **PROBLEMA 2: dados_claim e dados_order salvos como NULL**
- `sync-devolucoes` mapeia: `dados_claim: claim.claim_details || null`
- MAS `claim.claim_details` é NULL porque `ml-api-direct` já processou e extraiu tudo
- O objeto ORIGINAL da API ML foi transformado em 200+ campos planos

### ❌ **PROBLEMA 3: get-devolucoes tenta ler campos que não existem**
Linha 214-215 em `get-devolucoes/index.ts`:
```typescript
item_id: item.dados_order?.order_items?.[0]?.item?.id || item.item_id || null,
variation_id: item.dados_order?.order_items?.[0]?.item?.variation_id || item.variation_id || null,
```

**FALHA DUPLA:**
1. `item.dados_order` é NULL (porque `claim.order_data` era NULL)
2. `item.item_id` não existe (coluna não criada na tabela)

---

## 🗂️ ESTRUTURA REAL DA TABELA `devolucoes_avancadas`

Colunas existentes (88 total):
```
✅ claim_id, order_id, integration_account_id
✅ status_devolucao, subtipo_claim, quantidade
✅ data_criacao_claim, data_fechamento_claim
✅ dados_claim, dados_order (JSONB mas salvos como NULL)
✅ dados_tracking_info, dados_financial_info (JSONB)
✅ product_condition, product_destination (strings)
✅ review_status, review_method, review_stage
✅ ... + 70 outras colunas

❌ item_id (NÃO EXISTE)
❌ variation_id (NÃO EXISTE)
❌ status (NÃO EXISTE)
❌ status_money (NÃO EXISTE)
❌ ... + 180 campos de ml-api-direct (NÃO EXISTEM)
```

---

## 🎯 PLANO DE CORREÇÃO (3 FASES)

### **FASE 1: DECISÃO ARQUITETURAL**
Escolher entre:

#### **OPÇÃO A: Salvar TUDO em JSONB** (RECOMENDADO)
- Modificar `sync-devolucoes` para salvar TODO o objeto retornado por `ml-api-direct` em campos JSONB
- Estrutura:
  ```typescript
  {
    claim_id: "123",
    order_id: "456",
    integration_account_id: "...",
    dados_claim: { /* TODO objeto claim_details */ },
    dados_order: { /* TODO objeto order_data */ },
    dados_item: { item_id, variation_id, ... },
    dados_status: { status, status_money, subtipo, ... },
    dados_tracking: { shipment_id, tracking_number, ... },
    dados_financial: { total_amount, currency, ... },
    // ... outros grupos JSONB
  }
  ```

#### **OPÇÃO B: Criar colunas para campos críticos** (TRABALHOSO)
- Adicionar 200+ colunas na tabela `devolucoes_avancadas`
- Migration complexa
- Dificulta manutenção futura

### **FASE 2: IMPLEMENTAÇÃO**

#### Se escolher OPÇÃO A (JSONB):
1. **Modificar sync-devolucoes** (linhas 201-224):
   ```typescript
   const transformed: any = {
     claim_id: claim.claim_id,
     order_id: claim.order_id,
     integration_account_id: integrationAccountId,
     
     // SALVAR GRUPOS EM JSONB
     dados_claim: claim.claim_details || {},
     dados_order: claim.order_data || {},
     dados_item: {
       item_id: claim.item_id,
       variation_id: claim.variation_id,
       seller_sku: claim.seller_sku,
     },
     dados_status: {
       status: claim.status,
       status_money: claim.status_money,
       subtipo: claim.subtipo,
       resource_type: claim.resource_type,
     },
     dados_tracking: {
       shipment_id: claim.shipment_id,
       tracking_number: claim.tracking_number,
       shipment_status: claim.shipment_status,
       // ...
     },
     // ... outros grupos
   };
   ```

2. **Corrigir get-devolucoes** para ler dos JSONBs corretos

3. **Verificar se colunas JSONB existem no schema**, se não, criar migration

#### Se escolher OPÇÃO B (Colunas):
1. Criar migration massiva com 200+ colunas
2. Mapear CADA campo individualmente em `sync-devolucoes`

### **FASE 3: VALIDAÇÃO**
1. Testar sincronização completa
2. Verificar se colunas aparecem no frontend
3. Auditoria final de campos vazios

---

## 🚨 DECISÃO REQUERIDA DO USUÁRIO

**QUAL OPÇÃO ESCOLHER?**

### ✅ **OPÇÃO A (RECOMENDADO)**: Salvar em JSONB agrupado
- ⚡ Rápido de implementar
- 🔧 Fácil manutenção
- 📦 Flexível para novos campos da API ML
- ✅ Arquitetura escalável

### ⚠️ **OPÇÃO B**: Criar 200+ colunas
- ⏳ Muito trabalhoso
- 🐌 Migration complexa
- 🔒 Inflexível (cada novo campo = nova migration)
- ❌ Dificulta manutenção

---

## 📝 COLUNAS AFETADAS (Lista do Usuário)

### Grupo 1: Identificadores (IDs)
- ❌ **Item ID** - campo `item_id` não existe, deve extrair de JSONB
- ❌ **Variação ID** - campo `variation_id` não existe
- ❌ **Context** - campo `context` não existe

### Grupo 2: Status
- ❌ **Status** - campo `status` não existe (get-devolucoes tenta usar `.status`)
- ❌ **Status $** - campo `status_money` não existe
- ❌ **Subtipo** - existe `subtipo_claim` mas pode estar NULL
- ❌ **Tipo Recurso** - campo `resource_type` não existe

### Grupo 3: Quantidade
- ❌ **Qtd Total** - campo `quantidade_total` não existe
- ❌ **Qtd Devolver** - campo `return_quantity` não existe
- ✅ **📦 Qtd** - campo `quantidade` existe e está OK

### Grupo 4: Envio/Rastreio
- ⚠️ **Shipment ID** - existe `shipment_id` mas pode estar NULL
- ⚠️ **Status Envio** - campos de rastreamento podem estar NULL
- ⚠️ **Tipo Envio** - campos logísticos podem estar NULL
- ⚠️ **Destino** - campos de endereço podem estar NULL
- ⚠️ **Rastreio** - código pode estar NULL

### Grupo 5: Datas e Prazos
- ⚠️ **📅 Previsão Entrega** - depende de JSONB dados_lead_time
- ⚠️ **⏰ Prazo Limite** - depende de JSONB
- ⚠️ **🚚 Status Envio** - (DUPLICADO com "Status Envio" acima)
- ⚠️ **Data Estimada** - depende de JSONB

### Grupo 6: Financeiro
- ⚠️ **💰 Reembolso** - campos de reembolso podem estar NULL
- ⚠️ **Reembolso Após** - depende de dados financeiros

### Grupo 7: Revisão
- ⚠️ **🔍 Revisão** - coluna genérica DUPLICADA, deve ser removida
- ⚠️ **Status Review** - existe `review_status`, pode estar NULL
- ⚠️ **Condição Produto** - existe `product_condition`, pode estar NULL
- ⚠️ **Destino Produto** - existe `product_destination`, pode estar NULL
- ⚠️ **Beneficiado** - existe `responsavel_custo`, pode estar NULL
- ⚠️ **Reviews** - não identificado

### Grupo 8: Endereço
- ⚠️ **Endereço, Cidade, Estado, CEP, Bairro, País, Complemento** - existem em JSONB `endereco_destino`

### Grupo 9: Outros
- ⚠️ **Motivo** - existe `motivo_devolucao`, pode estar NULL
- ⚠️ **Prazo** - depende de deadlines
- ⚠️ **Atraso?** - campo calculado `has_delay`
- ⚠️ **Criação** - existe `data_criacao_claim`
- ⚠️ **Atualização** - existe `updated_at`
- ⚠️ **Fechamento** - existe `data_fechamento_claim`
- ⚠️ **⏰ Prazos** - depende de JSONB dados_deadlines
- ⚠️ **📍 Substatus** - existe `descricao_ultimo_status`
- ⚠️ **💰 Custos Logística** - depende de JSONB shipment_costs
- ⚠️ **📦 Fulfillment** - depende de JSONB dados_fulfillment
- ⚠️ **🎬 Ações Disponíveis** - depende de JSONB dados_available_actions

### Colunas DUPLICADAS a REMOVER:
- ❌ **🔍 Revisão** (muito genérica, já existe ReviewInfoCell)
- ❌ **💬 Comunicação** (muito genérica, já existe CommunicationInfoCell)
- ❌ **🚚 Status Envio** (duplicado com "Status Envio")

---

## ✅ RECOMENDAÇÃO FINAL

**Implementar OPÇÃO A (JSONB agrupado)** porque:
1. Resolve TODOS os campos vazios
2. Implementação rápida (1-2 horas)
3. Arquitetura escalável e manutenível
4. Alinhado com padrão atual (`dados_claim`, `dados_order`)

**Aguardando decisão do usuário para prosseguir.**
