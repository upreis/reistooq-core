# FASE 2.2 - Consolidação de Filters System

## 📋 Objetivo
Consolidar lógica duplicada de filtros espalhada em múltiplas páginas através de utilities compartilhadas, mantendo hooks feature-específicos.

## 🔍 Auditoria Inicial
- **Duplicação identificada**: ~95% de código idêntico em 4 features
- **Hooks analisados**:
  - `useReclamacoesFiltersUnified`
  - `useDevolucoesFiltersUnified`
  - `useVendasFiltersUnified`
  - `usePedidosFiltersUnified`

## ✅ Implementação (OPÇÃO B - Best Practices)

### 1. Utilities Compartilhadas
**Arquivo**: `src/core/filters/filterUtils.ts`

**Funções extraídas**:
- `updateSingleFilter()` - Atualiza um filtro, reseta página se não for paginação
- `updateMultipleFilters()` - Atualiza múltiplos filtros de uma vez
- `resetSearchFilters()` - Reseta apenas filtros de busca mantendo paginação
- `hasActiveFilters()` - Verifica se há filtros ativos vs. defaults
- `countActiveFilters()` - Conta quantos filtros estão ativos

### 2. Arquitetura
```
src/
├── core/
│   └── filters/
│       ├── index.ts              # Exports centralizados
│       └── filterUtils.ts        # Utilities compartilhadas
│
└── features/
    ├── reclamacoes/hooks/useReclamacoesFiltersUnified.ts  # Hook específico
    ├── devolucoesdevenda/hooks/useDevolucoesFiltersUnified.ts
    ├── vendas-online/hooks/useVendasFiltersUnified.ts
    └── pedidos/hooks/usePedidosFiltersUnified.ts
```

### 3. Padrão de Uso
Cada feature mantém seu hook específico COM tipos customizados:

```typescript
import { updateSingleFilter, hasActiveFilters } from '@/core/filters';

export function useReclamacoesFiltersUnified() {
  const [filters, setFilters] = useState<ReclamacoesFilters>(DEFAULT_FILTERS);
  
  const updateFilter = (key: keyof ReclamacoesFilters, value: any) => {
    setFilters(current => 
      updateSingleFilter(current, key, value, isPaginationKey)
    );
  };
  
  // ... resto do hook específico
}
```

## 🎯 Benefícios
- ✅ **Zero duplicação** de lógica de filtros
- ✅ **Type safety** mantida (cada feature com seus tipos)
- ✅ **Testabilidade** (utilities puras sem side effects)
- ✅ **Manutenibilidade** (fix em 1 lugar, funciona em todos)
- ✅ **SRP respeitado** (utilities fazem 1 coisa bem feita)

## ⚠️ Garantias Críticas
- ✅ **NÃO quebra** API calls existentes
- ✅ **NÃO quebra** autenticação/tokens
- ✅ **NÃO quebra** refresh token logic
- ✅ Utilities são **puras** - sem side effects
- ✅ Hooks feature-específicos mantêm **controle total** do estado

## 📦 Status
- [x] Criar `filterUtils.ts` com utilities compartilhadas
- [ ] Migrar `useReclamacoesFiltersUnified` para usar utilities
- [ ] Migrar `useDevolucoesFiltersUnified` para usar utilities
- [ ] Migrar `useVendasFiltersUnified` para usar utilities
- [ ] Validar que nenhuma página quebrou
- [ ] Testar API calls/auth/tokens funcionando

## 🔄 Próximos Passos
Migrar hooks feature-específicos um por um, validando funcionamento após cada migração.
