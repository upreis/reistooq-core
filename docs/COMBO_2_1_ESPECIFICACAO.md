# 🚀 COMBO 2.1 - ESPECIFICAÇÃO COMPLETA

## Versão: 2.1
## Data: 2025-12-02
## Status: DOCUMENTADO - PRONTO PARA APLICAÇÃO

---

## 📋 RESUMO EXECUTIVO

O **Combo 2.1** é uma evolução do Combo 2 original, corrigindo o comportamento de busca automática que causava:
- Carregamento lento ao entrar na página
- Dependência excessiva da API do Mercado Livre
- UX ruim quando usuário apenas navegava entre páginas

### Diferença Principal: Combo 2 vs Combo 2.1

| Aspecto | Combo 2 (Antigo) | Combo 2.1 (Novo) |
|---------|------------------|------------------|
| Ao entrar na página | Busca automaticamente | Restaura cache instantaneamente |
| Primeira visita | Busca automática | Mostra vazio + botão "Aplicar Filtros" |
| Retorno à página | Busca novamente | Dados instantâneos do cache |
| Clique "Aplicar Filtros" | Opcional | OBRIGATÓRIO para buscar |
| Polling automático | Sempre ativo | Apenas após primeira busca manual |

---

## 🎯 PRINCÍPIOS DO COMBO 2.1

### 1. CACHE-FIRST (Cache Primeiro)
- Ao entrar na página, SEMPRE restaurar dados do localStorage/React Query cache
- NUNCA fazer chamada de API automaticamente
- Dados aparecem INSTANTANEAMENTE

### 2. BUSCA MANUAL EXPLÍCITA
- Usuário DEVE clicar "Aplicar Filtros" para buscar dados novos
- Exceção: primeira visita pode mostrar estado vazio ou dados do CRON

### 3. POLLING CONTROLADO
- Polling automático só ativa APÓS primeira busca manual bem-sucedida
- Polling é leve (5 min) e não bloqueia UI

### 4. PERSISTÊNCIA COMPLETA
- Filtros persistem em localStorage + URL
- Dados da última busca persistem em localStorage
- Ao retornar, estado é 100% restaurado

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ localStorage │◄──►│ React Query  │◄──►│    Page      │      │
│  │  (filtros +  │    │   Cache      │    │  Component   │      │
│  │   dados)     │    │ (staleTime   │    │              │      │
│  └──────────────┘    │  5min)       │    └──────────────┘      │
│                      └──────────────┘                           │
│                             │                                    │
│                             │ enabled: false (inicial)          │
│                             │ enabled: true (após clique)       │
│                             ▼                                    │
├─────────────────────────────────────────────────────────────────┤
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   ml_claims  │◄───│  CRON Job    │◄───│ Mercado Livre│      │
│  │   (cache)    │    │  (10 min)    │    │     API      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 ESTRUTURA DE ARQUIVOS ESPERADA

```
src/features/[feature]/
├── pages/
│   └── [Feature]Page.tsx           # Página principal
├── hooks/
│   ├── use[Feature]FiltersUnified.ts    # Filtros + URL sync
│   ├── use[Feature]ColumnManager.ts     # Gerenciamento de colunas
│   ├── use[Feature]Storage.ts           # Análise local (status)
│   └── use[Feature]Cache.ts             # Cache localStorage (NOVO)
├── components/
│   ├── [Feature]FilterBar.tsx      # Barra de filtros
│   ├── [Feature]Table.tsx          # Tabela de dados
│   └── [Feature]Resumo.tsx         # Cards de resumo
└── config/
    └── columns.ts                  # Definição de colunas
```

---

## 🔧 IMPLEMENTAÇÃO DO HOOK DE CACHE LOCAL

### Arquivo: `use[Feature]LocalCache.ts`

```typescript
/**
 * 🚀 COMBO 2.1 - HOOK DE CACHE LOCAL
 * Gerencia persistência de dados no localStorage para restauração instantânea
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  filters: {
    accounts: string[];
    periodo: string;
    dateFrom: string;
    dateTo: string;
  };
}

const CACHE_KEY = '[FEATURE]_LOCAL_CACHE_V1';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export function use[Feature]LocalCache() {
  // Restaurar cache do localStorage no mount
  const [cachedData, setCachedData] = useState<CacheEntry<any> | null>(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored) as CacheEntry<any>;
      const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return parsed;
    } catch {
      return null;
    }
  });

  // Salvar dados no cache
  const saveToCache = useCallback((data: any[], filters: CacheEntry<any>['filters']) => {
    const entry: CacheEntry<any> = {
      data,
      timestamp: Date.now(),
      filters
    };
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
      setCachedData(entry);
    } catch (e) {
      console.warn('Erro ao salvar cache:', e);
    }
  }, []);

  // Limpar cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setCachedData(null);
  }, []);

  // Verificar se cache é válido para os filtros atuais
  const isCacheValidForFilters = useCallback((filters: CacheEntry<any>['filters']) => {
    if (!cachedData) return false;
    
    const sameAccounts = 
      cachedData.filters.accounts.sort().join(',') === filters.accounts.sort().join(',');
    const samePeriodo = cachedData.filters.periodo === filters.periodo;
    
    return sameAccounts && samePeriodo;
  }, [cachedData]);

  return {
    cachedData: cachedData?.data || null,
    cachedFilters: cachedData?.filters || null,
    cacheTimestamp: cachedData?.timestamp || null,
    saveToCache,
    clearCache,
    isCacheValidForFilters,
    hasCachedData: !!cachedData?.data?.length
  };
}
```

---

## 🔧 PADRÃO DO HOOK DE DADOS (useQuery)

### Configuração CORRETA do useQuery para Combo 2.1:

```typescript
// ❌ ERRADO - Combo 2 antigo (busca automática)
const { data } = useQuery({
  queryKey: ['claims', accounts, periodo],
  queryFn: fetchClaims,
  enabled: accounts.length > 0  // Busca automática quando há contas
});

// ✅ CORRETO - Combo 2.1 (busca manual)
const [shouldFetch, setShouldFetch] = useState(false);

const { data, refetch } = useQuery({
  queryKey: ['claims', accounts, periodo],
  queryFn: fetchClaims,
  enabled: shouldFetch && accounts.length > 0,  // SÓ busca após clique
  staleTime: 5 * 60 * 1000,     // 5 minutos
  gcTime: 15 * 60 * 1000,       // 15 minutos
  refetchOnWindowFocus: false,  // Não buscar ao focar
  refetchInterval: shouldFetch ? 5 * 60 * 1000 : false  // Polling só após busca
});

// Handler do botão "Aplicar Filtros"
const handleBuscar = () => {
  setShouldFetch(true);
  // Se já foi buscado antes, invalidar para forçar nova busca
  if (data) {
    queryClient.invalidateQueries({ queryKey: ['claims'] });
  }
};
```

---

## 📋 FLUXO DE USUÁRIO ESPERADO

### Cenário 1: Primeira visita à página
```
1. Usuário acessa /reclamacoes
2. Sistema restaura filtros do localStorage (se existir)
3. Sistema verifica cache local de dados
4. SE cache válido: exibe dados instantaneamente
5. SE sem cache: exibe estado vazio com botão "Aplicar Filtros"
6. Usuário clica "Aplicar Filtros"
7. Sistema busca dados da API/cache Supabase
8. Sistema salva dados no localStorage
9. Polling automático ativa (5 min)
```

### Cenário 2: Retorno à página (navegou para outra e voltou)
```
1. Usuário retorna à /reclamacoes
2. Sistema restaura filtros do localStorage
3. Sistema restaura dados do cache local
4. INSTANTÂNEO: lista aparece sem loading
5. Em background: valida se cache ainda é válido
6. SE válido: mantém dados
7. SE expirado: mostra badge "Dados podem estar desatualizados"
```

### Cenário 3: Mudança de filtros
```
1. Usuário muda período de 7 para 60 dias
2. Sistema verifica se tem cache para esse novo filtro
3. SE tem cache válido: exibe instantaneamente
4. SE não tem: aguarda clique em "Aplicar Filtros"
5. Usuário clica "Aplicar Filtros"
6. Sistema busca com novos filtros
7. Sistema salva novo cache
```

---

## 🔍 PROCESSO DE APLICAÇÃO EM PÁGINAS

### PASSO 1: ANÁLISE DA PÁGINA

Antes de aplicar Combo 2.1, SEMPRE fazer auditoria:

```markdown
## Checklist de Análise - Página: [NOME]

### 1. Estado Atual
- [ ] Qual hook de dados usa? (useQuery, useState+fetch, custom hook)
- [ ] Busca automática ao entrar? (SIM/NÃO)
- [ ] Tem cache localStorage? (SIM/NÃO)
- [ ] Tem sincronização de filtros com URL? (SIM/NÃO)
- [ ] Tem polling automático? (SIM/NÃO)

### 2. Componentes Existentes
- [ ] FilterBar implementado? (SIM/NÃO)
- [ ] Botão "Aplicar Filtros" existe? (SIM/NÃO)
- [ ] Table com paginação? (SIM/NÃO)
- [ ] Column Manager? (SIM/NÃO)

### 3. Fonte de Dados
- [ ] Usa ml_claims (cache CRON)? (SIM/NÃO)
- [ ] Chama API diretamente? (SIM/NÃO)
- [ ] Tem fallback implementado? (SIM/NÃO)

### 4. Decisão
- [ ] ADEQUAR: Ajustar código existente
- [ ] CRIAR DO ZERO: Arquitetura incompatível
```

### PASSO 2: PLANEJAMENTO

**REGRA OBRIGATÓRIA:** Após implementar CADA fase, a AI DEVE:
1. ✅ Auditar o código aplicado
2. ✅ Verificar erros de sintaxe/lógica
3. ✅ Testar edge cases
4. ✅ Só então informar que fase está completa

Criar plano em fases:

```markdown
## Plano de Adequação - Página: [NOME]

### FASE 1: Cache Local (sem quebrar busca)
- Criar hook use[Feature]LocalCache.ts
- Integrar restauração no mount da página
- Testar que dados aparecem do cache

### FASE 2: Controle de Busca Manual
- Adicionar estado shouldFetch
- Modificar enabled do useQuery
- Conectar ao botão "Aplicar Filtros"
- Testar que não busca automaticamente

### FASE 3: Persistência de Dados
- Salvar dados após busca bem-sucedida
- Validar cache por filtros
- Implementar TTL do cache

### FASE 4: Validação Final
- Testar fluxo completo
- Verificar que funcionalidades existentes não quebraram
- Confirmar UX esperada
```

---

## ⚠️ PONTOS CRÍTICOS

### O QUE NÃO FAZER
1. ❌ Remover busca existente sem ter cache implementado
2. ❌ Mudar enabled para false sem ter dados para exibir
3. ❌ Quebrar mapeamento de colunas existente
4. ❌ Alterar estrutura de dados esperada pela tabela

### O QUE SEMPRE FAZER
1. ✅ Testar que página carrega sem erros
2. ✅ Verificar que filtros funcionam
3. ✅ Confirmar que busca manual funciona
4. ✅ Validar que dados persistem após navegação

---

## 📊 PÁGINAS A APLICAR

| Página | Status | Prioridade |
|--------|--------|------------|
| /reclamacoes | ⚠️ Combo 2 (busca automática) | ALTA |
| /devolucoesdevenda | ⚠️ Combo 2 (busca automática) | ALTA |
| /vendas-online | 🔍 Analisar | MÉDIA |
| /pedidos | 🔍 Analisar | BAIXA |

---

## 🎯 COMANDO PARA AI

```
Analise a página [NOME_DA_PÁGINA] seguindo o processo do Combo 2.1:

1. AUDITORIA: Verifique o estado atual conforme checklist
2. DIAGNÓSTICO: Identifique o que precisa mudar
3. PLANEJAMENTO: Crie plano em fases sem quebrar funcionalidades
4. DECISÃO: ADEQUAR existente ou CRIAR DO ZERO?
5. AGUARDAR: Peça aprovação antes de implementar

NÃO implemente nada sem mostrar o plano primeiro.
```

---

## 📝 NOTAS DE VERSÃO

### v2.1.0 (2025-12-02)
- Documentação inicial
- Definição de padrões
- Processo de aplicação estruturado

---

*Documento mantido por: Sistema Reistoq*
*Última atualização: 2025-12-02*
