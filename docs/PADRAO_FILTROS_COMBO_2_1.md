# 📦 Padrão de Filtros Combo 2.1

## Resumo das Alterações Aplicadas em `/vendas-com-envio`

Este documento descreve o padrão de filtros implementado para ser replicado em `/reclamacoes` e `/devolucoesdevenda`.

---

## 1. Arquitetura de Hooks

### 1.1 Hook de Sincronização URL + localStorage
**Arquivo:** `useVendasComEnvioFiltersSync.ts`

```typescript
// Características principais:
- Prioriza URL params (permite compartilhar links)
- Fallback para localStorage (navegação interna)
- Converte datas para formato yyyy-MM-dd na URL
- Logs condicionais apenas em dev
```

**Funções principais:**
- `filtersToURLParams()` - Serializa filtros para URL
- `urlParamsToFilters()` - Deserializa URL para filtros
- `saveFiltersToStorage()` - Backup no localStorage
- `loadFiltersFromStorage()` - Restaura do localStorage

### 1.2 Hook Unificado de Filtros
**Arquivo:** `useVendasComEnvioFiltersUnified.ts`

```typescript
// Estados:
- draftFilters: filtros pendentes (editando)
- appliedFilters: filtros aplicados (ativos)
- isApplying: flag de loading durante aplicação

// Retorno do hook:
{
  filters: draftFilters,           // Para inputs
  appliedFilters,                  // Para queries
  updateFilter,                    // Atualiza draft
  updateDateRange,                 // Atualiza datas
  applyFilters,                    // Aplica manualmente
  cancelChanges,                   // Cancela edições
  clearFilters,                    // Limpa tudo
  changePage,                      // Navegação imediata
  changeItemsPerPage,              // Navegação imediata
  changeTab,                       // Navegação imediata
  hasPendingChanges,               // Flag: tem mudanças não aplicadas
  hasActiveFilters,                // Flag: tem filtros ativos
  activeFiltersCount,              // Contador
  needsManualApplication,          // = hasPendingChanges
  isApplying,                      // Flag: aplicando
  apiParams,                       // Params prontos para API
  defaultFilters,                  // Referência
}
```

---

## 2. Estrutura de Filtros (Types)

```typescript
interface VendasComEnvioFilters {
  startDate?: Date;                    // Data início (Date object)
  endDate?: Date;                      // Data fim (Date object)
  selectedAccounts: string[];          // IDs das contas ML
  shippingStatus: ShippingStatus | 'all';
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  activeTab: 'ativas' | 'historico';
}
```

**IMPORTANTE:** Usar `Date` objects, não `periodo: number`. O `SimplifiedPeriodFilter` gerencia as datas.

---

## 3. Defaults com Datas

```typescript
import { subDays, startOfDay, endOfDay } from 'date-fns';

const DEFAULT_FILTERS: VendasComEnvioFilters = {
  startDate: startOfDay(subDays(new Date(), 6)),  // 7 dias atrás
  endDate: endOfDay(new Date()),                   // Hoje fim do dia
  selectedAccounts: [],
  shippingStatus: 'all',
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 50,
  activeTab: 'ativas',
};
```

---

## 4. FilterBar com SimplifiedPeriodFilter

```typescript
import { SimplifiedPeriodFilter } from '@/components/filters/SimplifiedPeriodFilter';

interface FilterBarProps {
  // ... outros props
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
}

// No JSX:
<SimplifiedPeriodFilter
  startDate={startDate}
  endDate={endDate}
  onChange={onDateRangeChange}
/>
```

---

## 5. Conversão de Datas para API

No hook de data (`useVendasComEnvioData.ts`):

```typescript
import { formatInTimeZone } from 'date-fns-tz';

// CORRETO: Usar timezone São Paulo para evitar deslocamento de dia
const date_from = filters.startDate 
  ? formatInTimeZone(filters.startDate, 'America/Sao_Paulo', 'yyyy-MM-dd')
  : undefined;

const date_to = filters.endDate
  ? formatInTimeZone(filters.endDate, 'America/Sao_Paulo', 'yyyy-MM-dd')
  : undefined;
```

**⚠️ CRÍTICO:** NÃO usar `toISOString()` - causa deslocamento de timezone!

---

## 6. Serialização para localStorage

```typescript
// Serializar (Date → ISO string)
function serializeFilters(filters: Filters): string {
  return JSON.stringify({
    ...filters,
    startDate: filters.startDate?.toISOString() || null,
    endDate: filters.endDate?.toISOString() || null,
  });
}

// Deserializar (ISO string → Date)
function deserializeFilters(stored: string): Filters {
  const parsed = JSON.parse(stored);
  return {
    ...DEFAULT_FILTERS,
    ...parsed,
    startDate: parsed.startDate ? new Date(parsed.startDate) : DEFAULT_FILTERS.startDate,
    endDate: parsed.endDate ? new Date(parsed.endDate) : DEFAULT_FILTERS.endDate,
  };
}
```

---

## 7. Loading Indicator Padronizado

**Arquivo:** `VendasComEnvioLoadingIndicator.tsx`

```tsx
export const LoadingIndicator = ({ message = 'Buscando...' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[65px] h-[65px]">
        <span className="absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100 animate-loaderAnim" />
        <span className="absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100 animate-loaderAnim [animation-delay:-1.25s]" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
    </div>
  </div>
);
```

---

## 8. Integração na Página

```tsx
const {
  filters: pendingFilters,
  appliedFilters,
  updateFilter,
  updateDateRange,           // ← NOVO: para datas
  applyFilters,
  changePage,
  changeItemsPerPage,
  changeTab,
  hasPendingChanges,
  isApplying,
} = useFiltersUnified({
  onFiltersApply: (filters) => {
    setShouldFetch(true);
  },
  enableURLSync: true,
});

// No FilterBar:
<FilterBar
  startDate={pendingFilters.startDate}
  endDate={pendingFilters.endDate}
  onDateRangeChange={updateDateRange}
  // ... outros props
/>

// Loading:
{(isFetching || isApplying) && <LoadingIndicator />}
```

---

## 9. Checklist de Implementação

### Para `/reclamacoes`:
- [ ] Atualizar types para usar `startDate/endDate` ao invés de `periodo`
- [ ] Atualizar `useReclamacoesFiltersUnified` com `updateDateRange`
- [ ] Atualizar `useReclamacoesFiltersSync` para serializar datas
- [ ] Substituir Select de período por `SimplifiedPeriodFilter`
- [ ] Atualizar hook de data para usar `formatInTimeZone`
- [ ] Adicionar `LoadingIndicator` padronizado

### Para `/devolucoesdevenda`:
- [ ] Atualizar types para usar `startDate/endDate` ao invés de `periodo`
- [ ] Atualizar `useDevolucoesFiltersUnified` com `updateDateRange`
- [ ] Atualizar `useDevolucoesFiltersSync` para serializar datas
- [ ] Substituir Select de período por `SimplifiedPeriodFilter`
- [ ] Atualizar hook de data para usar `formatInTimeZone`
- [ ] Adicionar `LoadingIndicator` padronizado

---

## 10. Arquivos de Referência

| Componente | Arquivo em `/vendas-com-envio` |
|------------|-------------------------------|
| Types | `types/index.ts` |
| Hook Sync | `hooks/useVendasComEnvioFiltersSync.ts` |
| Hook Unified | `hooks/useVendasComEnvioFiltersUnified.ts` |
| FilterBar | `components/VendasComEnvioFilterBar.tsx` |
| Loading | `components/VendasComEnvioLoadingIndicator.tsx` |
| Page | `components/VendasComEnvioPage.tsx` |
| Data Hook | `hooks/useVendasComEnvioData.ts` |
| Store | `store/useVendasComEnvioStore.ts` |

---

## 11. Imports Necessários

```typescript
// date-fns
import { subDays, startOfDay, endOfDay, format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Componente de período
import { SimplifiedPeriodFilter } from '@/components/filters/SimplifiedPeriodFilter';
```

---

*Documentação criada em: 15/12/2024*
*Baseado na implementação de `/vendas-com-envio`*
