# 🔍 FASE 2A - DIAGNÓSTICO: Dados JSONB Vazios

**Data**: 10/11/2025  
**Status**: 🔴 PROBLEMA CRÍTICO IDENTIFICADO  
**Prioridade**: 🔥 URGENTE

---

## 🚨 PROBLEMA IDENTIFICADO

### Sintoma:
Todos os campos JSONB na tabela `devolucoes_avancadas` estão **VAZIOS** (`{}`):
```json
{
  "dados_review": {},
  "dados_comunicacao": {},
  "dados_deadlines": {},
  "dados_acoes_disponiveis": {},
  "dados_custos_logistica": {},
  "dados_fulfillment": {}
}
```

### Causa Raiz:
**ESCOPO INCORRETO DAS VARIÁVEIS**

As variáveis são declaradas **DENTRO** do loop de processamento (linhas 501, 538, 606, etc.), mas o objeto `reviewInfo` é montado **FORA** desse escopo (linha 799-821).

#### Exemplo do Problema:

```typescript
// ❌ ERRADO: Variáveis declaradas dentro de blocos condicionais
if (firstShipment?.shipment_id) {
  let shippingCosts: any = null;  // ← Escopo LOCAL
  // ... busca dados
  shippingCosts = { ... };
}

// Depois, muito abaixo no código:
const reviewInfo = {
  // Esta variável reviewInfo é DIFERENTE!
  // Não tem acesso ao shippingCosts do bloco acima
}

// No UPSERT:
dados_custos_logistica: shippingCosts || {}  // ← shippingCosts está UNDEFINED aqui!
```

---

## 📊 ANÁLISE DETALHADA

### Variáveis Afetadas:

| Variável | Linha Declaração | Usado no UPSERT | Status |
|----------|-----------------|-----------------|--------|
| `availableActions` | 501 | 1046 | ❌ VAZIO |
| `shippingCosts` | 538 | 1047 | ❌ VAZIO |
| `fulfillmentInfo` | 606 | 1048 | ❌ VAZIO |
| `reviewInfo` | 799 (objeto) | 1043 | ⚠️ PARCIAL |
| `communicationInfo` | 824 | 1044 | ⚠️ PARCIAL |
| `deadlines` | 747 | 1045 | ⚠️ PARCIAL |

### Fluxo Atual (QUEBRADO):

```
1. Loop por cada claim
   ├─ Busca availableActions → salva em variável LOCAL
   ├─ Busca shippingCosts → salva em variável LOCAL  
   ├─ Busca fulfillmentInfo → salva em variável LOCAL
   ├─ Monta reviewInfo (NOVO objeto, sem acesso às variáveis acima)
   └─ UPSERT no banco → TODAS as variáveis estão UNDEFINED ou {}
```

---

## ✅ SOLUÇÃO

### Estratégia:
**Mover TODAS as declarações de variáveis para o INÍCIO do loop**, antes de qualquer busca de dados.

### Código Corrigido:

```typescript
// ✅ CORRETO: Declarar TODAS as variáveis no início do loop
let availableActions: any = null;
let shippingCosts: any = null;
let fulfillmentInfo: any = null;
let reviewInfo: any = null;
let communicationInfo: any = null;
let deadlines: any = null;
let leadTimeData: any = null;
let buyerInfo: any = null;
let productInfo: any = null;
let financialInfo: any = null;
let trackingInfo: any = null;

// Agora todas as buscas podem popular essas variáveis
// E o UPSERT terá acesso a TODAS elas
```

---

## 🎯 IMPACTO

### Antes (ATUAL):
- ❌ 0% dos dados JSONB salvos
- ❌ Colunas vazias no frontend
- ❌ Nenhuma informação enriquecida disponível

### Depois (ESPERADO):
- ✅ 100% dos dados JSONB salvos
- ✅ Todas as colunas populadas
- ✅ Informações completas de review, comunicação, prazos, etc.

---

## 📝 CHECKLIST DE CORREÇÃO

- [ ] Mover declarações de variáveis para o topo do loop
- [ ] Verificar se todas as variáveis estão acessíveis no UPSERT
- [ ] Remover declarações duplicadas (se houver)
- [ ] Adicionar logs de debug para validar dados antes do UPSERT
- [ ] Deploy da edge function
- [ ] Testar busca de devoluções
- [ ] Validar dados JSONB no banco
- [ ] Confirmar exibição no frontend

---

## 🔗 PRÓXIMOS PASSOS

1. **Aplicar correção** no código da edge function
2. **Deploy** forçado
3. **Testar** busca de devoluções
4. **Validar** dados no banco com SQL query
5. **Confirmar** exibição no frontend
