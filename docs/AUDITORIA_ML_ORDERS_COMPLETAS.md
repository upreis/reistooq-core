# 🔍 AUDITORIA COMPLETA - PÁGINA /ml-orders-completas

**Data**: 2025-10-23  
**Página**: `/ml-orders-completas` (Devoluções do Mercado Livre)  
**Status**: ⚠️ **CRÍTICO - ERRO DE BANCO DE DADOS DETECTADO**

---

## 📋 SUMÁRIO EXECUTIVO

### ✅ Problemas Encontrados:

1. **🔴 CRÍTICO**: Coluna `anexos_ml` não existe na tabela `devolucoes_avancadas`
2. **⚠️ CONFLITO**: Sistema misto de filtros (antigo vs novo) causando confusão
3. **📊 COMPLEXIDADE**: Múltiplos layers de processamento de dados

---

## 🗂️ DEPENDÊNCIAS MAPEADAS

### 1️⃣ **EDGE FUNCTIONS**

#### **ml-api-direct** ⭐ (PRINCIPAL)
- **Localização**: `supabase/functions/ml-api-direct/index.ts`
- **Função**: Buscar claims/devoluções da API do Mercado Livre
- **Ações Suportadas**:
  - `get_claims_and_returns` - Busca paginada de devoluções
  - `get_reason_detail` - Detalhes de motivos de devolução
- **Filtros Aceitos**:
  ```typescript
  {
    periodoDias: number,        // ✅ NOVO SISTEMA (0 = todas)
    tipoData: 'date_created' | 'last_updated',
    status_claim: string,
    claim_type: string,
    stage: string,
    fulfilled: boolean,
    quantity_type: string,
    reason_id: string,
    resource: string
  }
  ```
- **Paginação**: Limit (max 100) + Offset
- **Timeout**: 2 minutos
- **Logs Recentes**: ✅ Funcionando (visto nos logs)

#### **integrations-get-secret** (AUXILIAR)
- **Função**: Obter tokens ML de forma segura
- **Chamado por**: `ml-api-direct`
- **Logs Recentes**: ✅ Funcionando

#### **auto-update-devolucoes** (BACKGROUND)
- **Função**: Atualização automática de devoluções
- **Status**: Não usado diretamente pela página

#### **sync-devolucoes-background** (BACKGROUND)
- **Função**: Sincronização em background
- **Status**: Usa sistema antigo (`date_from`)

---

### 2️⃣ **BANCO DE DADOS**

#### **Tabela: `devolucoes_avancadas`**
- **Total de Colunas**: 146 colunas
- **Colunas Principais**:
  - `id` (uuid, PK)
  - `order_id` (text)
  - `claim_id` (text)
  - `integration_account_id` (uuid)
  - `data_criacao_claim` (timestamp)
  - `status_devolucao` (text)
  - `valor_retido` (numeric)
  - ... (143 outras colunas)

#### **🔴 ERRO CRÍTICO IDENTIFICADO**:
```
Could not find the 'anexos_ml' column of 'devolucoes_avancadas' in the schema cache
```

**Análise**:
- O código tenta salvar dados em `anexos_ml` (linha 312 do `ml-api-direct`)
- A coluna NÃO EXISTE na tabela
- Causa: Migração de banco incompleta ou schema desatualizado

**Localização do Erro**:
- `src/features/devolucoes/hooks/useDevolucoesBusca.ts:301` (linha que salva)
- `supabase/functions/ml-api-direct/index.ts:312` (onde o campo é mapeado)

#### **Tabela: `integration_accounts`**
- Colunas usadas: `id`, `name`, `account_identifier`, `organization_id`, `is_active`, `provider`
- Filtro: `provider = 'mercadolivre'` AND `is_active = true`

---

### 3️⃣ **ARQUIVOS REACT/TYPESCRIPT**

#### **Página Principal**
```
src/pages/MLOrdersCompletas.tsx
```
- Busca contas ML
- Auto-seleciona contas ativas
- Renderiza `DevolucaoAvancadasTab`

#### **Componente Principal**
```
src/components/ml/DevolucaoAvancadasTab.tsx
```
- Hook `useDevolucoes` (estado unificado)
- Renderiza:
  - `DevolucaoStatsCards`
  - `FiltrosRapidos` ⭐
  - `DevolucaoFiltersUnified`
  - `DevolucaoTable`
  - `DevolucaoPagination`
  - `DevolucaoDetailsModal`

#### **Hooks Críticos**
```
src/features/devolucoes/hooks/useDevolucoes.ts
```
- Estado unificado de filtros
- Gerencia paginação
- Chama `useDevolucoesBusca`
- **🔴 CONFLITO**: Ainda verifica `dataInicio`/`dataFim` (linhas 167-168)

```typescript
// ❌ CÓDIGO CONFLITANTE ENCONTRADO (linha 166-172):
const hasFiltersApplied = React.useMemo(() => Boolean(
  advancedFilters.dataInicio ||   // ❌ SISTEMA ANTIGO
  advancedFilters.dataFim ||      // ❌ SISTEMA ANTIGO
  advancedFilters.searchTerm ||
  advancedFilters.statusClaim ||
  advancedFilters.tipoClaim
), [advancedFilters]);
```

```
src/features/devolucoes/hooks/useDevolucoesBusca.ts
```
- Busca dados da API ML
- Auto-paginação completa
- Enriquecimento de dados (reasons, reviews, etc)
- **🔴 ERRO**: Tenta salvar `anexos_ml` (linha 398-403)

#### **Cliente API**
```
src/features/devolucoes/utils/MLApiClient.ts
```
- ✅ CORRETO: Usa `periodoDias` e `tipoData`
- Funções:
  - `fetchClaimsAndReturns`
  - `fetchReasonDetail`
  - `fetchAllClaims`

#### **Componentes de Filtros**
```
src/components/ml/devolucao/FiltrosRapidos.tsx
```
- ✅ CORRETO: Usa apenas `periodoDias` e `tipoData`
- 6 filtros rápidos predefinidos
- Botão "Sem Filtro" (periodoDias: 0)

```
src/components/ml/devolucao/DevolucaoFiltersUnified.tsx
```
- Filtros avançados
- **Status**: Não verificado ainda (possível conflito)

---

## ⚠️ CONFLITOS E PROBLEMAS DETECTADOS

### 🔴 **1. ERRO DE BANCO DE DADOS**

**Problema**: Coluna `anexos_ml` não existe

**Impacto**: ❌ Salvar devoluções no banco FALHA

**Localização**:
- `ml-api-direct/index.ts:312` - mapeia `anexos_ml`
- `useDevolucoesBusca.ts:398-403` - tenta salvar no banco

**Solução**:
1. Adicionar coluna `anexos_ml` (tipo `jsonb`) na tabela `devolucoes_avancadas`
2. OU remover mapeamento de `anexos_ml` do código

---

### ⚠️ **2. CONFLITO DE FILTROS (SISTEMA MISTO)**

**Problema**: Código verifica `dataInicio`/`dataFim` (antigo) E `periodoDias` (novo)

**Locais do Conflito**:

1. **`DevolucaoAvancadasTab.tsx` (linhas 166-172)**:
```typescript
const hasFiltersApplied = React.useMemo(() => Boolean(
  advancedFilters.dataInicio ||   // ❌ ANTIGO
  advancedFilters.dataFim ||      // ❌ ANTIGO
  advancedFilters.searchTerm ||
  advancedFilters.statusClaim ||
  advancedFilters.tipoClaim
), [advancedFilters]);
```

2. **Interface `DevolucaoAdvancedFilters`** (`useDevolucoes.ts:27-79`):
```typescript
export interface DevolucaoAdvancedFilters extends DevolucaoBuscaFilters {
  // 📅 DATAS - NOVO SISTEMA
  dataInicio: string;       // ❌ AINDA EXISTE
  dataFim: string;          // ❌ AINDA EXISTE
  periodoDias: number;      // ✅ NOVO
  tipoData: 'date_created' | 'last_updated';  // ✅ NOVO
}
```

**Impacto**: 
- Confusão na lógica de filtros
- Possível comportamento inconsistente
- UI pode mostrar estado errado ("Nenhum filtro aplicado" vs "Filtros ativos")

**Solução**:
1. ✅ Remover `dataInicio` e `dataFim` da interface
2. ✅ Atualizar `hasFiltersApplied` para usar apenas `periodoDias`

---

### 📊 **3. COMPLEXIDADE DE PROCESSAMENTO**

**Fluxo Atual**:
```
User Click "Buscar"
  ↓
useDevolucoes.buscarComFiltros()
  ↓
useDevolucoesBusca.buscarDaAPI()
  ↓
MLApiClient.fetchClaimsAndReturns()
  ↓
Edge Function: ml-api-direct
  ↓
integrations-get-secret (obter token)
  ↓
API Mercado Livre
  ↓
Processar + Enriquecer dados
  ↓
Salvar no banco (devolucoes_avancadas) ❌ FALHA
  ↓
Retornar dados para UI
```

**Problemas**:
- Auto-paginação pode ser lenta (múltiplas chamadas)
- Enriquecimento de dados (reasons, reviews) adiciona latência
- Falha no salvamento não impede exibição (dados temporários)

---

## 🛠️ CORREÇÕES NECESSÁRIAS

### **PRIORIDADE MÁXIMA** 🔴

#### **1. Corrigir Erro de Banco de Dados**

**Opção A**: Adicionar coluna `anexos_ml`
```sql
ALTER TABLE public.devolucoes_avancadas 
ADD COLUMN IF NOT EXISTS anexos_ml jsonb;
```

**Opção B**: Remover mapeamento do código
```typescript
// Em ml-api-direct/index.ts linha 312
// anexos_ml: devolucao.anexos_ml,  // ❌ REMOVER
```

---

### **PRIORIDADE ALTA** ⚠️

#### **2. Remover Filtros Antigos**

**Arquivo**: `src/features/devolucoes/hooks/useDevolucoes.ts`

**Mudanças**:
```typescript
// ❌ REMOVER da interface (linha 35-36):
export interface DevolucaoAdvancedFilters extends DevolucaoBuscaFilters {
  // dataInicio: string;  // ❌ DELETAR
  // dataFim: string;     // ❌ DELETAR
  periodoDias: number;     // ✅ MANTER
  tipoData: 'date_created' | 'last_updated';  // ✅ MANTER
}
```

**Arquivo**: `src/components/ml/DevolucaoAvancadasTab.tsx`

**Mudanças**:
```typescript
// ❌ SUBSTITUIR (linha 166-172):
const hasFiltersApplied = React.useMemo(() => Boolean(
  // advancedFilters.dataInicio ||   // ❌ DELETAR
  // advancedFilters.dataFim ||      // ❌ DELETAR
  (advancedFilters.periodoDias && advancedFilters.periodoDias > 0) ||  // ✅ NOVO
  advancedFilters.searchTerm ||
  advancedFilters.statusClaim ||
  advancedFilters.tipoClaim
), [advancedFilters]);
```

---

## 📊 MAPA DE DEPENDÊNCIAS VISUAL

```
┌─────────────────────────────────────────┐
│  src/pages/MLOrdersCompletas.tsx        │
│  (Página Principal)                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  src/components/ml/                      │
│  DevolucaoAvancadasTab.tsx               │
│  (Componente Principal)                  │
└─────┬───────────────────────────────────┘
      │
      ├──▶ FiltrosRapidos.tsx (✅ Novo sistema)
      │
      ├──▶ DevolucaoFiltersUnified.tsx (⚠️ Verificar)
      │
      ├──▶ useDevolucoes.ts (⚠️ Conflito de filtros)
      │    │
      │    └──▶ useDevolucoesBusca.ts (🔴 Erro de banco)
      │         │
      │         └──▶ MLApiClient.ts (✅ Correto)
      │              │
      │              └──▶ Edge Function: ml-api-direct
      │                   │
      │                   ├──▶ integrations-get-secret
      │                   │
      │                   └──▶ API Mercado Livre
      │                        │
      │                        └──▶ Banco: devolucoes_avancadas
      │                             (🔴 Coluna anexos_ml não existe)
      │
      └──▶ DevolucaoTable.tsx
           DevolucaoPagination.tsx
           DevolucaoDetailsModal.tsx
```

---

## ✅ CHECKLIST DE CORREÇÕES

### **Imediatas** (Bloqueia funcionalidade)

- [ ] **1. Corrigir erro `anexos_ml`** (escolher Opção A ou B)
- [ ] **2. Testar salvamento no banco** após correção
- [ ] **3. Verificar logs de erro** desaparecem

### **Curto Prazo** (Melhora consistência)

- [ ] **4. Remover `dataInicio` e `dataFim`** da interface
- [ ] **5. Atualizar `hasFiltersApplied`** para usar `periodoDias`
- [ ] **6. Verificar `DevolucaoFiltersUnified.tsx`** se usa sistema antigo

### **Médio Prazo** (Otimização)

- [ ] **7. Adicionar cache de dados** entre buscas
- [ ] **8. Otimizar enriquecimento** de reasons (já tem cache)
- [ ] **9. Adicionar loading states** mais granulares

---

## 🎯 RECOMENDAÇÕES FINAIS

### **✅ O que está funcionando bem**:
1. FiltrosRapidos usa sistema novo (`periodoDias`)
2. MLApiClient está correto
3. Auto-paginação funciona
4. Cache de reasons está implementado
5. Edge function está estável

### **⚠️ O que precisa atenção**:
1. **CRÍTICO**: Erro de banco bloqueia salvamento
2. **IMPORTANTE**: Sistema misto de filtros causa confusão
3. **ATENÇÃO**: Verificar outros componentes de filtro

### **🔮 Próximos passos sugeridos**:
1. Corrigir erro de banco (URGENTE)
2. Limpar código de filtros antigos
3. Adicionar testes unitários para filtros
4. Documentar schema completo da tabela
5. Melhorar tratamento de erros na UI

---

**Auditoria realizada por**: Lovable AI  
**Ferramentas utilizadas**: lov-view, lov-search, supabase-read-query, edge-function-logs
