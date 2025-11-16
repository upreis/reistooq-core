# 🐛 DEBUG: Coluna "📅 Data Chegada" Não Populando

## 📋 Problema Identificado

A coluna `data_chegada_produto` não estava sendo populada na tabela de devoluções, mesmo com dados disponíveis na API do Mercado Livre.

---

## 🔍 Causas Raiz Identificadas

### 1. **Estrutura de Dados Incorreta** ❌

**Problema:**
O código assumia que `status_history` era um **array** de eventos, mas na verdade é um **objeto** contendo campos de datas.

**Código Errado:**
```typescript
// ❌ ERRADO: Tratando como array
if (Array.isArray(shipmentData.status_history)) {
  const deliveredEvent = shipmentData.status_history.find(
    (event: any) => event.substatus === 'delivered'
  );
  if (deliveredEvent?.date) {
    return deliveredEvent.date;
  }
}
```

**Estrutura Real da API:**
```json
{
  "status_history": {
    "date_delivered": "2025-11-11T23:16:11.143-04:00",
    "date_returned": null,
    "date_shipped": "2025-11-10T08:03:15.769-04:00",
    "date_handling": "2025-11-06T10:54:52.921-04:00"
  }
}
```

**Código Correto:**
```typescript
// ✅ CORRETO: Tratando como objeto
if (shipmentData.status_history && typeof shipmentData.status_history === 'object') {
  const sh = shipmentData.status_history;
  
  if (sh.date_delivered) {
    logger.info(`[ReturnArrival] ✅ date_delivered: ${sh.date_delivered}`);
    return sh.date_delivered;
  }
  
  if (sh.date_returned) {
    logger.info(`[ReturnArrival] ✅ date_returned: ${sh.date_returned}`);
    return sh.date_returned;
  }
}
```

---

### 2. **Import/Export Inconsistente** ❌

**Problema:**
O arquivo `index.ts` estava tentando importar uma função `enrichClaimsWithArrivalDates` que **não existia** no `ReturnArrivalDateService.ts`.

**Código Errado:**
```typescript
// ❌ ERRADO: Função inexistente
import { enrichClaimsWithArrivalDates } from './services/ReturnArrivalDateService.ts';

// Tentativa de uso
const claimsWithArrivalDates = await enrichClaimsWithArrivalDates(allEnrichedClaims, accessToken);
```

**Código Correto:**
```typescript
// ✅ CORRETO: Função que realmente existe
import { fetchReturnArrivalDate } from './services/ReturnArrivalDateService.ts';

// Uso direto com Promise.all
const claimsWithArrivalDates = await Promise.all(
  allEnrichedClaims.map(async (claim: any) => {
    const claimId = claim.claim_details?.id || claim.id;
    if (!claimId) return claim;
    
    const arrivalDate = await fetchReturnArrivalDate(String(claimId), accessToken);
    
    return {
      ...claim,
      data_chegada_produto: arrivalDate
    };
  })
);
```

---

### 3. **Logs Excessivos com console.log** ⚠️

**Problema:**
Uso de `console.log` ao invés do sistema de `logger` padronizado.

**Código Errado:**
```typescript
// ❌ ERRADO: console.log direto
console.log('📅 ========== ANTES DE CHAMAR enrichClaimsWithArrivalDates ==========');
console.log(`📅 Total de claims: ${allEnrichedClaims.length}`);
```

**Código Correto:**
```typescript
// ✅ CORRETO: Usar logger padronizado
logger.progress('📅 Buscando datas de chegada das devoluções...');
logger.debug(`[ReturnArrival] 🔍 Iniciando para claim ${claimId}`);
logger.info(`[ReturnArrival] ✅ date_delivered: ${sh.date_delivered}`);
logger.warn(`[ReturnArrival] ⚠️ Data não encontrada (claim ${claimId})`);
logger.error(`[ReturnArrival] 💥 ERRO: ${error.message}`);
```

---

## ✅ Solução Implementada

### Arquivo: `ReturnArrivalDateService.ts`

```typescript
export async function fetchReturnArrivalDate(
  claimId: string,
  accessToken: string
): Promise<string | null> {
  try {
    // 1. Buscar returns
    const returnsUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`;
    const returnsRes = await fetch(returnsUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (returnsRes.status === 404) {
      logger.debug(`[ReturnArrival] ⚠️ Sem return físico (claim ${claimId})`);
      return null;
    }

    const returnsData = await returnsRes.json();
    
    // 2. Encontrar shipment de devolução
    let returnShipment = returnsData.shipments?.find(
      (s: any) => s.destination?.name === 'seller_address'
    );
    
    if (!returnShipment) {
      returnShipment = returnsData.shipments?.find(
        (s: any) => s.destination?.name === 'warehouse'
      );
    }

    if (!returnShipment?.shipment_id) {
      logger.warn(`[ReturnArrival] ❌ Sem shipment válido (claim ${claimId})`);
      return null;
    }

    // 3. Buscar detalhes do shipment
    const shipmentUrl = `https://api.mercadolibre.com/shipments/${returnShipment.shipment_id}`;
    const shipmentRes = await fetch(shipmentUrl, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const shipmentData = await shipmentRes.json();
    
    // 4. Extrair date_delivered do OBJETO status_history
    if (shipmentData.status_history && typeof shipmentData.status_history === 'object') {
      const sh = shipmentData.status_history;
      
      // Prioridade 1: date_delivered
      if (sh.date_delivered) {
        logger.info(`[ReturnArrival] ✅ date_delivered: ${sh.date_delivered}`);
        return sh.date_delivered;
      }
      
      // Prioridade 2: date_returned (fallback)
      if (sh.date_returned) {
        logger.info(`[ReturnArrival] ✅ date_returned: ${sh.date_returned}`);
        return sh.date_returned;
      }
    }

    logger.warn(`[ReturnArrival] ⚠️ Data não encontrada (claim ${claimId})`);
    return null;
    
  } catch (error: any) {
    logger.error(`[ReturnArrival] 💥 ERRO: ${error.message}`);
    return null;
  }
}
```

### Arquivo: `index.ts` (integração)

```typescript
import { fetchReturnArrivalDate } from './services/ReturnArrivalDateService.ts';

// ...

// Enriquecer com datas de chegada
logger.progress('📅 Buscando datas de chegada das devoluções...');

const claimsWithArrivalDates = await Promise.all(
  allEnrichedClaims.map(async (claim: any) => {
    try {
      const claimId = claim.claim_details?.id || claim.id;
      if (!claimId) return claim;
      
      const arrivalDate = await fetchReturnArrivalDate(String(claimId), accessToken);
      
      return {
        ...claim,
        data_chegada_produto: arrivalDate
      };
    } catch (err) {
      logger.error(`Erro ao buscar data de chegada para claim ${claim.id}:`, err);
      return claim;
    }
  })
);

const withDate = claimsWithArrivalDates.filter(c => c.data_chegada_produto).length;
logger.progress(`📊 Claims com data_chegada_produto: ${withDate}/${claimsWithArrivalDates.length}`);
```

---

## 🎯 Checklist para Debugging de Colunas Não Populadas

Quando uma coluna não estiver populando, verificar:

### 1. **Estrutura de Dados da API** 🔍
- [ ] A resposta da API está no formato esperado (objeto vs array)?
- [ ] Os campos existem com os nomes corretos?
- [ ] Adicionar logs para inspecionar a estrutura real: `logger.debug(JSON.stringify(data, null, 2))`

### 2. **Import/Export Corretos** 📦
- [ ] A função está sendo exportada corretamente no arquivo de serviço?
- [ ] O import no `index.ts` corresponde à função exportada?
- [ ] Não há typos nos nomes das funções?

### 3. **Mapeamento Correto** 🗺️
- [ ] O serviço retorna o dado correto?
- [ ] O mapeador (`FinancialDataMapper.ts`, etc.) está usando o campo correto?
- [ ] O campo está sendo passado para o objeto final em `mapeamento.ts`?

### 4. **Logging Adequado** 📝
- [ ] Usar `logger.debug/info/warn/error` ao invés de `console.log`
- [ ] Adicionar logs em pontos críticos:
  - Antes de chamar a API
  - Após receber resposta
  - Ao encontrar/não encontrar o dado
  - Em caso de erro

### 5. **Tratamento de Erros** ⚠️
- [ ] Try/catch apropriado?
- [ ] Retornar `null` ou valor padrão em caso de erro?
- [ ] Não quebrar o fluxo se um campo falhar?

### 6. **Verificação de Tipos** 🔧
- [ ] Usar `typeof` para verificar tipo antes de acessar propriedades
- [ ] Usar optional chaining `?.` para evitar erros de `undefined`
- [ ] Validar se arrays realmente são arrays: `Array.isArray()`

---

## 📊 Exemplo de Debugging Real

```typescript
// 1. Adicionar log da estrutura completa
logger.debug('🔍 ESTRUTURA COMPLETA:', JSON.stringify(shipmentData, null, 2));

// 2. Verificar tipo
logger.debug(`Tipo de status_history: ${typeof shipmentData.status_history}`);
logger.debug(`É array?: ${Array.isArray(shipmentData.status_history)}`);

// 3. Listar campos disponíveis
if (shipmentData.status_history) {
  logger.debug(`Campos disponíveis: ${Object.keys(shipmentData.status_history).join(', ')}`);
}

// 4. Verificar valores
logger.debug(`date_delivered: ${shipmentData.status_history?.date_delivered || 'AUSENTE'}`);
logger.debug(`date_returned: ${shipmentData.status_history?.date_returned || 'AUSENTE'}`);
```

---

## 🚀 Resultado Final

Após as correções:
- ✅ Coluna `data_chegada_produto` populando corretamente
- ✅ Extração correta de `date_delivered` do objeto `status_history`
- ✅ Fallback para `date_returned` quando `date_delivered` não existe
- ✅ Logging padronizado e informativo
- ✅ Tratamento de erros adequado

---

## 📌 Lições Aprendidas

1. **SEMPRE verificar a estrutura real da API** com logs antes de assumir formato
2. **Conferir imports/exports** para garantir que funções existem
3. **Usar logger padronizado** ao invés de console.log
4. **Adicionar logs em pontos críticos** para facilitar debugging futuro
5. **Validar tipos** antes de acessar propriedades (typeof, Array.isArray)
