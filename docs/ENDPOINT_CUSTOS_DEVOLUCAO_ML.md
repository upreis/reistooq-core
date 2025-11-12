# 💰 ENDPOINT DE CUSTOS DE DEVOLUÇÃO - API MERCADO LIVRE

**Data:** 2025-11-12  
**Fonte:** Documentação oficial API ML - Post Purchase

---

## 📋 RESUMO

Endpoint dedicado para obter **custo de envio de devoluções e trocas** por claim_id.

Este endpoint pode resolver o problema atual onde **breakdown de custos sempre retorna 0**.

---

## 🔗 ENDPOINT

```
GET /post-purchase/v1/claims/{claim_id}/charges/return-cost
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `claim_id` | long | ✅ Sim | ID do claim (path parameter) |
| `calculate_amount_usd` | boolean | ❌ Não | Se `true`, retorna valor em USD (query parameter, default: `false`) |

---

## 📊 EXEMPLO DE RESPOSTA

### Com `calculate_amount_usd=true`

**Chamada:**
```bash
curl --location 'https://api.mercadolibre.com/post-purchase/v1/claims/$CLAIM_ID/charges/return-cost?calculate_amount_usd=true'
```

**Resposta:**
```json
{
    "currency_id": "BRL",
    "amount": 42.90,
    "amount_usd": 7.517
}
```

### Sem parâmetro `calculate_amount_usd`

**Chamada:**
```bash
curl --location 'https://api.mercadolibre.com/post-purchase/v1/claims/$CLAIM_ID/charges/return-cost'
```

**Resposta:**
```json
{
    "currency_id": "BRL",
    "amount": 42.90
}
```

---

## 📝 CAMPOS DA RESPOSTA

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `claim_id` | long | ID do claim | 123456789 |
| `amount` | BigDecimal | Valor cobrado ao seller pela devolução | 42.90 |
| `amount_usd` | BigDecimal | Valor em dólar (se `calculate_amount_usd=true`) | 7.517 |
| `currency_id` | String | ID da moeda (BRL, USD, etc.) | "BRL" |

---

## 🎯 COMO IMPLEMENTAR

### 1. Criar função de busca de custos

```typescript
// supabase/functions/get-devolucoes-direct/services/ReturnCostService.ts

export const fetchReturnCost = async (
  claimId: string,
  accessToken: string
): Promise<{
  amount: number;
  currency_id: string;
  amount_usd?: number;
} | null> => {
  try {
    const response = await fetch(
      `https://api.mercadolibre.com/post-purchase/v1/claims/${claimId}/charges/return-cost?calculate_amount_usd=true`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Erro ao buscar custo devolução claim ${claimId}:`, response.status);
      return null;
    }

    const data = await response.json();
    
    console.log(`💰 Custo devolução claim ${claimId}:`, {
      amount: data.amount,
      currency: data.currency_id,
      amount_usd: data.amount_usd
    });
    
    return data;
  } catch (error) {
    console.error(`❌ Erro ao buscar custo devolução claim ${claimId}:`, error);
    return null;
  }
};
```

### 2. Integrar no enrichment de claims

```typescript
// supabase/functions/get-devolucoes-direct/index.ts

// Para cada claim, buscar custo de devolução
const returnCostData = await fetchReturnCost(claim.id, accessToken);

if (returnCostData) {
  claim.return_cost_enriched = {
    amount: returnCostData.amount,
    currency_id: returnCostData.currency_id,
    amount_usd: returnCostData.amount_usd
  };
  
  console.log(`✅ Custo devolução enriquecido: ${returnCostData.amount} ${returnCostData.currency_id}`);
}
```

### 3. Mapear no FinancialDataMapper

```typescript
// supabase/functions/get-devolucoes-direct/mappers/FinancialDataMapper.ts

export const mapFinancialData = (item: any) => {
  const claim = item;
  
  return {
    // ... outros campos
    
    // ✅ NOVO: Custo real de devolução da API ML
    custo_devolucao_ml: claim.return_cost_enriched?.amount || null,
    moeda_custo_devolucao: claim.return_cost_enriched?.currency_id || null,
    custo_devolucao_usd: claim.return_cost_enriched?.amount_usd || null,
    
    // ... outros campos
  };
};
```

---

## 🚀 BENEFÍCIOS DA IMPLEMENTAÇÃO

### ✅ Resolve problemas atuais

1. **Breakdown de custos zerado** - Teremos valor real do custo de devolução
2. **Campo `custo_devolucao` vazio** - Será populado com valor preciso da API ML
3. **Coluna "Custo Devolução" útil** - Mostrará valor real cobrado ao seller

### ✅ Novos dados disponíveis

- Custo em BRL e USD
- Precisão do valor cobrado ao seller
- Base para cálculos financeiros mais precisos

---

## ⚠️ CONSIDERAÇÕES

### Rate Limiting

- Endpoint adicional por claim = mais chamadas à API ML
- **Recomendação:** Implementar em batch com delay entre calls
- **Ou:** Cache de 24h para custos já buscados

### Performance

```typescript
// Exemplo de busca em batch com rate limiting
const returnCostsPromises = claims.map((claim, index) => 
  new Promise(resolve => {
    setTimeout(async () => {
      const cost = await fetchReturnCost(claim.id, accessToken);
      resolve({ claimId: claim.id, cost });
    }, index * 200); // 200ms entre cada call = ~5 calls/segundo
  })
);

const returnCosts = await Promise.all(returnCostsPromises);
```

---

## 📈 IMPACTO ESPERADO

**Antes da implementação:**
- ❌ `custo_devolucao`: sempre null
- ❌ `breakdown`: sempre zerado
- ❌ Tooltip mostra apenas total sem detalhamento

**Depois da implementação:**
- ✅ `custo_devolucao`: valor real da API ML
- ✅ `custo_devolucao_usd`: valor em dólar
- ✅ Tooltip mostra custo preciso de devolução
- ✅ Coluna útil para análise financeira

---

## 🔍 PRÓXIMOS PASSOS

1. ✅ **Documentar endpoint** (CONCLUÍDO)
2. ⏳ Criar `ReturnCostService.ts`
3. ⏳ Integrar no enrichment de claims
4. ⏳ Atualizar `FinancialDataMapper.ts`
5. ⏳ Atualizar `CustosLogisticaCell.tsx` para exibir novo campo
6. ⏳ Testar com dados reais

---

## 📚 REFERÊNCIA

**Documentação oficial:** Mercado Livre - Post Purchase API  
**Seção:** Custo de envio de devoluções e trocas
