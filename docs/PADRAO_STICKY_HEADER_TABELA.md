# 📌 Padrão Sticky Header para Tabelas - Documentação

> **Status:** ✅ Validado em produção (`/reclamacoes`)
> **Data:** 2025-12-18
> **Autor:** Sistema

---

## 🎯 Problema Original

Múltiplas tentativas falharam usando:
- Clone de header com sincronização JS
- `position: fixed` com `getBoundingClientRect()`
- `IntersectionObserver` para detectar scroll
- CSS Grid com HeaderBar separado
- `transform: translateX` sincronizado

**Causa raiz:** Overengineering. A solução nativa do browser (`position: sticky`) funciona perfeitamente quando configurada corretamente.

---

## ✅ Solução Validada

### Princípio
Usar `position: sticky` nativo no `<TableHeader>` dentro de um **ÚNICO container scrollável** com `overflow-auto`.

### Arquitetura

```
┌─────────────────────────────────────────────────┐
│ div.border.rounded-md (container visual)        │
│ ┌─────────────────────────────────────────────┐ │
│ │ div.overflow-auto (ÚNICO scroll container)  │ │
│ │ style={{ maxHeight: 'calc(100vh - Xpx)' }}  │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ Table (min-w-max w-max)                 │ │ │
│ │ │ disableOverflow={true}                  │ │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ │
│ │ │ │ TableHeader                         │ │ │ │
│ │ │ │ className="sticky top-0 z-20        │ │ │ │
│ │ │ │            bg-background"           │ │ │ │
│ │ │ │ (FICA FIXO NO SCROLL VERTICAL)      │ │ │ │
│ │ │ └─────────────────────────────────────┘ │ │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ │
│ │ │ │ TableBody                           │ │ │ │
│ │ │ │ (scroll natural vertical+horizontal)│ │ │ │
│ │ │ └─────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 📋 Requisitos

### 1. Componente Table (shadcn) com prop `disableOverflow`

O componente `Table` do shadcn precisa ter uma prop para desativar o `overflow-auto` interno que bloquearia o `position: sticky`.

**Arquivo:** `src/components/ui/table.tsx`

```tsx
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  disableOverflow?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, disableOverflow, ...props }, ref) => (
    <div className={cn(
      "relative w-full",
      !disableOverflow && "overflow-auto"  // ← Condicional!
    )}>
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
);
```

### 2. Wrapper com overflow-auto e maxHeight

```tsx
<div 
  className="overflow-auto"
  style={{ maxHeight: 'calc(100vh - 380px)' }}  // Ajustar conforme página
>
  {/* Table aqui dentro */}
</div>
```

### 3. Table com classes corretas

```tsx
<Table className="min-w-max w-max" disableOverflow>
```

- `min-w-max`: Garante que tabela não encolha além do conteúdo
- `w-max`: Permite scroll horizontal quando necessário
- `disableOverflow`: Desativa overflow interno do shadcn

### 4. TableHeader com sticky

```tsx
<TableHeader className="sticky top-0 z-20 bg-background">
```

- `sticky top-0`: Fixa no topo do container de scroll
- `z-20`: Garante que fique acima do body
- `bg-background`: Fundo sólido para cobrir conteúdo abaixo

### 5. TableHead com background

```tsx
<TableHead className={`bg-background ${meta?.headerClassName || ''}`}>
```

Cada célula do header também precisa de `bg-background` para cobrir completamente.

---

## 🔧 Código de Referência Completo

```tsx
/**
 * 📋 TABELA COM STICKY HEADER - PADRÃO VALIDADO
 */

import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';

export const MinhaTabela = ({ dados, colunas }) => {
  return (
    <div className="w-full flex flex-col border rounded-md">
      {/* 📌 WRAPPER ÚNICO COM SCROLL */}
      <div 
        className="overflow-auto"
        style={{ maxHeight: 'calc(100vh - 380px)' }}  // Ajustar!
      >
        <Table className="min-w-max w-max" disableOverflow>
          {/* 📌 HEADER STICKY */}
          <TableHeader className="sticky top-0 z-20 bg-background">
            <TableRow className="hover:bg-transparent border-b-2">
              {colunas.map((col) => (
                <TableHead
                  key={col.id}
                  className="bg-background"
                  style={{
                    width: col.size,
                    minWidth: col.size,
                  }}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {/* 📌 BODY - scroll natural */}
          <TableBody>
            {dados.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/50">
                {colunas.map((col) => (
                  <TableCell key={col.id}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
```

---

## ✅ Checklist de Implementação

- [ ] Verificar se `Table` component tem prop `disableOverflow`
- [ ] Criar wrapper `div` com `overflow-auto` e `maxHeight`
- [ ] Aplicar `disableOverflow` na `<Table>`
- [ ] Aplicar `className="min-w-max w-max"` na `<Table>`
- [ ] Aplicar `className="sticky top-0 z-20 bg-background"` no `<TableHeader>`
- [ ] Aplicar `className="bg-background"` em cada `<TableHead>`
- [ ] Ajustar `maxHeight` conforme layout da página (considerar header, filtros, paginação)
- [ ] Testar scroll vertical (header deve ficar fixo)
- [ ] Testar scroll horizontal (header e body devem sincronizar)

---

## ⚠️ Erros Comuns a Evitar

### ❌ NÃO fazer:

1. **Dois containers de scroll separados** (header e body)
   - Causa: scroll horizontal dessincronizado

2. **`overflow: hidden` em ancestrais**
   - Causa: `position: sticky` não funciona

3. **`transform` ou `will-change` em ancestrais**
   - Causa: cria novo stacking context que quebra sticky

4. **Clone do header com JS**
   - Causa: complexidade desnecessária, bugs de sincronização

5. **`position: fixed`**
   - Causa: remove elemento do fluxo, requer cálculos manuais

### ✅ SEMPRE fazer:

1. **Um único container com `overflow-auto`**
2. **`position: sticky` no `<TableHeader>`**
3. **`bg-background` no header para cobrir conteúdo**
4. **`disableOverflow` na `<Table>` do shadcn**

---

## 📁 Arquivos de Referência

- **Implementação validada:** `src/features/reclamacoes/components/ReclamacoesTable.tsx`
- **Componente Table:** `src/components/ui/table.tsx`

---

## 🎯 Páginas para Aplicar

- [ ] `/devolucoesdevenda` - Devolucao2025Table.tsx
- [ ] `/vendas-com-envio` - VendasComEnvioTable.tsx
- [ ] `/pedidos` - PedidosTable.tsx
- [ ] `/vendas-online` - (se aplicável)

---

## 📝 Histórico

| Data | Ação |
|------|------|
| 2025-12-18 | Documentação criada após validação em /reclamacoes |
| 2025-12-15 | Solução sticky nativa implementada e validada |
| 2025-12-14 | Múltiplas tentativas com clone/fixed falharam |
