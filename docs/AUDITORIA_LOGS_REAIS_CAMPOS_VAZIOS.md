# 🔍 AUDITORIA DE CAMPOS VAZIOS - ANÁLISE DE LOGS REAIS

## 📊 RESUMO EXECUTIVO

**Data da Análise:** 12/11/2025  
**Fonte:** Logs da Edge Function `get-devolucoes-direct` + Console do navegador  
**Claims Analisados:** 5+ claims diferentes

---

## ❌ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. 🚚 TIPO DE LOGÍSTICA - SEMPRE NULL

**Campo:** `tipo_logistica` (coluna "🚚 Tipo Logística")

**Log Real:**
```
BasicDataMapper - Dados recebidos: {
  "logistic_type": null  ⚠️ SEMPRE NULL
}
```

**Causa Raiz:**
- Campo sendo extraído de `claim.order_data?.shipping?.logistic_type`
- **PROBLEMA:** `order_data.shipping.logistic_type` não existe na resposta da API ML para claims
- Este campo só existe no endpoint `/items/{item_id}` (produto), não no endpoint de claims/returns

**Solução:**
- Buscar `logistic_type` do endpoint `/items/{item_id}` durante enriquecimento de `product_info`
- OU extrair de `order_data.shipping.logistic_type` se disponível no endpoint `/orders/{order_id}`

---

### 2. 💰 CUSTO TOTAL LOGÍSTICA - SEMPRE 0

**Campo:** `custo_total_logistica` (coluna "💰 Custos Logística")

**Log Real:**
```
FinancialDataMapper - shipping_costs_enriched recebido: {
  "total_logistics_cost": 0,  ⚠️ SEMPRE 0
  "original_total": 19.9,     ✅ TEM VALOR
  "breakdown": {
    "shipping_fee": 0,         ⚠️ SEMPRE 0
    "handling_fee": 0,         ⚠️ SEMPRE 0
    "insurance": 0,            ⚠️ SEMPRE 0
    "taxes": 0                 ⚠️ SEMPRE 0
  }
}
```

**Causa Raiz:**
- `ShippingCostsService` está retornando `total_logistics_cost: 0` mesmo com custos existindo
- Cálculo de `total_logistics_cost` está incorreto ou endpoint não retorna breakdown detalhado
- API ML provavelmente retorna apenas custo total, não breakdown individual

**Impacto:**
- Coluna "💰 Custos Logística" mostra R$ 0,00 mesmo quando há custos reais
- Tooltip de breakdown não exibe valores úteis

**Solução:**
- Verificar se endpoint `/shipments/{shipment_id}/costs` realmente retorna breakdown
- Se não, usar `original_total` como `custo_total_logistica` ao invés de tentar somar breakdown inexistente

---

### 3. 📦 CUSTO DEVOLUÇÃO - INCONSISTENTE

**Campo:** `custo_devolucao` (coluna "📦 Custo Dev.")

**Log Real:**
```
💰 ✅ CUSTO DEVOLUÇÃO encontrado (claim 5430926993): {
  "amount": 42.90,
  "currency": "BRL",
  "amount_usd": 7.52
}
```

**Observação:**
- ✅ Endpoint `/charges/return-cost` está funcionando quando chamado
- ⚠️ MAS alguns claims NÃO têm logs de custo de devolução
- Pode indicar que endpoint retorna 404 para alguns claims (sem custo registrado)

**Status:** PARCIALMENTE FUNCIONAL - Validar se todos os claims têm custos ou se alguns realmente retornam 404

---

### 4. 🚚 TRACKING/RASTREIO - PARCIALMENTE VAZIO

**Campo:** `tracking_number` / `codigo_rastreamento`

**Log Real:**
```
TrackingDataMapper - Dados recebidos: {
  "first_shipment_tracking": "MEL45856396831FMDOR01"  ✅ TEM VALOR
}

TrackingDataMapper - Dados recebidos: {
  "first_shipment_tracking": null  ⚠️ VAZIO
}
```

**Causa:**
- NORMAL - Alguns shipments ainda não têm tracking (label_generated mas não enviado)
- Não é erro de mapeamento, é ausência de dados na API ML

**Status:** ✅ FUNCIONANDO CORRETAMENTE - Vazio quando shipment ainda não foi enviado

---

### 5. 📅 PREVISÃO CHEGADA - NÃO VERIFICADO NOS LOGS

**Campo:** `previsao_chegada_vendedor` (coluna "📅 Previsão Chegada")

**Log Real:**
```
TrackingDataMapper - Dados recebidos: {
  "estimated_delivery": undefined  ⚠️ NÃO APARECE NO LOG
}
```

**Causa:**
- Log de debug adicionado mas valor não aparece na saída
- Pode estar como `undefined` ou não estar sendo extraído de `returnData?.estimated_delivery_date`

**Solução:** Adicionar log específico para `returnData?.estimated_delivery_date` para validar estrutura

---

### 6. 📤 CUSTO ENVIO ORIGINAL - SEMPRE NULL

**Campo:** `custo_envio_original` (coluna "📤 Custo Envio")

**Log Real:**
```
FinancialDataMapper - Campos extraídos: {
  "shipping_fee": null,  ⚠️ SEMPRE NULL
  "responsavel": null    ⚠️ SEMPRE NULL
}
```

**Causa Raiz:**
- Tentando extrair de `claim.shipping_fee` ou similar que não existe
- Custo de envio original deve vir de `order_data.shipping.cost` ou endpoint `/items/{item_id}/shipping_options`

**Solução:**
- Buscar custo de envio original do endpoint `/orders/{order_id}` em `order_data.shipping`
- OU do endpoint `/items/{item_id}/shipping_options` durante enriquecimento

---

## ✅ CAMPOS FUNCIONANDO CORRETAMENTE

### 1. 📦 Produto (Título, SKU)
```
BasicDataMapper - Dados recebidos: {
  "product_title": "Cinta Fita 5 Toneladas 50mm 9 Mt Para Amarrar Carg",  ✅
  "sku": "cintaj5t"  ✅
}
```

### 2. 🏷️ Subtipo
```
BasicDataMapper - Dados recebidos: {
  "subtipo_claim": "return_total",  ✅
  "return_subtype": "return_total"  ✅
}
```

### 3. 📍 Tracking Status
```
TrackingDataMapper - Dados recebidos: {
  "return_status": "shipped",           ✅
  "first_shipment_status": "ready_to_ship",  ✅
  "first_shipment_type": "return"       ✅
}
```

### 4. 💬 Comunicação
```
CommunicationDataMapper:
  "Total mensagens APÓS dedup/sort": 1,     ✅
  "Qualidade comunicação": "excelente"      ✅
```

---

## 📋 AÇÕES RECOMENDADAS (PRIORIDADE)

### 🔴 CRÍTICO - CORRIGIR IMEDIATAMENTE

1. **Tipo de Logística NULL**
   - Adicionar busca de `logistic_type` do endpoint `/orders/{order_id}` em `orderData.shipping.logistic_type`
   - Se não disponível, buscar de `/items/{item_id}` durante enriquecimento de produto

2. **Custo Total Logística = 0**
   - Corrigir cálculo em `ShippingCostsService` para usar `original_total` ao invés de somar breakdown que não existe
   - OU remover tentativa de buscar breakdown e usar apenas custo total disponível

### 🟡 ALTA PRIORIDADE

3. **Custo Envio Original NULL**
   - Extrair `custo_envio_original` de `orderData.shipping.cost` ou `.base_cost`
   - Validar se dado está disponível no endpoint `/orders/{order_id}`

4. **Previsão Chegada**
   - Adicionar log detalhado de `returnData?.estimated_delivery_date` para validar estrutura
   - Corrigir mapeamento se campo estiver com nome diferente

### 🟢 VALIDAÇÃO

5. **Custo Devolução Inconsistente**
   - Validar se todos os claims têm custo de devolução ou se alguns realmente retornam 404
   - Adicionar indicador visual "N/A" quando API retorna 404 (custo não registrado)

---

## 🎯 RESUMO DE CAMPOS POR STATUS

| Campo | Status | Causa | Ação |
|-------|--------|-------|------|
| **🚚 Tipo Logística** | ❌ NULL | Não buscado do endpoint correto | Buscar de `/orders` ou `/items` |
| **💰 Custo Total Log.** | ❌ ZERO | Cálculo incorreto/breakdown inexistente | Usar `original_total` |
| **📤 Custo Envio Orig.** | ❌ NULL | Campo não extraído de `order_data` | Extrair de `orderData.shipping.cost` |
| **📅 Previsão Chegada** | ⚠️ INDEFINIDO | Não verificado nos logs | Adicionar log + validar estrutura |
| **📦 Custo Devolução** | ⚠️ PARCIAL | Alguns claims sem custo | Validar se 404 é normal |
| **🏷️ Subtipo** | ✅ OK | Mapeado corretamente | Nenhuma |
| **📦 Produto/SKU** | ✅ OK | Enriquecimento funcionando | Nenhuma |
| **📍 Tracking Status** | ✅ OK | Dados corretos da API | Nenhuma |
| **💬 Comunicação** | ✅ OK | Mensagens extraídas corretamente | Nenhuma |
| **🚚 Rastreio** | ✅ OK (quando disponível) | Normal alguns vazios | Nenhuma |

---

## 📊 TAXA DE SUCESSO ATUAL

- **Campos Funcionando:** 6/10 (60%)
- **Campos com Problemas:** 4/10 (40%)
- **Campos Críticos Quebrados:** 2/10 (20%) - Tipo Logística e Custo Total
