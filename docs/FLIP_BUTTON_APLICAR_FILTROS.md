# 🔄 FlipButton - Botão Animado de Aplicar Filtros

## 📋 Visão Geral

Botão animado com efeito de flip (rotação 3D) que alterna entre dois estados:
- **Estado Normal**: "Aplicar Filtros e Buscar" (azul/primary)
- **Estado Ativo**: "Cancelar a Busca" (vermelho/destructive)

Implementado na página `/reclamacoes` como substituto dos botões tradicionais de filtro.

---

## 🎯 Características

### Visual
- **Tamanho**: Altura fixa de 40px (`h-10`) para igualar ao botão de período
- **Largura**: 100% do container (`w-full`)
- **Bordas**: Arredondadas usando `var(--radius)` do sistema de design
- **Borda**: Possui border para consistência visual
- **Cores Semânticas**:
  - Estado 1 (Normal): `hsl(var(--primary))` com texto `hsl(var(--primary-foreground))`
  - Estado 2 (Ativo): `hsl(var(--destructive))` com texto `hsl(var(--destructive-foreground))`

### Animação
- **Tipo**: Flip 3D (rotação no eixo X)
- **Velocidade**: 0.05s (muito rápida)
- **Framework**: Framer Motion
- **Efeitos Adicionais**:
  - `whileTap={{ scale: 0.95 }}` - Reduz ao clicar
  - `whileHover={{ scale: 1.05 }}` - Aumenta ao passar o mouse

---

## 📁 Arquivos

### Componente Base
**Localização**: `src/components/ui/flip-button.tsx`

```typescript
import { useState } from 'react'
import { motion } from 'framer-motion'

export function FlipButton({ 
  text1, 
  text2,
  onClick,
  isFlipped,
}: {
  text1: string;
  text2: string;
  onClick?: () => void;
  isFlipped?: boolean;
}) {
  const [internalShow, setInternalShow] = useState(false)
  const show = isFlipped !== undefined ? isFlipped : internalShow
  
  const flipVariants = {
    one: {
      rotateX: 0,
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
    },
    two: {
      rotateX: 180,
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  }

  const handleClick = () => {
    if (isFlipped === undefined) {
      setInternalShow(!internalShow)
    }
    onClick?.()
  }

  return (
    <div className="w-full">
      <motion.button
        className="w-full h-10 cursor-pointer px-3 font-medium shadow-sm border text-sm"
        style={{
          borderRadius: 'var(--radius)',
        }}
        onClick={handleClick}
        animate={show ? 'two' : 'one'}
        variants={flipVariants}
        transition={{ duration: 0.05, type: 'spring' }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          animate={{ rotateX: show ? 180 : 0 }}
          transition={{ duration: 0.05, type: 'spring' }}
        >
          {show ? text1 : text2}
        </motion.div>
        <motion.div
          animate={{ rotateX: show ? 0 : -180 }}
          transition={{ duration: 0.05, type: 'spring' }}
          className="absolute inset-0"
        ></motion.div>
      </motion.button>
    </div>
  )
}
```

---

## 🔧 Implementação na Página /reclamacoes

### Arquivo: `src/features/reclamacoes/components/ReclamacoesFilterBar.tsx`

#### 1. Import
```typescript
import { FlipButton } from '@/components/ui/flip-button';
```

#### 2. Substituição do Botão
**ANTES** (botões tradicionais condicionais):
```typescript
{isLoading && onCancel ? (
  <Button
    onClick={onCancel}
    variant="destructive"
    className="w-full"
  >
    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
    Cancelar
  </Button>
) : (
  <Button
    onClick={onBuscar}
    disabled={isLoading || selectedAccountIds.length === 0}
    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
  >
    <Search className="h-4 w-4 mr-2" />
    Aplicar Filtros e Buscar
  </Button>
)}
```

**DEPOIS** (FlipButton único):
```typescript
<FlipButton
  text1="Cancelar a Busca"
  text2="Aplicar Filtros e Buscar"
  isFlipped={isLoading && !!onCancel}
  onClick={isLoading && onCancel ? onCancel : onBuscar}
/>
```

---

## 📊 Props do Componente

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `text1` | `string` | ✅ | Texto exibido no estado flipped (rotacionado) |
| `text2` | `string` | ✅ | Texto exibido no estado normal |
| `onClick` | `() => void` | ❌ | Função chamada ao clicar no botão |
| `isFlipped` | `boolean` | ❌ | Controla o estado externamente. Se undefined, usa estado interno |

---

## 🎨 Customizações Aplicadas

### Em relação ao botão original:
1. **Tamanho**: Ajustado para `h-10` (40px) para igualar botão de período
2. **Padding**: Reduzido para `px-3` (consistente com outros inputs)
3. **Font-size**: `text-sm` para consistência
4. **Velocidade**: Aumentada para 0.05s (muito mais rápida que os 0.6s originais)
5. **Bordas**: Mudado de `borderRadius: 999` (pill) para `var(--radius)` (retangular arredondado)
6. **Cores**: Adaptadas para usar tokens semânticos do design system (`--primary`, `--destructive`)
7. **Border**: Adicionado `border` para consistência visual com outros elementos

---

## 📦 Dependências

- **framer-motion**: Framework de animação React
- **Design System**: Usa tokens CSS do projeto (`--primary`, `--destructive`, `--radius`)

---

## ✅ Quando Usar

### Ideal para:
- Botões de filtro/busca que alternam entre "aplicar" e "cancelar"
- Ações que têm dois estados opostos claramente definidos
- Interfaces onde feedback visual animado melhora UX

### Evitar quando:
- Ação não tem estado oposto claro
- Animação pode confundir o usuário
- Performance é crítica (animações 3D podem ser custosas)

---

## 🔄 Aplicando em Outras Páginas

### Passo a Passo:

1. **Importar o componente**:
```typescript
import { FlipButton } from '@/components/ui/flip-button';
```

2. **Identificar os estados**:
   - Qual texto no estado normal?
   - Qual texto no estado ativo?
   - Qual condição determina o flip?

3. **Substituir botões condicionais**:
```typescript
<FlipButton
  text1="Texto Estado Ativo"
  text2="Texto Estado Normal"
  isFlipped={condicaoDeFlip}
  onClick={funcaoAoClicar}
/>
```

### Exemplo para página /pedidos:
```typescript
<FlipButton
  text1="Cancelar Busca"
  text2="Aplicar Filtros"
  isFlipped={isBuscando && !!handleCancelar}
  onClick={isBuscando && handleCancelar ? handleCancelar : handleBuscar}
/>
```

---

## 🎯 Benefícios

1. **UX Melhorada**: Transição suave e visualmente atraente
2. **Economia de Espaço**: Um botão ao invés de dois condicionais
3. **Feedback Visual**: Estado do sistema claramente comunicado
4. **Consistência**: Design system aplicado automaticamente
5. **Reutilizável**: Componente genérico aplicável em múltiplas páginas

---

## 📝 Notas Técnicas

- O componente aceita controle externo via `isFlipped` prop
- Se `isFlipped` não for passado, usa estado interno
- Animação usa `spring` physics do Framer Motion para movimento natural
- Cores se adaptam automaticamente ao tema (light/dark mode)
- Acessibilidade: Mantém semântica de botão nativo

---

## 🔍 Páginas Candidatas para Implementação

- ✅ `/reclamacoes` - **IMPLEMENTADO**
- 🔲 `/pedidos` - Sistema de filtros similar
- 🔲 `/devolucoesdevenda` - Sistema de filtros similar
- 🔲 `/vendas-online` - Sistema de filtros similar
- 🔲 Qualquer página com padrão "Aplicar/Cancelar"
