# 📄 Sistema de Rodapé Fixado com Paginação

## 📋 Visão Geral

Sistema completo de paginação com rodapé fixado implementado na página `/reclamacoes`. Este documento serve como referência para replicar o mesmo padrão em outras páginas.

---

## 🏗️ Arquitetura do Sistema

### 1️⃣ Componente de Paginação Reutilizável

**Localização:** `src/features/reclamacoes/components/ReclamacoesPagination.tsx`

#### Props Interface
```typescript
export interface ReclamacoesPaginationProps {
  totalItems: number;              // Total de itens (ex: 105 reclamações)
  itemsPerPage: number;            // Itens por página (25, 50, 100)
  currentPage: number;             // Página atual
  onPageChange: (page: number) => void;           // Callback ao mudar página
  onItemsPerPageChange: (items: number) => void;  // Callback ao mudar itens/página
  className?: string;              // Classes CSS adicionais
  showFirstLastButtons?: boolean;  // Mostrar botões primeira/última (padrão: true)
  pageButtonLimit?: number;        // Quantos botões de página mostrar (padrão: 5)
}
```

#### Recursos do Componente
- ✅ Navegação completa: primeira, anterior, números de páginas, próxima, última
- ✅ Contador de itens: "Mostrando 1 a 50 de 105 reclamações"
- ✅ Seletor de itens por página: 25, 50, 100
- ✅ Layout responsivo com informações à esquerda e navegação centralizada
- ✅ Reticências (...) quando há muitas páginas
- ✅ Validação automática de página atual
- ✅ Reset para página 1 ao alterar itens por página
- ✅ Acessibilidade completa (ARIA labels)

---

## 🎨 Layout do Rodapé

### Estrutura Visual
```
┌─────────────────────────────────────────────────────────────────────┐
│  Mostrando 1 a 50 de 105 reclamações                                │
│  Itens por página: [50 ▼]     ⏮️ ◀️ 1 2 3 4 5 ▶️ ⏭️                  │
│  └─ Esquerda ─────────────┘    └─── Centralizado ───┘               │
└─────────────────────────────────────────────────────────────────────┘
```

### CSS do Container do Rodapé
```tsx
<div 
  className={`fixed bottom-0 right-0 bg-background border-t shadow-lg z-40 transition-all duration-300 ${
    isSidebarCollapsed ? 'md:left-[72px]' : 'md:left-72'
  } left-0`}
>
```

**Características:**
- `fixed bottom-0`: Fixado no rodapé da página
- `right-0 left-0`: Largura total
- `md:left-[72px]` ou `md:left-72`: Ajusta com sidebar retraído/expandido
- `bg-background border-t shadow-lg`: Estilo visual
- `z-40`: Z-index alto para ficar acima do conteúdo
- `transition-all duration-300`: Animação suave ao retrair sidebar

---

## 🔧 Implementação Passo a Passo

### PASSO 1: Estados Necessários na Página

```typescript
// Estados de paginação
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(50);

// Contexto da sidebar (para ajustar largura do rodapé)
const { isSidebarCollapsed } = useSidebarUI();
```

### PASSO 2: Lógica de Paginação

```typescript
// Calcular total de páginas
const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

// Garantir que currentPage está válida
useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

// Paginar dados
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedItems = items.slice(startIndex, endIndex);
```

### PASSO 3: Renderizar a Tabela com Dados Paginados

```tsx
<ReclamacoesTable
  reclamacoes={paginatedItems}  // ← Dados paginados
  isLoading={loadingReclamacoes}
  error={errorReclamacoes ? String(errorReclamacoes) : null}
  // ... outras props
/>
```

### PASSO 4: Renderizar o Rodapé Fixado

```tsx
{/* Rodapé Fixado com Paginação */}
{totalPages > 1 && (
  <div 
    className={`fixed bottom-0 right-0 bg-background border-t shadow-lg z-40 transition-all duration-300 ${
      isSidebarCollapsed ? 'md:left-[72px]' : 'md:left-72'
    } left-0`}
  >
    <ReclamacoesPagination
      totalItems={items.length}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onItemsPerPageChange={setItemsPerPage}
      showFirstLastButtons={true}
      pageButtonLimit={5}
    />
  </div>
)}
```

---

## 📦 Código Completo de Exemplo

### Estrutura da Página

```tsx
import { useState, useEffect } from 'react';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { ReclamacoesPagination } from '../components/ReclamacoesPagination';

export function MinhaPage() {
  const { isSidebarCollapsed } = useSidebarUI();
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Seus dados (pode vir de API, estado, etc)
  const [items, setItems] = useState<any[]>([]);
  
  // Calcular paginação
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  
  // Garantir página válida
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  // Dados paginados
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return (
    <div className="min-h-screen">
      {/* Conteúdo da página */}
      <div className="p-4 md:p-6 pb-24"> {/* pb-24 para espaço do rodapé */}
        
        {/* Sua tabela/grid com dados paginados */}
        <MinhaTabela items={paginatedItems} />
        
      </div>
      
      {/* Rodapé Fixado com Paginação */}
      {totalPages > 1 && (
        <div 
          className={`fixed bottom-0 right-0 bg-background border-t shadow-lg z-40 transition-all duration-300 ${
            isSidebarCollapsed ? 'md:left-[72px]' : 'md:left-72'
          } left-0`}
        >
          <ReclamacoesPagination
            totalItems={items.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            showFirstLastButtons={true}
            pageButtonLimit={5}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Checklist de Implementação

Ao aplicar este sistema em uma nova página:

- [ ] **1. Copiar o componente `ReclamacoesPagination.tsx`** para a feature correspondente
- [ ] **2. Importar `useSidebarUI`** de `@/context/SidebarUIContext`
- [ ] **3. Adicionar estados:** `currentPage` e `itemsPerPage`
- [ ] **4. Implementar lógica de paginação:** calcular `totalPages` e `paginatedItems`
- [ ] **5. Adicionar `useEffect`** para validar página atual
- [ ] **6. Passar dados paginados** para a tabela/grid
- [ ] **7. Adicionar `pb-24`** no container principal para espaço do rodapé
- [ ] **8. Renderizar rodapé fixado** com condição `{totalPages > 1 && ...}`
- [ ] **9. Integrar `ReclamacoesPagination`** com todas as props necessárias
- [ ] **10. Testar:** navegação, mudança de itens/página, responsividade sidebar

---

## 🎨 Personalização

### Alterar Opções de Itens por Página

Edite o componente `ReclamacoesPagination.tsx`:

```tsx
<select ...>
  <option value={10}>10</option>   {/* Adicionar nova opção */}
  <option value={25}>25</option>
  <option value={50}>50</option>
  <option value={100}>100</option>
  <option value={200}>200</option> {/* Adicionar nova opção */}
</select>
```

### Alterar Quantidade de Botões de Página Visíveis

```tsx
<ReclamacoesPagination
  pageButtonLimit={7}  // Padrão: 5 (mostra até 7 botões de página)
  // ...
/>
```

### Ocultar Botões Primeira/Última

```tsx
<ReclamacoesPagination
  showFirstLastButtons={false}
  // ...
/>
```

### Alterar Texto do Contador

Edite linha no componente:

```tsx
<div className="text-sm text-muted-foreground whitespace-nowrap">
  Mostrando {startItem} a {endItem} de {totalItems} itens {/* Alterar "reclamações" */}
</div>
```

---

## ⚠️ Considerações Importantes

### 1. Espaçamento do Conteúdo
Sempre adicione `pb-24` (padding-bottom) no container principal da página para evitar que o conteúdo seja coberto pelo rodapé fixado.

### 2. Z-Index
O rodapé usa `z-40`. Certifique-se de que outros elementos fixos/modals usem z-index apropriado.

### 3. Responsividade da Sidebar
O rodapé ajusta automaticamente com `md:left-[72px]` (sidebar retraído) e `md:left-72` (sidebar expandido). Mantenha esta classe.

### 4. Performance
Para listas muito grandes (10.000+ itens), considere implementar paginação server-side ao invés de client-side.

### 5. Persistência de Estado
Considere salvar `currentPage` e `itemsPerPage` em:
- localStorage (como em `/reclamacoes`)
- URL query params
- Estado global (Zustand, Redux)

---

## 🔄 Integração com React Query / Cache

Se usar React Query para buscar dados paginados do backend:

```tsx
const { data: items, isLoading } = useQuery({
  queryKey: ['items', currentPage, itemsPerPage],
  queryFn: () => fetchItems({ page: currentPage, perPage: itemsPerPage }),
  keepPreviousData: true, // Manter dados anteriores durante carregamento
});
```

---

## 📚 Referências

- **Página de exemplo:** `src/features/reclamacoes/pages/ReclamacoesPage.tsx`
- **Componente base:** `src/features/reclamacoes/components/ReclamacoesPagination.tsx`
- **Padrão similar:** `src/features/devolucao2025/components/Devolucao2025Pagination.tsx`

---

## ✅ Conclusão

Este sistema fornece:
- ✨ Paginação completa e profissional
- 🎨 Layout consistente e responsivo
- ♿ Acessibilidade total
- 🔄 Reutilizável em qualquer página
- 🚀 Performance otimizada

Para aplicar em outra página, siga o **Checklist de Implementação** acima e use o **Código Completo de Exemplo** como referência.
