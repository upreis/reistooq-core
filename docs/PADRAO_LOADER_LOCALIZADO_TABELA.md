# 📋 Padrão: Loader Localizado em Tabelas

## 🎯 Objetivo

Implementar loader de carregamento que aparece **APENAS** sobre a área da tabela de dados, permitindo que usuário continue interagindo com outros elementos da página (filtros, botões, abas) mesmo durante o carregamento.

---

## ❌ Problema que Resolve

**Antes (Incorreto):**
```tsx
{/* ❌ Loader full-page bloqueando toda a interface */}
{loading && <LoadingIndicator />}
```

**Problemas:**
- ❌ Loader mascara página inteira
- ❌ Usuário não consegue clicar em "Cancelar a Busca" durante carregamento
- ❌ Filtros, abas e demais controles ficam bloqueados
- ❌ Experiência ruim de UX

---

## ✅ Solução: Loader Localizado

### Estrutura Correta

```tsx
{/* ✅ Container da tabela com position relative */}
<div className="px-4 md:px-6 mt-2 relative">
  
  {/* ✅ LOADER APENAS NA ÁREA DA TABELA */}
  {(loading || isSearching) && (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
      <LoadingIndicator />
    </div>
  )}
  
  {/* Tabela de dados */}
  <MinhaTabela data={data} />
</div>
```

---

## 📐 Implementação Passo a Passo

### PASSO 1: Identificar o Container da Tabela

Localize o `<div>` que envolve sua tabela de dados:

```tsx
{/* ANTES */}
<div className="px-4 md:px-6 mt-2">
  <MinhaTabela />
</div>
```

### PASSO 2: Adicionar `relative` ao Container

```tsx
{/* DEPOIS */}
<div className="px-4 md:px-6 mt-2 relative">
  <MinhaTabela />
</div>
```

### PASSO 3: Remover Loader Full-Page (se existir)

Procure e **DELETE** qualquer loader renderizado fora do container da tabela:

```tsx
{/* ❌ DELETAR ISTO */}
{loading && <LoadingIndicator />}
```

### PASSO 4: Adicionar Loader Localizado

Insira o loader **DENTRO** do container da tabela, **ANTES** do componente da tabela:

```tsx
<div className="px-4 md:px-6 mt-2 relative">
  
  {/* ✅ ADICIONAR ISTO */}
  {(loading || isSearching) && (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
      <LoadingIndicator />
    </div>
  )}
  
  <MinhaTabela />
</div>
```

---

## 🎨 Classes CSS Explicadas

| Classe | Função |
|--------|--------|
| `absolute` | Posicionamento absoluto relativo ao container pai |
| `inset-0` | Ocupa 100% da altura e largura do container (top-0 right-0 bottom-0 left-0) |
| `z-10` | Z-index garantindo que loader aparece sobre a tabela |
| `flex items-center justify-center` | Centraliza o spinner vertical e horizontalmente |
| `bg-background/80` | Background semi-transparente (80% opacidade) usando cor semântica |
| `backdrop-blur-sm` | Efeito blur sutil no conteúdo atrás do loader |
| `rounded-md` | Bordas arredondadas combinando com o card/tabela |

---

## 🔧 Condições de Loading

Ajuste a condição conforme as variáveis de estado da sua página:

### Exemplo 1: Loading simples
```tsx
{loading && (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
    <LoadingIndicator />
  </div>
)}
```

### Exemplo 2: Loading OU busca manual
```tsx
{(loadingData || isManualSearching) && (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
    <LoadingIndicator />
  </div>
)}
```

### Exemplo 3: Múltiplos estados
```tsx
{(isLoading || isFetching || isRefreshing) && (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
    <LoadingIndicator />
  </div>
)}
```

---

## 📦 Páginas que Implementam Este Padrão

✅ **Implementado com sucesso em:**

1. `/devolucoesdevenda` - `src/features/devolucao2025/pages/Devolucao2025Page.tsx`
2. `/pedidos` - `src/components/pedidos/SimplePedidosPage.tsx`
3. `/reclamacoes` - `src/features/reclamacoes/pages/ReclamacoesPage.tsx`
4. `/vendas-online` - `src/pages/VendasOnline.tsx`

---

## ✨ Benefícios

✅ **UX melhorada:**
- Usuário pode cancelar busca durante carregamento
- Filtros e abas permanecem acessíveis
- Feedback visual claro de que apenas dados estão carregando

✅ **Visual profissional:**
- Blur sutil no conteúdo
- Background semi-transparente
- Confinado à área relevante

✅ **Manutenibilidade:**
- Padrão consistente entre páginas
- Fácil de replicar
- Usa design tokens semânticos

---

## 📝 Template Completo para Copy-Paste

```tsx
{/* Table com loader localizado */}
<div className="px-4 md:px-6 mt-2 relative">
  
  {/* 🔄 LOADER APENAS NA ÁREA DA TABELA */}
  {(loading || isSearching) && (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
      <LoadingIndicator />
    </div>
  )}
  
  {/* Sua tabela aqui */}
  <MinhaTabela
    data={data}
    columns={columns}
    // ... outras props
  />
</div>
```

---

## 🚨 Checklist de Implementação

Ao aplicar em nova página, verificar:

- [ ] Container da tabela tem `className="... relative"`
- [ ] Loader antigo full-page foi removido
- [ ] Novo loader está **DENTRO** do container da tabela
- [ ] Novo loader está **ANTES** do componente `<Tabela />`
- [ ] Condição de loading reflete as variáveis corretas da página
- [ ] Classes CSS estão corretas (absolute, inset-0, z-10, bg-background/80, backdrop-blur-sm, rounded-md)
- [ ] `<LoadingIndicator />` está sendo importado corretamente
- [ ] Testar que botão "Cancelar a Busca" permanece clicável durante loading
- [ ] Testar que filtros e abas permanecem acessíveis durante loading

---

## 🎯 Quando Aplicar

**Sempre que:**
- Página possui tabela de dados com carregamento assíncrono
- Usuário precisa interagir com controles (filtros, botões) durante loading
- Loader atual bloqueia toda a página frustrando UX

**Páginas candidatas:**
- Qualquer página com tabela principal de dados
- Dashboards com múltiplas seções
- Relatórios com filtros complexos

---

**Última atualização:** 2025-11-21  
**Páginas implementadas:** 4 (/devolucoesdevenda, /pedidos, /reclamacoes, /vendas-online)
