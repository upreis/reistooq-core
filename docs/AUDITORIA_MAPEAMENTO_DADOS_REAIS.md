# 🔍 AUDITORIA: Mapeamento vs Dados Reais dos Logs

**Data:** 2025-11-12  
**Fonte:** Logs da Edge Function `get-devolucoes-direct`

---

## 📊 ANÁLISE DOS LOGS

### ✅ Dados que ESTÃO sendo mapeados corretamente:

#### 🎯 BasicDataMapper
- ✅ `product_title` - "Bobo Ballon Bubble Kit...", "Bexiga Balões Festas...", etc.
- ✅ `sku` - "FL-14-TRAN-1", "FL-24-VERM-1", "CMD-18-BRAN-1", etc.
- ✅ `has_product_info` e `has_order_data` - booleanos funcionando

#### 💰 FinancialDataMapper  
- ✅ `custo_total_logistica` - valores: 20.09, 11.2, 9.05, 14.6, 21, 26.4, 20.99, 11.1, 24.09, 11, 3.89
- ⚠️ `shipping_fee` - sempre null (breakdown está zerado)
- ⚠️ `responsavel` - sempre null

#### 📦 TrackingDataMapper
- ✅ `has_return_details` - false na maioria dos casos
- ✅ `has_shipment_history` - true em vários casos

#### 💬 CommunicationDataMapper
- ✅ `has_messages` - true
- ⚠️ `total_raw_messages` - sempre 0 (mensagens podem estar em estrutura diferente)

---

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **Custos Logística - Breakdown Zerado**

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

**Problema:** O breakdown detalhado sempre retorna 0, mas `original_total` tem valores corretos.

**Causa:** A API ML não está retornando breakdown detalhado de custos ou o ShippingCostsService não está extraindo corretamente.

**Impacto:** 
- ❌ Coluna "Shipping Fee" sempre vazia
- ❌ Coluna "Handling Fee" sempre vazia  
- ❌ Coluna "Insurance" sempre vazia
- ❌ Coluna "Taxes" sempre vazia
- ⚠️ Tooltip de "Custos Logística" mostra apenas total, sem detalhamento

### 2. **Responsável Custo Frete - Sempre Null**

**Logs mostram:**
```json
{ "responsavel": null }
```

**Problema:** Campo `responsavel_custo` não está sendo populado pelo ShippingCostsService.

**Impacto:**
- ❌ Coluna "Responsável Frete" sempre vazia
- ❌ Badge não mostra se custo é do comprador/vendedor/ML

### 3. **Mensagens - Contagem Zero**

**Logs mostram:**
```json
{ "total_raw_messages": 0 }
```

**Problema:** Mesmo com `has_messages: true`, a contagem é 0.

**Causa Provável:** Mensagens podem estar em outra estrutura ou não sendo passadas corretamente para o mapper.

**Impacto:**
- ⚠️ Coluna "N° Interações" pode estar com 0 mesmo tendo mensagens
- ⚠️ Coluna "Qualidade Comunicação" pode retornar 'sem_mensagens' incorretamente

### 4. **Return Details - Sempre False**

**Logs mostram:**
```json
{ "has_return_details": false }
```

**Problema:** A maioria dos claims não tem `return_details`, impedindo acesso a dados de tracking críticos.

**Impacto:**
- ❌ Coluna "Data Fechamento" vazia
- ❌ Coluna "Prazo Limite" vazia
- ❌ Coluna "Dias Restantes" vazia
- ❌ Coluna "Código Rastreamento" vazia

### 5. **Campos de Comunicação Detalhados - Não Mapeados**

Os seguintes campos adicionados recentemente **NÃO aparecem nos logs**, indicando que não estão sendo extraídos:

- ❌ `timeline_events` - sempre []
- ❌ `marcos_temporais` - sempre null
- ❌ `data_criacao_claim` - não logado
- ❌ `data_inicio_return` - não logado
- ❌ `data_fechamento_claim` - não logado
- ❌ `historico_status` - sempre []

**Causa:** Estes campos dependem de `item.timeline_events`, `item.marcos_temporais`, etc. que não existem na estrutura atual.

### 6. **Campos de Mediação Detalhados - Não Mapeados**

Campos adicionados mas não testados/logados:

- ❓ `resultado_mediacao`
- ❓ `detalhes_mediacao`  
- ❓ `produto_troca_id`
- ❓ `novo_pedido_id`
- ❓ `prazo_revisao_dias`

### 7. **Campos de Metadata - Não Mapeados**

Campos adicionados mas dependem de estruturas não disponíveis:

- ❌ `usuario_ultima_acao` - depende de `claim.last_updated_by`
- ❌ `total_evidencias` - depende de `item.attachments`
- ❌ `anexos_ml` - depende de `item.attachments`

---

## 🎯 RECOMENDAÇÕES DE CORREÇÃO

### PRIORIDADE ALTA - Corrigir Imediatamente

#### 1. Simplificar Colunas Financeiras Detalhadas

**Problema:** 12 colunas financeiras mas 4 sempre vazias (shipping_fee, handling_fee, insurance, taxes)

**Solução:** Remover estas 4 colunas da tabela principal já que breakdown está sempre zerado:

```typescript
// REMOVER da tabela:
- Shipping Fee (sempre null)
- Handling Fee (sempre null)  
- Insurance (sempre null)
- Taxes (sempre null)
```

**Manter:** Status $, Método Pagamento, Moeda, % Reembolsado, Diferença Troca, Custo Devolução, Custo Envio Original, Responsável Frete (mesmo que null por ora)

#### 2. Simplificar Colunas de Tracking Detalhadas

**Problema:** 4 colunas de tracking mas dados dependem de return_details que está sempre false

**Solução:** Ocultar temporariamente ou remover:

```typescript
// OCULTAR ou REMOVER:
- Data Fechamento (depende de return_details.closed_at)
- Prazo Limite (depende de return_details.estimated_handling_limit)
- Dias Restantes (calculado a partir de prazo_limite)
- Código Rastreamento (depende de return_details.tracking_number)
```

#### 3. Simplificar Colunas de Mediação

**Problema:** 4 colunas mas dados não estão sendo validados nos logs

**Solução:** Manter apenas as essenciais:

```typescript
// MANTER:
- Em Mediação? (boolean calculado)
- É Troca? (boolean calculado)

// REMOVER temporariamente até validar:
- Data Est. Troca
- Dias Ação
```

#### 4. Remover Colunas de Metadata Não Funcionais

```typescript
// REMOVER da tabela principal:
- Última Ação (sempre null)
- Evidências (sempre 0)
- Anexos ML (sempre [])
```

### PRIORIDADE MÉDIA - Investigar e Corrigir

#### 5. Investigar Mensagens

- Verificar estrutura correta de `claim_messages`
- Adicionar logs para ver se mensagens existem mas em outro formato

#### 6. Investigar Return Details

- Confirmar se claims realmente não têm return_details ou se está em outro caminho

---

## 📋 RESUMO EXECUTIVO

**Situação Atual:**
- ✅ **17 colunas funcionando** corretamente (básicas + prioridade alta parcial)
- ⚠️ **8 colunas parcialmente funcionais** (dados null mas estrutura correta)
- ❌ **23 colunas não funcionais** (sempre vazias por falta de dados)

**Total de Colunas Implementadas:** 48 colunas
**Colunas Realmente Úteis:** ~25 colunas

**Recomendação Final:**

**OPÇÃO A (Recomendada) - Limpeza Radical:**
Remover as 23 colunas não funcionais, mantendo apenas as 25 que têm dados reais. Interface mais limpa e confiável.

**OPÇÃO B - Manter com Avisos:**
Manter todas as colunas mas adicionar indicador visual quando dados não estão disponíveis (ex: tooltip "Dados não disponíveis na API ML").

**OPÇÃO C - Híbrida:**
Remover colunas sempre vazias (breakdown detalhado, metadata), manter colunas com dados intermitentes (mediação, troca).
