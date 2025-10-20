# 📋 PLANO DE OTIMIZAÇÃO - ml-api-direct
**Objetivo**: Reduzir de 2.549 para ~1.700 linhas sem quebrar funcionalidade

---

## 🎯 ESTRATÉGIA GERAL

### Princípios de Segurança:
1. ✅ **Testar após CADA fase** antes de prosseguir
2. ✅ **Manter funcionalidade EXATA** - apenas reorganizar código
3. ✅ **Usar utilitários existentes** em `utils/` e `mappers/`
4. ✅ **Remover apenas código comprovadamente duplicado/não usado**
5. ✅ **Validar com dados reais** após cada mudança

---

## 📊 FASES DE EXECUÇÃO

---

## ✅ FASE 1: REMOVER FUNÇÕES NÃO UTILIZADAS
**Impacto**: Baixo risco | **Redução**: ~50 linhas

### 1.1 Verificar Uso Real
```bash
# Buscar chamadas das funções suspeitas:
- buscarReturns() (linhas 18-41)
- buscarShipmentHistory() (linhas 43-66)
```

### 1.2 Ações
- [ ] Confirmar que `buscarReturns()` NUNCA é chamada no arquivo
- [ ] Confirmar que `buscarShipmentHistory()` NUNCA é chamada no arquivo
- [ ] **SE CONFIRMADO**: Deletar ambas as funções
- [ ] **SE USADO**: Manter e documentar onde é usado

### 1.3 Verificação Pós-Fase 1
```bash
✅ Edge function continua fazendo deploy sem erros
✅ Não há erros de "função não definida" nos logs
✅ Busca de devoluções retorna os mesmos dados
```

---

## ✅ FASE 2: SUBSTITUIR REASON MAPPING DUPLICADO POR UTILITÁRIO
**Impacto**: Médio risco | **Redução**: ~180 linhas

### 2.1 Análise de Uso Atual
**Localização das Duplicações**:
1. ❌ Linhas 981-1027: Função `mapReasonWithApiData()` DUPLICADA
2. ❌ Linhas 346-403: Lógica inline de mapeamento de `reason_category`
3. ❌ Linhas 2280-2337: Lógica inline IDÊNTICA de reasons com spread operator

**Utilitário Existente**: `supabase/functions/ml-api-direct/mappers/reason-mapper.ts`

### 2.2 Plano de Substituição

#### PASSO 1: Importar o mapper existente
```typescript
// No topo do index.ts, adicionar:
import { mapReasonWithApiData } from './mappers/reason-mapper.ts'
```

#### PASSO 2: Remover função duplicada (linhas 981-1027)
```typescript
// ❌ DELETAR esta função inteira:
function mapReasonWithApiData(reasonId, apiData) { ... }
```

#### PASSO 3: Substituir uso inline (linhas 346-403)
```typescript
// ❌ ANTES (linhas 346-403):
reason_category: (() => {
  const reasonId = devolucao.claim_details?.reason_id || ...
  if (!reasonId) return null;
  if (reasonId.startsWith('PDD')) return 'Produto Defeituoso...';
  // ... 50+ linhas
})(),

// ✅ DEPOIS:
...mapReasonWithApiData(
  devolucao.claim_details?.reason_id || null,
  reasonsMap.get(devolucao.claim_details?.reason_id) || null
),
```

#### PASSO 4: Substituir spread operator inline (linhas 2280-2337)
```typescript
// ❌ ANTES (já está correto, mas garantir que usa o mapper):
...(() => {
  const reasonId = safeClaimData?.claim_details?.reason_id || null;
  const apiData = reasonsMap.get(reasonId) || null;
  const mappedReason = mapReasonWithApiData(reasonId, apiData); // ✅ JÁ USA
  return {
    reason_id: mappedReason.reason_id,
    // ...
  };
})(),

// ✅ SIMPLIFICAR PARA:
...mapReasonWithApiData(
  safeClaimData?.claim_details?.reason_id || null,
  reasonsMap.get(safeClaimData?.claim_details?.reason_id) || null
),
```

### 2.3 Verificação Pós-Fase 2
```bash
✅ Todos os claims retornam reason_category correto
✅ reason_name e reason_detail preenchidos quando API retorna
✅ Fallback genérico funciona quando API falha
✅ Comparar 5 claims antes/depois - dados IDÊNTICOS
```

### 2.4 Teste Específico
```javascript
// Testar 3 cenários:
1. Reason com dados da API (deve usar name/detail da API)
2. Reason SEM dados da API (deve usar fallback genérico)
3. Claim sem reason_id (deve retornar todos null)
```

---

## ✅ FASE 3: SUBSTITUIR SLA DUPLICADO POR UTILITÁRIO
**Impacto**: Médio risco | **Redução**: ~210 linhas

### 3.1 Análise de Uso Atual
**Localização das Duplicações**:
1. ❌ Linhas 1650-1746: Cálculo completo de SLA em `sla_metrics`
2. ❌ Linhas 432-575: Cálculo IDÊNTICO inline (tempo_resposta_comprador, tempo_analise_ml, etc)

**Utilitário Existente**: `supabase/functions/ml-api-direct/utils/sla-calculator.ts`
- Função: `calculateSLAMetrics(claimData, orderDetail, consolidatedMessages, mediationDetails)`

### 3.2 Plano de Substituição

#### PASSO 1: Importar o calculator existente
```typescript
// No topo do index.ts:
import { calculateSLAMetrics } from './utils/sla-calculator.ts'
```

#### PASSO 2: Substituir cálculo inline (linhas 432-575)
```typescript
// ❌ ANTES (143 linhas de cálculo):
tempo_resposta_comprador: (() => {
  const messages = devolucao.claim_messages?.messages || [];
  // ... 40 linhas
})(),
tempo_analise_ml: (() => { ... })(),
data_primeira_acao: (() => { ... })(),
// ... mais 100 linhas

// ✅ DEPOIS (1 linha):
...calculateSLAMetrics(claimData, orderDetail, consolidatedMessages, mediationDetails),
```

#### PASSO 3: Substituir cálculo em sla_metrics (linhas 1650-1746)
```typescript
// ❌ ANTES:
sla_metrics: (() => {
  const dataCriacao = orderDetail?.date_created ? new Date(orderDetail.date_created) : new Date()
  // ... 97 linhas
  return {
    tempo_primeira_resposta_vendedor: tempoPrimeiraRespostaVendedor,
    // ... 10+ campos
  }
})(),

// ✅ DEPOIS:
sla_metrics: calculateSLAMetrics(claimData, orderDetail, consolidatedMessages, mediationDetails),
```

### 3.3 Verificação Pós-Fase 3
```bash
✅ tempo_primeira_resposta_vendedor calcula corretamente
✅ tempo_resposta_comprador calcula corretamente
✅ tempo_analise_ml calcula corretamente
✅ sla_cumprido boolean correto (true/false)
✅ eficiencia_resolucao categoriza corretamente (excelente/boa/regular/ruim)
✅ timeline_consolidado com datas corretas
✅ Comparar 5 claims antes/depois - métricas IDÊNTICAS
```

---

## ✅ FASE 4: SUBSTITUIR CÁLCULO FINANCEIRO POR UTILITÁRIO
**Impacto**: Médio risco | **Redução**: ~80 linhas

### 4.1 Análise de Uso Atual
**Localização das Duplicações**:
1. ❌ Linhas 1751-1821: Cálculo completo em `financial_data` (71 linhas)
2. ❌ Linhas 2407-2435: Cálculo inline de custos (29 linhas)

**Utilitário Existente**: `supabase/functions/ml-api-direct/utils/financial-calculator.ts`
- `calculateFinancialData(claimData, orderDetail)`
- `calculateProductCosts(claimData, orderDetail, shipmentData)`

### 4.2 Plano de Substituição

#### PASSO 1: Importar calculators
```typescript
import { calculateFinancialData, calculateProductCosts } from './utils/financial-calculator.ts'
```

#### PASSO 2: Substituir financial_data (linhas 1751-1821)
```typescript
// ❌ ANTES:
financial_data: (() => {
  const payments = orderDetail?.payments || []
  const firstPayment = payments[0] || {}
  // ... 71 linhas de cálculo
  return { ... }
})(),

// ✅ DEPOIS:
financial_data: calculateFinancialData(claimData, orderDetail),
```

#### PASSO 3: Substituir custos inline (linhas 2407-2435)
```typescript
// ❌ ANTES:
custo_frete_devolucao: (() => { ... })(),
custo_logistica_total: (() => { ... })(),
valor_original_produto: (() => { ... })(),
valor_reembolsado_produto: (() => { ... })(),
taxa_ml_reembolso: (() => { ... })(),

// ✅ DEPOIS:
...calculateProductCosts(safeClaimData, safeOrderDetail, safeShipmentData),
```

### 4.3 Verificação Pós-Fase 4
```bash
✅ valor_reembolso_total calculado corretamente
✅ valor_reembolso_produto e valor_reembolso_frete separados
✅ taxa_ml_reembolso calculada corretamente
✅ impacto_financeiro_vendedor negativo (perda) ou positivo
✅ descricao_custos.produto.percentual_reembolsado correto
✅ Comparar 5 claims antes/depois - valores IDÊNTICOS
```

---

## ✅ FASE 5: SUBSTITUIR EXTRAÇÃO DE DADOS DO COMPRADOR
**Impacto**: Baixo risco | **Redução**: ~20 linhas

### 5.1 Análise de Uso Atual
**Localização das Duplicações**:
1. ❌ Linhas 198-200: Extração inline
2. ❌ Linhas 2370-2372: Extração inline IDÊNTICA

**Utilitário Existente**: `supabase/functions/ml-api-direct/utils/field-extractor.ts`
- `extractBuyerData(orderDetail)`
- `extractPaymentData(orderDetail)`

### 5.2 Plano de Substituição

#### PASSO 1: Importar extractors
```typescript
import { extractBuyerData, extractPaymentData } from './utils/field-extractor.ts'
```

#### PASSO 2: Substituir dados do comprador
```typescript
// ❌ ANTES (linhas 198-200 e 2370-2372):
comprador_cpf_cnpj: devolucao.order_data?.buyer?.billing_info?.doc_number,
comprador_nome_completo: `${devolucao.order_data?.buyer?.first_name || ''} ${devolucao.order_data?.buyer?.last_name || ''}`.trim(),
comprador_nickname: devolucao.order_data?.buyer?.nickname,

// ✅ DEPOIS:
...extractBuyerData(devolucao.order_data),
```

#### PASSO 3: Substituir dados de pagamento (linhas 202-208)
```typescript
// ❌ ANTES:
metodo_pagamento: devolucao.order_data?.payments?.[0]?.payment_method_id,
tipo_pagamento: devolucao.order_data?.payments?.[0]?.payment_type,
numero_parcelas: devolucao.order_data?.payments?.[0]?.installments,
// ...

// ✅ DEPOIS:
...extractPaymentData(devolucao.order_data),
```

### 5.3 Verificação Pós-Fase 5
```bash
✅ comprador_cpf_cnpj preenchido corretamente
✅ comprador_nome_completo concatenado sem espaços extras
✅ metodo_pagamento e tipo_pagamento corretos
✅ Comparar 5 claims antes/depois - dados IDÊNTICOS
```

---

## ✅ FASE 6: REMOVER LOGS DEBUG EXCESSIVOS
**Impacto**: Muito baixo risco | **Redução**: ~150 linhas

### 6.1 Análise de Logs
**Tipos de logs a remover**:
1. ❌ `[REISTOM DEBUG]` - ~50 ocorrências
2. ❌ `[REISTOM INFO]` - ~40 ocorrências (manter apenas críticos)
3. ❌ `[FASE1]`, `[FASE2]`, `[FASE3]` - ~30 ocorrências
4. ✅ Manter apenas logs de erro e sucesso essenciais

### 6.2 Regras de Remoção

#### Remover (não agrega valor em produção):
```typescript
// ❌ DELETAR:
console.log(`[REISTOM DEBUG] 🔍 Iniciando busca do reason ${reasonId}...`);
console.log(`[REISTOM DEBUG] 📍 URL: https://...`);
console.log(`[REISTOM DEBUG] 🔑 Token presente: ${accessToken ? 'SIM' : 'NÃO'}`);
console.log(`[FASE1] ✅ data_criacao_claim: ${value}`);
console.log(`[FASE2] 🎯 reason_id: ${reasonId}`);
console.log(`[FASE3] 📝 subcategoria_problema: ${subcategoria...}`);
```

#### Manter (logs importantes):
```typescript
// ✅ MANTER:
console.log(`✅ ${recordsToInsert.length} pedidos cancelados salvos no Supabase!`)
console.error(`❌ Erro ao buscar reason ${reasonId}:`, error)
console.warn(`⚠️ Token expirado (401) na URL: ${url}`)
console.log(`🎉 Total de claims processados: ${ordersCancelados.length}`)
```

### 6.3 Implementação com Utilitário Logger

#### Substituir logs por logger (onde faz sentido):
```typescript
import { logger } from './utils/logger.ts'

// ❌ ANTES:
console.log(`[REISTOM DEBUG] 🚀 CHAMANDO fetchMultipleReasons...`);

// ✅ DEPOIS:
logger.debug('Chamando fetchMultipleReasons', { reasonIds: uniqueReasonIds.size });

// ❌ ANTES:
console.log(`✅ ${recordsToInsert.length} pedidos cancelados salvos...`)

// ✅ DEPOIS:
logger.success(`${recordsToInsert.length} pedidos cancelados salvos`);
```

### 6.4 Verificação Pós-Fase 6
```bash
✅ Logs de erro ainda funcionam corretamente
✅ Logs de sucesso críticos preservados
✅ Nenhum log de debug em produção (verificar com LOG_LEVEL=info)
✅ Edge function continua funcionando normalmente
```

---

## ✅ FASE 7: CONSOLIDAR CÓDIGO INLINE EM FUNÇÕES UTILITÁRIAS
**Impacto**: Médio risco | **Redução**: ~150 linhas

### 7.1 Análise de Código Inline Repetitivo

**Candidatos para Extração**:
1. ❌ Linhas 406-485: Extração de mediação, feedbacks (80 linhas)
2. ❌ Linhas 1571-1622: Extração de review data (52 linhas)
3. ❌ Linhas 2437-2501: Internal tags e análise de qualidade (65 linhas)

### 7.2 Criar Novas Funções Utilitárias

#### NOVO ARQUIVO: `utils/mediation-extractor.ts`
```typescript
/**
 * Extrai dados de mediação e feedbacks
 */
export function extractMediationData(mediationDetails: any, claimMessages: any, buyer: any, seller: any) {
  return {
    resultado_mediacao: extractMediationResult(mediationDetails),
    mediador_ml: extractMediatorId(mediationDetails),
    feedback_comprador_final: extractBuyerFinalFeedback(claimMessages, buyer),
    feedback_vendedor: extractSellerFeedback(claimMessages, seller)
  };
}
```

#### NOVO ARQUIVO: `utils/review-extractor.ts`
```typescript
/**
 * Extrai dados de review enriquecidos
 */
export function extractEnrichedReviewData(returnReviews: any[]) {
  // ... lógica das linhas 1571-1622
  return {
    warehouseReviewStatus,
    sellerReviewStatus,
    reviewResult,
    reviewProblems,
    reviewRequiredActions,
    reviewStartDate,
    reviewQualityScore,
    reviewNeedsManualAction
  };
}
```

#### NOVO ARQUIVO: `utils/tags-analyzer.ts`
```typescript
/**
 * Analisa tags internas e qualidade
 */
export function analyzeInternalTags(claimData: any, orderDetail: any, shipmentData: any) {
  return {
    internal_tags: generateInternalTags(claimData, orderDetail, shipmentData),
    tem_financeiro: hasFinancialData(orderDetail, claimData),
    tem_review: hasReview(claimData),
    tem_sla: hasSLA(claimData),
    nota_fiscal_autorizada: hasAuthorizedInvoice(orderDetail),
    qualidade_comunicacao: assessCommunicationQuality(claimData),
    eficiencia_resolucao: assessResolutionEfficiency(claimData)
  };
}
```

### 7.3 Plano de Substituição

#### PASSO 1: Criar arquivos utilitários
```bash
✅ Criar utils/mediation-extractor.ts
✅ Criar utils/review-extractor.ts
✅ Criar utils/tags-analyzer.ts
```

#### PASSO 2: Mover lógica inline para funções
```typescript
// ❌ ANTES (linhas 406-485):
resultado_mediacao: (() => {
  const mediationResult = devolucao.mediation_details?.resolution?.type || ...
  const MEDIACAO_MAP: Record<string, string> = { ... }
  return MEDIACAO_MAP[mediationResult] || mediationResult;
})(),
// ... mais 70 linhas

// ✅ DEPOIS:
...extractMediationData(
  devolucao.mediation_details,
  devolucao.claim_messages,
  devolucao.buyer,
  devolucao.order_data?.seller
),
```

#### PASSO 3: Substituir extração de review
```typescript
// ❌ ANTES (linhas 1571-1622):
const enrichedReviewData = (() => {
  const warehouseReview = returnReviews.find(r => r.type === 'warehouse')
  // ... 52 linhas
  return { ... }
})()

// ✅ DEPOIS:
const enrichedReviewData = extractEnrichedReviewData(returnReviews)
```

#### PASSO 4: Substituir análise de tags
```typescript
// ❌ ANTES (linhas 2437-2501):
internal_tags: (() => { ... })(),
tem_financeiro: (() => { ... })(),
tem_review: (() => { ... })(),
// ... mais 60 linhas

// ✅ DEPOIS:
...analyzeInternalTags(safeClaimData, safeOrderDetail, safeShipmentData),
```

### 7.4 Verificação Pós-Fase 7
```bash
✅ resultado_mediacao mapeia corretamente (favor comprador/vendedor/etc)
✅ feedback_comprador_final extrai última mensagem do comprador
✅ review_quality_score calcula pontuação corretamente
✅ internal_tags contém tags corretas (resolved, mediated, etc)
✅ qualidade_comunicacao categoriza corretamente (none/fair/good/excellent)
✅ Comparar 5 claims antes/depois - dados IDÊNTICOS
```

---

## 🧪 VALIDAÇÃO FINAL (APÓS TODAS AS FASES)

### Checklist de Qualidade
```bash
✅ Edge function faz deploy sem erros
✅ Busca retorna MESMO número de claims (antes: X, depois: X)
✅ Comparar 10 claims aleatórios - TODOS os campos IDÊNTICOS
✅ Performance igual ou melhor (tempo de resposta)
✅ Nenhum campo vazio que antes estava preenchido
✅ Logs de erro funcionam corretamente
✅ Código tem 1.700-1.800 linhas (redução de ~800 linhas)
```

### Teste de Regressão Completo
```javascript
// Script de validação:
1. Buscar devoluções SEM filtro de data
2. Buscar devoluções COM filtro de data
3. Validar campos críticos em todos os claims:
   - reason_category, reason_name, reason_detail
   - tempo_primeira_resposta_vendedor, sla_cumprido
   - valor_reembolso_total, impacto_financeiro_vendedor
   - comprador_cpf_cnpj, comprador_nome_completo
4. Comparar resultado com snapshot ANTES da otimização
```

### Rollback Plan
```bash
Se qualquer fase quebrar:
1. Reverter commit da fase problemática
2. Analisar logs de erro
3. Identificar campo/função que quebrou
4. Corrigir e testar isoladamente
5. Re-aplicar fase
```

---

## 📈 MÉTRICAS DE SUCESSO

| Métrica | Antes | Meta Depois | Status |
|---------|-------|-------------|--------|
| Linhas de código | 2.549 | ~1.700 | ⏳ |
| Funções duplicadas | 8 | 0 | ⏳ |
| Logs debug em prod | ~150 | 0 | ⏳ |
| Funções não usadas | 2 | 0 | ⏳ |
| Uso de utilitários | 0% | 100% | ⏳ |
| Tempo de resposta | X ms | ≤ X ms | ⏳ |
| Claims retornados | Y | Y | ⏳ |

---

## ⚠️ AVISOS IMPORTANTES

### NÃO FAZER:
❌ Alterar lógica de negócio
❌ Mudar estrutura de dados retornados
❌ Remover campos que estão sendo usados
❌ Aplicar múltiplas fases sem testar
❌ Modificar chamadas à API ML

### SEMPRE FAZER:
✅ Testar após cada fase
✅ Comparar dados antes/depois
✅ Validar com claims reais
✅ Manter funcionalidade EXATA
✅ Documentar mudanças

---

## 🚀 EXECUÇÃO

**Ordem de Execução Recomendada**:
1. Fase 1 (menor risco) → Testar
2. Fase 6 (logs) → Testar
3. Fase 5 (buyer data) → Testar
4. Fase 2 (reasons) → Testar
5. Fase 3 (SLA) → Testar
6. Fase 4 (financeiro) → Testar
7. Fase 7 (inline funções) → Testar
8. Validação Final Completa

**Tempo Estimado**: 3-4 horas (com testes)

---

## 📝 NOTAS

- Todas as mudanças são **refatorações seguras**
- Funcionalidade permanece **100% idêntica**
- Código fica mais **testável e manutenível**
- Redução de **~32% do código** sem perder features
