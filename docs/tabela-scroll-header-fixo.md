# 📋 Tabela com Scroll Suave e Header Fixo

Documentação para implementação de tabelas com scroll suave e cabeçalho fixo (sticky header).

## 🎯 Objetivo

Criar tabelas onde:
- O cabeçalho permanece sempre visível ao rolar a página
- O scroll é suave e fluido
- A estrutura funciona mesmo com muitos dados

## 🏗️ Estrutura Necessária

### 1. Container da Página (Page Component)

O container principal precisa ter altura definida e controle de overflow:

```typescript
return (
  <div className="w-full h-screen px-6 py-6 space-y-6 flex flex-col overflow-hidden">
    {/* Header da página - flex-shrink-0 para não encolher */}
    <div className="flex items-center justify-between flex-shrink-0">
      <h1>Título da Página</h1>
    </div>

    {/* Outros componentes que não scrollam */}
    <Stats />
    <Filters />

    {/* Card da tabela - flex-1 para ocupar espaço restante */}
    <Card className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
      <YourTable data={data} />
    </Card>
  </div>
);
```

**Classes críticas no container da página:**
- `h-screen` - Define altura total da viewport
- `flex flex-col` - Layout flexbox vertical
- `overflow-hidden` - Previne scroll duplo
- `flex-shrink-0` - No header para evitar encolhimento
- `flex-1 min-h-0 overflow-hidden` - No Card da tabela

### 2. Componente da Tabela

```typescript
export const YourTable = ({ data }) => {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      {/* Container com scroll - flex-1 para ocupar todo espaço disponível */}
      <div className="flex-1 overflow-auto border rounded-md scroll-smooth relative">
        <table className="w-full caption-bottom text-sm">
          {/* Header fixo com sticky */}
          <thead className="sticky top-0 z-20 bg-background border-b-2 shadow-sm">
            <tr className="border-b border-gray-600">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">
                Coluna 1
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">
                Coluna 2
              </th>
              {/* ... mais colunas */}
            </tr>
          </thead>
          
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b hover:bg-muted/50">
                <td className="p-4">{item.col1}</td>
                <td className="p-4">{item.col2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

**Classes críticas no componente da tabela:**
- Container externo: `w-full flex-1 flex flex-col min-h-0`
- Container de scroll: `flex-1 overflow-auto scroll-smooth relative`
- `<thead>`: `sticky top-0 z-20 bg-background border-b-2 shadow-sm`
- `<th>`: `bg-background` para garantir que o fundo cubra o conteúdo abaixo

## 🔑 Pontos Importantes

### 1. Por que usar `<table>` nativo ao invés de Shadcn Table?
- Maior controle sobre o comportamento sticky
- Melhor performance com grandes datasets
- Evita conflitos de z-index e overflow

### 2. Por que `min-h-0` é crítico?
- Sem ele, elementos flex não respeitam overflow corretamente
- Permite que o container de scroll funcione dentro de um flex container

### 3. Por que `h-screen` na página?
- Define uma altura fixa para o container principal
- Sem altura fixa, o sticky não tem referência para "grudar"

### 4. Classes de fundo no header
```css
bg-background  /* Garante que o header cubra o conteúdo */
shadow-sm      /* Adiciona sombra para destacar */
border-b-2     /* Linha divisória mais forte */
z-20           /* Garante que fique acima do conteúdo */
```

## ✅ Checklist de Implementação

- [ ] Container da página com `h-screen flex flex-col overflow-hidden`
- [ ] Headers que não scrollam com `flex-shrink-0`
- [ ] Card da tabela com `flex-1 min-h-0 overflow-hidden`
- [ ] Container de scroll com `flex-1 overflow-auto scroll-smooth`
- [ ] `<thead>` com `sticky top-0 z-20 bg-background`
- [ ] Cada `<th>` com `bg-background`
- [ ] Usar `<table>` nativo, não Shadcn Table components

## 🎨 Exemplo Completo

```typescript
// pages/YourPage.tsx
export const YourPage = () => {
  return (
    <div className="w-full h-screen px-6 py-6 space-y-6 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1>Título</h1>
      </div>
      
      <Card className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        <YourTable data={data} />
      </Card>
    </div>
  );
};

// components/YourTable.tsx
export const YourTable = ({ data }) => {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-auto border rounded-md scroll-smooth relative">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-20 bg-background border-b-2 shadow-sm">
            <tr>
              <th className="h-12 px-4 text-left bg-background">Header</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                <td className="p-4">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## 🐛 Problemas Comuns

### Header não fixa
- ❌ Falta `h-screen` no container principal
- ❌ Falta `sticky top-0` no `<thead>`
- ❌ Falta `bg-background` no `<th>`

### Scroll não funciona
- ❌ Falta `overflow-auto` no container de scroll
- ❌ Falta `flex-1` no container de scroll
- ❌ Falta `min-h-0` nos containers flex

### Header desaparece ou fica transparente
- ❌ Falta `bg-background` no `<th>`
- ❌ `z-index` muito baixo

## 📚 Referências

- Exemplo implementado em: `src/features/devolucao2025/`
- Page: `src/features/devolucao2025/pages/Devolucao2025Page.tsx`
- Table: `src/features/devolucao2025/components/Devolucao2025Table.tsx`
