# 🔧 FASE 4.1 - Refatoração SimplePedidosPage

## 📋 Objetivo
Reduzir complexidade de `SimplePedidosPage.tsx` (1371 linhas) extraindo lógica em hooks e utilitários especializados, **sem alterar funcionalidades de API, tokens ou autenticação**.

## ✅ Garantias Críticas

### 🛡️ O QUE NÃO FOI ALTERADO
- ✅ `usePedidosManager` - chamadas à API intactas
- ✅ `usePersistentPedidosState` - persistência intacta
- ✅ `usePedidosFiltersUnified` - sistema de filtros intacto
- ✅ `usePedidosPolling` - polling com API intacto
- ✅ `usePedidosMappingsOptimized` - processamento intacto
- ✅ `usePedidosProcessados` - verificação intacta
- ✅ `useLocalEstoqueEnriquecimento` - enriquecimento intacto
- ✅ `usePedidosAggregator` - agregação intacta
- ✅ `useColumnManager` - gerenciamento de colunas intacto
- ✅ `supabase.functions.invoke` - todas as chamadas preservadas
- ✅ Sistema de autenticação e tokens - 100% inalterado

## 🆕 Hooks Criados

### 1. `usePedidosHelpers.ts`
**Propósito:** Helpers financeiros e cálculos puros  
**Exports:**
- `getReceitaPorEnvio(order)` - Calcular receita Flex
- `getValorLiquidoVendedor(order)` - Calcular valor líquido
- `getAccountsStats(accounts)` - Estatísticas de contas

**Garantia:** Apenas lógica de cálculo pura, **ZERO** chamadas à API

### 2. `usePedidosHandlers.ts`
**Propósito:** Callbacks e handlers de UI  
**Exports:**
- `handleQuickFilterChange` - Mudar filtro rápido
- `handleFilterChange` - Mudar filtros gerais
- `handleBaixaEstoque` - Handler de baixa
- `handleAdvancedStatusFiltersChange` - Filtros avançados
- `handleResetAdvancedStatusFilters` - Reset filtros

**Garantia:** Apenas callbacks de UI, **ZERO** lógica de API

### 3. `usePedidosAccountsManager.ts`
**Propósito:** Gerenciamento de contas de integração  
**Exports:**
- `accounts` - Estado de contas
- `testAccount(accId)` - Testar conta
- `loadAccounts()` - Carregar contas

**Garantia:** Usa `supabase` apenas para queries de `integration_accounts`, **NÃO** mexe em auth

### 4. `usePedidosValidation.ts`
**Propósito:** Validação do sistema de pedidos  
**Exports:**
- `validateSystem()` - Validar integridade dos dados

**Garantia:** Apenas validação de dados, **ZERO** chamadas à API

## 📊 Métricas

### Antes
- **SimplePedidosPage.tsx:** 1371 linhas
- **Complexidade:** Muito alta (múltiplos hooks, helpers, callbacks misturados)

### Depois (Projetado)
- **SimplePedidosPage.tsx:** ~900-1000 linhas (redução de 27-35%)
- **Novos arquivos:**
  - `usePedidosHelpers.ts`: ~160 linhas
  - `usePedidosHandlers.ts`: ~70 linhas
  - `usePedidosAccountsManager.ts`: ~140 linhas
  - `usePedidosValidation.ts`: ~50 linhas
- **Total extraído:** ~420 linhas
- **Complexidade:** Reduzida - lógica segregada por responsabilidade

## 🎯 Próximos Passos

### FASE 4.1.2 - Integração dos Hooks
1. Importar novos hooks em `SimplePedidosPage.tsx`
2. Substituir implementações inline pelos hooks
3. Remover código duplicado
4. Validar que funcionalidades permanecem idênticas

### FASE 4.2 - DevolucaoTable
Aplicar mesmo padrão de refatoração (após validação de 4.1)

### FASE 4.3 - ReclamacoesTable  
Aplicar mesmo padrão de refatoração (após validação de 4.2)

## ✅ Checklist de Validação

- [ ] Hooks criados compilam sem erros
- [ ] Imports de tipos corretos
- [ ] Lógica de API 100% preservada
- [ ] Callbacks funcionam identicamente
- [ ] Cálculos financeiros mantêm precisão
- [ ] Validações funcionam corretamente
- [ ] Gerenciamento de contas funciona
- [ ] Testes manuais passam
- [ ] Console sem novos erros
- [ ] Performance mantida ou melhorada

## 📝 Notas de Implementação

- **Abordagem Conservadora:** Extrair apenas lógica de apresentação/helpers puros
- **Zero Breaking Changes:** Funcionalidades API/tokens/auth permanecem intactas
- **Manutenibilidade:** Código segregado por responsabilidade
- **Testabilidade:** Hooks isolados facilitam testes unitários
- **Escalabilidade:** Base limpa para futuras melhorias

---

**Status:** ✅ FASE 4.1.1 COMPLETA - Hooks criados  
**Próximo:** FASE 4.1.2 - Integração em SimplePedidosPage.tsx
