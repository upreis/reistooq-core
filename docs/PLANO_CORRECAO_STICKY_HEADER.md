# 📋 PLANO DE CORREÇÃO - STICKY HEADER (Tabela Devoluções)

## 🎯 Objetivo
Corrigir todos os problemas identificados no sticky header da tabela de devoluções, aplicando uma correção de cada vez.

---

## 🔴 FASE 1 - PROBLEMAS BLOQUEADORES (Aplicação quebrada)

### ✅ ETAPA 1.1: Corrigir import do React no useStickyHeader.ts

**Arquivo:** `src/hooks/useStickyHeader.ts`  
**Linha:** 1  
**Problema:** Import incorreto causa erro "Cannot read properties of null (reading 'useState')"

**Ação:**
```typescript
// ❌ ANTES (ERRADO)
import React, { useEffect, useRef, useState } from 'react';

// ✅ DEPOIS (CORRETO)
import { useEffect, useRef, useState } from 'react';
```

**Como testar:**
- Recarregar página /devolucoesdevenda
- Verificar se aplicação carrega sem erro de "Cannot read properties of null"
- Console não deve mostrar erros de React

**Status:** ⏳ Pendente

---

## 🔴 FASE 2 - PROBLEMAS CRÍTICOS (Funcionalidade quebrada)

### ✅ ETAPA 2.1: Corrigir dependência do useEffect

**Arquivo:** `src/hooks/useStickyHeader.ts`  
**Linha:** 28  
**Problema:** `[ref.current]` causa re-renders infinitos

**Ação:**
```typescript
// ❌ ANTES (ERRADO)
}, [ref.current]);

// ✅ DEPOIS (CORRETO)
}, [element]);
```

**Justificativa:** `element` é capturado dentro do useEffect e só muda quando componente monta/desmonta

**Como testar:**
- Rolar página /devolucoesdevenda para baixo
- Header deve ficar fixo no topo
- Abrir DevTools > Performance
- Verificar que não há re-renders infinitos

**Status:** ⏳ Pendente

---

### ✅ ETAPA 2.2: Trocar position: fixed por sticky nativo

**Arquivo:** `src/features/devolucao2025/components/Devolucao2025Table.tsx`  
**Linhas:** 104, 108  
**Problema:** `position: fixed` + scroll horizontal é incompatível, causa desalinhamento

**Ação:**
```typescript
// ❌ ANTES (ERRADO - abordagem complexa com fixed)
<TableHeader
  ref={headerRef}
  className={cn("bg-background", isSticky && "fixed z-50 shadow-md")}
  style={{
    top: isSticky ? 0 : undefined,
    left: isSticky ? 0 : undefined,
    right: isSticky ? 0 : undefined,
    width: isSticky ? tableContainerRef.current?.clientWidth : 'auto',
  }}
>

// ✅ DEPOIS (CORRETO - sticky nativo)
<TableHeader
  className={cn(
    "sticky top-0 z-[9999] bg-background",
    isSticky && "shadow-md"
  )}
>
```

**Benefícios:**
- ✅ Scroll horizontal funciona automaticamente
- ✅ Sem JavaScript para sincronizar scroll
- ✅ Performance nativa (GPU-accelerated)
- ✅ Código 70% mais simples

**Como testar:**
1. Rolar página /devolucoesdevenda verticalmente
   - Header deve ficar fixo no topo
   - Sombra deve aparecer quando sticky
2. Rolar horizontalmente
   - Header deve acompanhar scroll horizontal perfeitamente
   - Colunas devem permanecer alinhadas

**Status:** ⏳ Pendente

---

### ✅ ETAPA 2.3: Corrigir cálculo de width (se necessário)

**Arquivo:** `src/features/devolucao2025/components/Devolucao2025Table.tsx`  
**Linha:** 108  
**Problema:** Usa `clientWidth` ao invés de `scrollWidth`

**⚠️ NOTA:** Esta etapa pode ser **DESNECESSÁRIA** se ETAPA 2.2 (sticky nativo) funcionar perfeitamente.  
Testar ETAPA 2.2 primeiro. Se header desalinhar em scroll horizontal, aplicar esta correção.

**Ação (se necessário):**
```typescript
// ❌ ANTES
width: isSticky ? tableContainerRef.current?.clientWidth : 'auto',

// ✅ DEPOIS
width: isSticky ? tableContainerRef.current?.scrollWidth : 'auto',
```

**Como testar:**
- Rolar horizontalmente até o final da tabela
- Verificar se header cobre TODA a largura
- Colunas à direita devem ter cabeçalho visível

**Status:** ⏳ Pendente (aguardar ETAPA 2.2)

---

### ✅ ETAPA 2.4: Memoizar estrutura do cabeçalho

**Arquivo:** `src/features/devolucao2025/components/Devolucao2025Table.tsx`  
**Linhas:** 100-245  
**Problema:** Header completamente duplicado (170 linhas x 2 = 340 linhas)

**Ação:**
```typescript
// No início do componente, após hooks
const headerStructure = useMemo(() => (
  <>
    {isVisible('account_name') && (
      <TableHead className="text-xs font-semibold sticky left-0 z-10 bg-background">
        <div className="flex items-center gap-1 min-w-[120px]">
          <Building2 className="h-3 w-3" />
          Empresa
        </div>
      </TableHead>
    )}
    
    {isVisible('order_id') && (
      <TableHead className="text-xs font-semibold">
        <SortableHeader 
          label="Pedido" 
          icon={Package}
          sortKey="order_id"
          currentSort={sortConfig.key}
          currentDirection={sortConfig.direction}
          onSort={handleSort}
        />
      </TableHead>
    )}
    
    {/* ... resto das 65 colunas ... */}
  </>
), [visibleColumns, sortConfig, handleSort]); // Re-cria apenas quando necessário
```

**Depois substituir nos 2 lugares:**
```typescript
{/* Cabeçalho real */}
<TableHeader className={cn("sticky top-0 z-[9999] bg-background", isSticky && "shadow-md")}>
  <TableRow className="hover:bg-transparent">
    {headerStructure}
  </TableRow>
</TableHeader>

{/* Cabeçalho fantasma (se ainda necessário) */}
{isSticky && (
  <TableHeader className="invisible">
    <TableRow>
      {headerStructure}
    </TableRow>
  </TableHeader>
)}
```

**Benefícios:**
- ✅ Elimina 170 linhas duplicadas
- ✅ Manutenção em 1 único lugar
- ✅ Performance: React renderiza estrutura memoizada
- ✅ Zero risco de inconsistência entre headers

**Como testar:**
- Verificar visualmente que todas as colunas aparecem
- Ordenação deve funcionar normalmente
- Performance deve melhorar (abrir DevTools > Performance)

**Status:** ⏳ Pendente

---

## 🟡 FASE 3 - PROBLEMAS MÉDIOS (Melhorias de qualidade)

### ✅ ETAPA 3.1: Aumentar z-index do header

**Arquivo:** `src/features/devolucao2025/components/Devolucao2025Table.tsx`  
**Linha:** 104  
**Problema:** `z-50` pode conflitar com modals/dropdowns

**Ação:**
```typescript
// ❌ ANTES
className={cn("sticky top-0 z-50 bg-background", isSticky && "shadow-md")}

// ✅ DEPOIS
className={cn("sticky top-0 z-[9999] bg-background", isSticky && "shadow-md")}
```

**Como testar:**
- Abrir modal/dropdown com tabela rolada
- Header deve ficar ABAIXO de modals
- Header deve ficar ACIMA de conteúdo da tabela

**Status:** ⏳ Pendente

---

### ✅ ETAPA 3.2: Remover tableLayout: fixed

**Arquivo:** `src/features/devolucao2025/components/Devolucao2025Table.tsx`  
**Linha:** 99  
**Problema:** `tableLayout: 'fixed'` conflita com `min-w-max`

**Ação:**
```typescript
// ❌ ANTES
<Table className="min-w-max" style={{ tableLayout: 'fixed' }}>

// ✅ DEPOIS
<Table className="min-w-max">
```

**Como testar:**
- Verificar que colunas não truncam texto
- Larguras devem se ajustar ao conteúdo
- Scroll horizontal deve funcionar normalmente

**Status:** ⏳ Pendente

---

### ✅ ETAPA 3.3: Remover código de sincronização obsoleto

**Arquivo:** `src/features/devolucao2025/components/Devolucao2025Table.tsx`  
**Linhas:** 51-66  
**Problema:** Código comentado poluindo arquivo

**Ação:**
```typescript
// ❌ REMOVER COMPLETAMENTE
// Efeito para calcular a posição do topo do header
useEffect(() => {
  if (sentinelRef.current) {
    const sentinelRect = sentinelRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const topPosition = sentinelRect.top + scrollTop;
    setHeaderTop(topPosition);
  }
}, [visibleColumns, sentinelRef]);

// Efeito para sincronizar o scroll horizontal (REMOVIDO - não necessário sem larguras dinâmicas)
```

**Como testar:**
- Aplicação deve funcionar normalmente
- Não deve haver erros no console

**Status:** ⏳ Pendente

---

## 🟢 FASE 4 - MELHORIAS OPCIONAIS (Robustez)

### ✅ ETAPA 4.1: Adicionar try/catch no IntersectionObserver

**Arquivo:** `src/hooks/useStickyHeader.ts`  
**Linhas:** 6-26  
**Problema:** Observer pode falhar silenciosamente em browsers antigos

**Ação:**
```typescript
useEffect(() => {
  const element = ref.current;
  if (!element) return;

  try {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      {
        rootMargin: '-1px 0px 0px 0px',
        threshold: [0],
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  } catch (error) {
    console.error('[useStickyHeader] IntersectionObserver não suportado:', error);
    // Fallback: header sempre no modo normal (não sticky)
    setIsSticky(false);
  }
}, [element]);
```

**Como testar:**
- Funcionalidade deve continuar igual em browsers modernos
- Em browsers antigos, header funciona sem sticky (degradação graciosa)

**Status:** ⏳ Pendente

---

## 📊 CHECKLIST DE PROGRESSO

### 🔴 Fase 1 - Bloqueadores
- [ ] ETAPA 1.1: Corrigir import React

### 🔴 Fase 2 - Críticos
- [ ] ETAPA 2.1: Corrigir dependência useEffect
- [ ] ETAPA 2.2: Trocar fixed por sticky nativo
- [ ] ETAPA 2.3: Corrigir width (se necessário)
- [ ] ETAPA 2.4: Memoizar header

### 🟡 Fase 3 - Médios
- [ ] ETAPA 3.1: Aumentar z-index
- [ ] ETAPA 3.2: Remover tableLayout
- [ ] ETAPA 3.3: Limpar código obsoleto

### 🟢 Fase 4 - Opcionais
- [ ] ETAPA 4.1: Adicionar try/catch

---

## 🎯 CRITÉRIOS DE SUCESSO FINAL

Ao final de todas as etapas, a tabela de devoluções deve:

✅ **Funcionalidade:**
- Header fica fixo ao rolar página verticalmente
- Header acompanha scroll horizontal perfeitamente
- Todas as 65 colunas alinhadas corretamente
- Ordenação funciona normalmente

✅ **Performance:**
- Sem re-renders infinitos
- Scroll suave e responsivo
- Bundle JavaScript menor (eliminou 170 linhas duplicadas)

✅ **Qualidade de Código:**
- Sem duplicação de código
- Sem código comentado
- Sem warnings no console
- Manutenível (mudanças em 1 único lugar)

✅ **Robustez:**
- Funciona em todos os browsers modernos
- Degradação graciosa em browsers antigos
- Sem conflitos de z-index com modals

---

## 📝 NOTAS IMPORTANTES

1. **Aplicar UMA etapa de cada vez**
2. **Testar completamente antes de próxima etapa**
3. **Se algo quebrar, reverter e reportar problema**
4. **Marcar checkbox quando etapa concluída**
5. **ETAPA 2.3 pode ser pulada se ETAPA 2.2 resolver tudo**

---

**Última atualização:** 13/11/2025  
**Status:** Aguardando início da FASE 1
