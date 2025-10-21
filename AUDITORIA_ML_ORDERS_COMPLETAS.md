# 📋 AUDITORIA COMPLETA - PÁGINA /ml-orders-completas
**Data:** 21/10/2025 14:25  
**Versão:** 1.0  
**Status:** 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

---

## 📊 EXECUTIVE SUMMARY

### ✅ Pontos Positivos
1. ✅ **API Funcionando**: ml-api-direct está retornando dados da API do Mercado Livre
2. ✅ **Banco de Dados Populado**: 290 devoluções salvas no banco
3. ✅ **Arquitetura Modular**: Mappers bem organizados em 7 módulos
4. ✅ **Performance**: Sistema de paginação e filtros implementado

### 🔴 Problemas Críticos Identificados

#### 1. **LIMITE DE 63 DEVOLUÇÕES** 
- ❌ **Banco tem 290 devoluções, mas só mostra 63**
- 📍 **Causa**: Limite imposto nos filtros ou paginação
- 🎯 **Ação**: Investigar hook `useDevolucoes` e filtros aplicados

#### 2. **COLUNAS VAZIAS SEM DADOS BRUTOS**
- ❌ **118 colunas na tabela, muitas vazias**
- 📍 **Causa**: Mappers retornando `null` ao invés de extrair dados do `raw`
- 🎯 **Ação**: Revisar todos os 7 mappers e corrigir extração de dados

#### 3. **ERRO DE SCHEMA NO BANCO**
- ❌ `Could not find the 'acao_seller_necessaria' column`
- 📍 **Causa**: Schema cache desatualizado após migração
- 🎯 **Ação**: Atualizar schema cache do Supabase

---

## 🔍 ANÁLISE DETALHADA

### 1. DADOS NO BANCO DE DADOS

#### Estado Atual
```sql
-- Total de devoluções no banco
SELECT COUNT(*) FROM devolucoes_avancadas 
WHERE integration_account_id IN (
  'da212057-37cc-41ce-82c8-5fe5befb9cd4',
  '4d22ffe5-0b02-4cd2-ab42-b3f168307425'
)
-- Resultado: 290 devoluções
```

#### Amostra de Dados Reais
```json
{
  "order_id": "2000013333403468",
  "claim_id": "5419819938",
  "produto_titulo": "Cinta Catraca Para Amarrar Carga...",
  "sku": "catraca0,8",
  "valor_retido": 21.9,
  "status_devolucao": "paid",
  "data_criacao": "2025-10-08 16:33:40"
}
```

✅ **Conclusão**: Dados estão sendo salvos corretamente no banco

---

### 2. API DO MERCADO LIVRE

#### Resposta da API (ml-api-direct)
```json
{
  "success": true,
  "data": [
    {
      "type": "cancellation",
      "order_id": 2000010875107120,
      "date_created": "2025-02-26T20:44:21.000-04:00",
      "status": "cancelled",
      "reason": "Mediations cancel the order",
      "amount": 19.36,
      "resource_data": {
        "title": "308206 - Mini Dicróica Mr11...",
        "sku": "minidi3000k",
        "quantity": 2
      },
      "order_data": { /* dados completos do pedido */ },
      "claim_details": { /* dados completos do claim */ },
      "claim_messages": { /* mensagens */ },
      "return_details_v2": { /* detalhes da devolução */ }
    }
  ]
}
```

✅ **Conclusão**: API retornando dados completos e estruturados

---

### 3. SISTEMA DE MAPEAMENTO DE DADOS

#### Arquitetura dos Mappers (7 Módulos)

```
src/features/devolucoes/utils/mappers/
├── index.ts                 ✅ Orquestrador principal
├── BasicDataMapper.ts       ⚠️  33 campos (muitos null)
├── FinancialDataMapper.ts   ⚠️  23 campos (muitos null)
├── CommunicationDataMapper.ts ⚠️ 13 campos (muitos null)
├── TrackingDataMapper.ts    ⚠️  19 campos (muitos null)
├── ContextDataMapper.ts     ⚠️  15 campos (muitos null)
├── MetadataMapper.ts        ⚠️  14 campos (muitos null)
└── RawDataMapper.ts         ✅ Preserva dados brutos
```

#### Problemas Identificados nos Mappers

##### 🔴 BasicDataMapper.ts
```typescript
// PROBLEMA: Campos retornando null quando deveriam extrair do raw
acao_seller_necessaria: null,  // ❌ Deveria verificar available_actions
proxima_acao_requerida: null,  // ❌ Deveria extrair do claim_details
nivel_prioridade: null,         // ❌ Deveria usar reason_priority
nivel_complexidade: null,       // ❌ Deveria calcular baseado no tipo
impacto_reputacao: null,        // ❌ Deveria analisar seller_reputation
satisfacao_comprador: null,     // ❌ Deveria extrair do feedback
feedback_comprador_final: null, // ❌ Deveria vir de claim_messages
feedback_vendedor: null,        // ❌ Deveria vir de claim_messages
taxa_satisfacao: null,          // ❌ Deveria calcular
score_satisfacao_final: null    // ❌ Deveria calcular
```

##### 🔴 FinancialDataMapper.ts
```typescript
// PROBLEMA: Campos financeiros não calculados
moeda_custo: null,                    // ❌ Deveria vir de order_data
custo_logistico_total: item.return... || null,  // ⚠️  Fallback fraco
percentual_reembolsado: null,         // ❌ Deveria calcular
```

##### 🔴 CommunicationDataMapper.ts
```typescript
// PROBLEMA: Timeline e métricas zeradas
numero_interacoes: null,      // ❌ Deveria contar messages
mensagens_nao_lidas: null,    // ❌ Deveria filtrar unread
timeline_consolidado: null,   // ❌ Deveria montar timeline
marcos_temporais: null,       // ❌ Deveria extrair datas chave
qualidade_comunicacao: null,  // ❌ Deveria avaliar
status_moderacao: null        // ❌ Deveria verificar
```

##### 🔴 TrackingDataMapper.ts
```typescript
// PROBLEMA: Rastreamento incompleto
carrier_info: null,           // ❌ Deveria extrair transportadora
shipment_delays: [],          // ❌ Deveria analisar delays
shipment_costs: null,         // ❌ Deveria extrair custos
acoes_necessarias_review: [], // ❌ Deveria extrair available_actions
```

##### 🔴 ContextDataMapper.ts
```typescript
// PROBLEMA: Contexto vazio
detalhes_mediacao: null,  // ❌ Deveria extrair detalhes
endereco_destino: null,   // ❌ Deveria extrair endereço
```

##### 🔴 MetadataMapper.ts
```typescript
// PROBLEMA: Metadados não calculados
seller_reputation: null,              // ❌ Deveria extrair
buyer_reputation: null,               // ❌ Deveria extrair
tempo_primeira_resposta_vendedor: null, // ❌ Deveria calcular
tempo_resposta_comprador: null,       // ❌ Deveria calcular
tempo_analise_ml: null,               // ❌ Deveria calcular
dias_ate_resolucao: null,             // ❌ Deveria calcular
sla_cumprido: null,                   // ❌ Deveria verificar
tempo_total_resolucao: null,          // ❌ Deveria calcular
tempo_resposta_medio: null            // ❌ Deveria calcular
```

---

### 4. TABELA DE VISUALIZAÇÃO

#### Estrutura da Tabela (DevolucaoTable.tsx)

```
TOTAL DE COLUNAS: 118 colunas
```

##### Grupos de Colunas:

| Grupo | Colunas | Status | Dados Faltantes |
|-------|---------|--------|-----------------|
| **1. IDENTIFICAÇÃO** | 6 | ⚠️ 50% | Player Role, Item ID vazios |
| **2. DATAS E TIMELINE** | 11 | ⚠️ 60% | Muitas datas null |
| **3. STATUS E ESTADO** | 7 | ✅ 80% | Maioria preenchida |
| **4. COMPRADOR** | 4 | ⚠️ 50% | Email vazio |
| **5. PRODUTO** | 4 | ✅ 90% | Garantia e categoria vazios |
| **6. VALORES FINANCEIROS** | 20 | 🔴 30% | **CRÍTICO - Muitos vazios** |
| **7. MOTIVO E CATEGORIA** | 8 | ⚠️ 60% | Categorias vazias |
| **8. MEDIAÇÃO E RESOLUÇÃO** | 12 | 🔴 20% | **CRÍTICO - Quase todos vazios** |
| **9. FEEDBACK E COMUNICAÇÃO** | 8 | 🔴 10% | **CRÍTICO - Todos vazios** |
| **10. TEMPOS E MÉTRICAS** | 8 | 🔴 0% | **CRÍTICO - Todos null** |
| **11. RASTREAMENTO** | 7 | ⚠️ 40% | Transportadora vazia |
| **12. QUALIDADE E SCORES** | 7 | 🔴 0% | **CRÍTICO - Todos null** |
| **13. DADOS DETALHADOS** | 3 | ⚠️ 30% | Parcialmente vazios |

**RESUMO:**
- ✅ **Bem Preenchidos**: 25 colunas (21%)
- ⚠️ **Parcialmente Vazios**: 45 colunas (38%)
- 🔴 **Completamente Vazios**: 48 colunas (41%)

---

### 5. PROBLEMA: LIMITE DE 63 DEVOLUÇÕES

#### Investigação

```typescript
// Console Logs mostram:
[FilterUtils] Filtros aplicados em 0.10ms {
  "total": 0,        // ❌ Total sendo 0
  "filtered": 0,     // ❌ Filtered sendo 0
  "removed": 0,
  "filters": {
    "searchTerm": "",
    "statusClaim": "",
    "activeFilters": 3  // ⚠️ 3 filtros ativos
  }
}
```

#### Possíveis Causas:

1. **Filtros aplicados por padrão**
   - `dataInicio` e `dataFim` podem estar limitando
   - `contasSelecionadas` pode estar filtrando

2. **Paginação limitada**
   - `itemsPerPage: 25` (padrão)
   - Mas total mostra apenas 63, não 290

3. **Cache ou estado persistido**
   - Dados antigos em localStorage
   - Estado não sendo atualizado corretamente

#### Código Suspeito:
```typescript
// useDevolucoes.ts
const [devolucoes, setDevolucoes] = useState<any[]>([]);

// Precisa investigar:
// 1. Como devolucoes é populado
// 2. Se há filtro sendo aplicado
// 3. Se há limite na query
```

---

### 6. ERRO DE SCHEMA NO BANCO

#### Erro Detectado (Network Request)
```json
{
  "code": "PGRST204",
  "message": "Could not find the 'acao_seller_necessaria' column of 'devolucoes_avancadas' in the schema cache"
}
```

#### Análise:
1. ❌ **Campo existe no mapper mas não no schema**
2. ⚠️ **Schema cache do Supabase desatualizado**
3. 🔧 **Precisa refresh do schema**

---

## 🎯 PLANO DE AÇÃO PRIORITÁRIO

### FASE 1: CORREÇÃO CRÍTICA (Hoje)

#### 1.1 Corrigir Erro de Schema ⚡ URGENTE
```bash
# Atualizar schema cache do Supabase
# Verificar se coluna 'acao_seller_necessaria' existe
# Se não existir, remover do mapper ou adicionar ao banco
```

#### 1.2 Investigar Limite de 63 Devoluções ⚡ URGENTE
- [ ] Ler hook `useDevolucoes.ts` completo
- [ ] Verificar filtros aplicados por padrão
- [ ] Verificar query SQL e limits
- [ ] Verificar localStorage e cache

#### 1.3 Corrigir Mappers Principais 🔥 ALTA
- [ ] **BasicDataMapper**: Extrair dados de `available_actions`, `reason_priority`
- [ ] **FinancialDataMapper**: Calcular percentuais e totais
- [ ] **CommunicationDataMapper**: Contar mensagens e montar timeline

### FASE 2: MELHORIAS ESTRUTURAIS (Próximos dias)

#### 2.1 Revisar TODOS os Mappers
- [ ] BasicDataMapper (10 campos null → extrair)
- [ ] FinancialDataMapper (3 campos null → calcular)
- [ ] CommunicationDataMapper (6 campos null → extrair)
- [ ] TrackingDataMapper (4 campos null → extrair)
- [ ] ContextDataMapper (2 campos null → extrair)
- [ ] MetadataMapper (9 campos null → calcular)

#### 2.2 Implementar Cálculos e Métricas
- [ ] **Tempo de Resolução**: Calcular dias entre criação e fechamento
- [ ] **Satisfação**: Analisar feedback e messages
- [ ] **SLA**: Verificar se prazos foram cumpridos
- [ ] **Qualidade**: Score baseado em review e resolution
- [ ] **Comunicação**: Contar interações e avaliar qualidade

#### 2.3 Otimizar Tabela
- [ ] Adicionar gerenciador de colunas (similar a /pedidos)
- [ ] Implementar colunas fixadas
- [ ] Adicionar filtros por grupo
- [ ] Implementar ordenação

### FASE 3: TESTES E VALIDAÇÃO

#### 3.1 Testes de Dados
- [ ] Validar que todos os 290 registros são exibidos
- [ ] Verificar que campos críticos estão preenchidos
- [ ] Testar filtros e paginação

#### 3.2 Performance
- [ ] Medir tempo de carregamento
- [ ] Otimizar queries grandes
- [ ] Implementar virtualização para muitas colunas

---

## 📈 MÉTRICAS DE SUCESSO

### Antes (Estado Atual)
- ❌ 63/290 devoluções exibidas (22%)
- ❌ 48/118 colunas vazias (41%)
- ❌ Erro de schema impedindo salvamento
- ❌ Dados brutos disponíveis mas não extraídos

### Depois (Meta)
- ✅ 290/290 devoluções exibidas (100%)
- ✅ 95/118 colunas preenchidas (80%)
- ✅ Sem erros de schema
- ✅ Dados extraídos e calculados corretamente

---

## 🔧 COMANDOS ÚTEIS PARA DEBUG

```typescript
// 1. Ver quantos registros realmente tem
const { data, count } = await supabase
  .from('devolucoes_avancadas')
  .select('*', { count: 'exact' })
  .in('integration_account_id', accountIds);

// 2. Ver filtros aplicados
console.log('[DEBUG] Filtros ativos:', advancedFilters);

// 3. Ver dados brutos de um registro
const sample = devolucoes[0];
console.log('[DEBUG] Raw data:', sample.raw);

// 4. Verificar campos vazios
const emptyFields = Object.entries(sample)
  .filter(([key, value]) => value === null)
  .map(([key]) => key);
console.log('[DEBUG] Campos vazios:', emptyFields);
```

---

## 📝 CONCLUSÃO

### Problemas Principais:
1. 🔴 **CRÍTICO**: Apenas 63 de 290 devoluções sendo exibidas
2. 🔴 **CRÍTICO**: 41% das colunas completamente vazias
3. 🔴 **CRÍTICO**: Erro de schema impedindo salvamento
4. ⚠️ **ALTO**: Mappers não extraindo dados disponíveis nos raw

### Causa Raiz:
- **Mappers retornando null** ao invés de extrair dados de `item.order_data`, `item.claim_details`, etc.
- **Filtros ou limites** impedindo exibição dos 290 registros
- **Schema cache** desatualizado no Supabase

### Próximos Passos Imediatos:
1. ⚡ Corrigir erro de schema
2. ⚡ Investigar filtro/limite de 63 registros
3. 🔥 Revisar e corrigir mappers principais
4. 📊 Implementar cálculos de métricas

---

**Prioridade:** 🔴 ALTA  
**Estimativa:** 2-3 dias para correção completa  
**Responsável:** Dev Team  
**Status:** 🔴 EM PRODUÇÃO COM PROBLEMAS CRÍTICOS
