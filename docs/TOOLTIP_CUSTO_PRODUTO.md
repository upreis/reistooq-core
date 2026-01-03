# 📦 Documentação do Tooltip "Custo Produto"

Este documento descreve a implementação do tooltip usado na coluna "Custo Produto" para que possa ser replicado em outras páginas.

---

## 📐 Especificações Visuais

### Posição
- **side**: `"top"` - Tooltip aparece acima do elemento
- **Alternativas disponíveis**: `"bottom"`, `"left"`, `"right"`

### Tamanho
- **max-width**: `max-w-xs` (320px)
- **Padding interno**: Padrão do TooltipContent (8px horizontal, 6px vertical)

### Layout Interno
- **Container**: `div` com `className="text-xs space-y-1"`
- **Espaçamento entre linhas**: `space-y-1` (4px)

---

## 🎨 Estrutura do Conteúdo

### 1. Cabeçalho (Título)
```tsx
<div className="font-semibold border-b pb-1 mb-1">
  Título do Tooltip
</div>
```
- **Estilo**: Negrito, borda inferior, padding-bottom e margin-bottom de 4px

### 2. Linhas de Detalhamento
```tsx
<div className="flex justify-between gap-4">
  <span>Label:</span>
  <span className="font-mono">{valor}</span>
</div>
```
- **Layout**: Flexbox com `justify-between` para alinhar label à esquerda e valor à direita
- **Gap**: 16px entre label e valor
- **Fonte do valor**: `font-mono` para alinhamento numérico

### 3. Linha de Total (Destaque)
```tsx
<div className="flex justify-between gap-4 font-semibold border-t pt-1 mt-1">
  <span>Total:</span>
  <span className="font-mono">{valorTotal}</span>
</div>
```
- **Estilo**: Negrito, borda superior, padding-top e margin-top de 4px

### 4. Rodapé (Informação Secundária)
```tsx
<div className="text-[10px] text-muted-foreground pt-1">
  Informação adicional
</div>
```
- **Tamanho fonte**: 10px (menor que o conteúdo principal)
- **Cor**: `text-muted-foreground` (cinza sutil)
- **Espaçamento**: `pt-1` (4px acima)

---

## 🔧 Componentes Utilizados

```tsx
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
```

---

## 📝 Exemplo Completo de Implementação

```tsx
import React from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { formatMoney } from '@/lib/format';

interface MeuTooltipProps {
  valorPrincipal: number;
  detalhe1: number;
  detalhe2: number;
  detalhe3?: number;
  fonteInfo?: string;
}

export function MeuTooltipCell({
  valorPrincipal,
  detalhe1,
  detalhe2,
  detalhe3,
  fonteInfo
}: MeuTooltipProps) {
  const temDetalhes = detalhe1 > 0 || detalhe2 > 0 || (detalhe3 && detalhe3 > 0);
  
  // Estilo do valor principal (trigger)
  const colorClass = 'font-mono text-sm font-semibold text-orange-600 dark:text-orange-400';

  // Se não tem detalhes, mostra só o valor sem tooltip
  if (!temDetalhes) {
    return <span className={colorClass}>{formatMoney(valorPrincipal)}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        {/* TRIGGER - Elemento que ativa o tooltip */}
        <TooltipTrigger asChild>
          <span className={`${colorClass} cursor-help underline decoration-dotted`}>
            {formatMoney(valorPrincipal)}
          </span>
        </TooltipTrigger>
        
        {/* CONTENT - Conteúdo do tooltip */}
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs space-y-1">
            
            {/* CABEÇALHO */}
            <div className="font-semibold border-b pb-1 mb-1">
              Detalhamento do Valor
            </div>
            
            {/* LINHA 1 */}
            <div className="flex justify-between gap-4">
              <span>Item 1:</span>
              <span className="font-mono">{formatMoney(detalhe1)}</span>
            </div>
            
            {/* LINHA 2 */}
            <div className="flex justify-between gap-4">
              <span>Item 2:</span>
              <span className="font-mono">{formatMoney(detalhe2)}</span>
            </div>
            
            {/* LINHA CONDICIONAL */}
            {detalhe3 && detalhe3 > 0 && (
              <div className="flex justify-between gap-4">
                <span>Item 3:</span>
                <span className="font-mono">{formatMoney(detalhe3)}</span>
              </div>
            )}
            
            {/* LINHA TOTAL */}
            <div className="flex justify-between gap-4 font-semibold border-t pt-1 mt-1">
              <span>Total:</span>
              <span className="font-mono">{formatMoney(valorPrincipal)}</span>
            </div>
            
            {/* RODAPÉ (opcional) */}
            {fonteInfo && (
              <div className="text-[10px] text-muted-foreground pt-1">
                Fonte: {fonteInfo}
              </div>
            )}
            
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## 🎯 Estilo do Trigger (Valor Clicável)

```tsx
// Cor do valor (laranja para custos)
const colorClass = 'font-mono text-sm font-semibold text-orange-600 dark:text-orange-400';

// Com indicação visual de que tem tooltip
<span className={`${colorClass} cursor-help underline decoration-dotted`}>
  {valor}
</span>
```

### Propriedades do Trigger:
- `font-mono`: Fonte monoespaçada para números
- `text-sm`: Tamanho 14px
- `font-semibold`: Semi-negrito
- `text-orange-600 dark:text-orange-400`: Cor laranja (tema claro/escuro)
- `cursor-help`: Cursor de ajuda (?)
- `underline decoration-dotted`: Sublinhado pontilhado

---

## 🔄 Variações de Cor

### Para Custos (Laranja)
```tsx
'text-orange-600 dark:text-orange-400'
```

### Para Receitas/Lucro (Verde)
```tsx
'text-green-600 dark:text-green-400'
```

### Para Perdas (Vermelho)
```tsx
'text-red-600 dark:text-red-400'
```

### Para Neutro (Azul)
```tsx
'text-blue-600 dark:text-blue-400'
```

---

## 📱 Responsividade

O tooltip é responsivo por padrão:
- Em mobile, pode mudar de posição automaticamente se não couber
- `max-w-xs` garante que não fique muito largo em telas pequenas

---

## ⚡ Performance

Para evitar re-renders desnecessários, use `React.memo`:

```tsx
export const MeuTooltipCell = memo(function MeuTooltipCell(props: MeuTooltipProps) {
  // implementação
});
```

---

## 📁 Arquivo de Referência

Implementação original: `src/components/pedidos/components/CustoProdutoCell.tsx`
