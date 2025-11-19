# 📋 Planejamento: Padronização /vendas-online

## Objetivo
Aplicar todas as funcionalidades implementadas em `/reclamacoes` e já aplicadas em `/devolucoesdevenda` na página `/vendas-online`.

---

## 🎯 FASE 1: Sistema de Abas Ativas/Histórico

### 1.1 Criar Hook de Storage Local
**Arquivo:** `src/features/vendas-online/hooks/useVendaStorage.ts`

```typescript
// Adaptar de useDevolucaoStorage.ts
// Gerenciar status_analise_local e anotações em localStorage
// Key: `vendas_analise_${orderId}`
```

### 1.2 Criar Tipos de Análise
**Arquivo:** `src/features/vendas-online/types/venda-analise.types.ts`

```typescript
// Copiar estrutura de devolucao-analise.types.ts
// StatusAnalise: 'pendente' | 'em_analise' | 'aguardando_ml' | 'resolvido_sem_reembolso' | 'resolvido_com_reembolso' | 'cancelado'
// STATUS_ATIVOS: ['pendente', 'em_analise', 'aguardando_ml']
// STATUS_HISTORICO: ['resolvido_sem_reembolso', 'resolvido_com_reembolso', 'cancelado']
```

### 1.3 Adaptar StatusAnaliseSelect
**Arquivo:** `src/features/vendas-online/components/StatusAnaliseSelect.tsx`

```typescript
// Copiar de devolucao2025/components/StatusAnaliseSelect.tsx
// Adaptar cores e labels conforme necessário
```

### 1.4 Integrar na Página Principal
**Arquivo:** `src/features/vendas-online/pages/VendasOnlinePage.tsx`

**Mudanças:**
- Importar `useVendaStorage`, `StatusAnalise`, `STATUS_ATIVOS`, `STATUS_HISTORICO`
- Adicionar estado: `const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas')`
- Enriquecer vendas com `status_analise_local` do localStorage
- Criar `vendasEnriquecidas` e `vendasFiltradasPorAba`
- Calcular `countAtivas` e `countHistorico`
- Adicionar `handleStatusChange(orderId, newStatus)`

---

## 🎯 FASE 2: Componente de Resumo com Badges Clicáveis

### 2.1 Criar Componente de Resumo
**Arquivo:** `src/features/vendas-online/components/VendasResumo.tsx`

**Estrutura:**
```typescript
interface VendasResumoProps {
  vendas: any[];
  onFiltroClick: (filtro: FiltroResumo | null) => void;
  filtroAtivo: FiltroResumo | null;
}

export type FiltroResumo = 
  | 'prazos_vencidos'
  | 'a_vencer'
  | 'mediacao'
  | 'devolucao'
  | 'cancelamento';
```

**Badges a implementar:**
1. 📊 **Total** - `vendas.length` (amarelo)
2. 🔴 **Prazos Vencidos** - `differenceInBusinessDays < 0` (vermelho, clicável)
3. 🟡 **A Vencer** - `differenceInBusinessDays 0-2` (amarelo, clicável)
4. 🔄 **Mediações** - filtrar por tipo (roxo, clicável)
5. 📦 **Devoluções** - filtrar por tipo (azul, clicável)
6. ❌ **Cancelamento Comprador** - filtrar por tipo (laranja, clicável)

### 2.2 Integrar Filtro de Resumo
**Em:** `VendasOnlinePage.tsx`

- Adicionar estado: `const [filtroResumo, setFiltroResumo] = useState<FiltroResumo | null>(null)`
- Aplicar filtro em `vendasFiltradasPorAba` antes da paginação
- Renderizar `<VendasResumo vendas={vendasFiltradasPorAba} onFiltroClick={setFiltroResumo} filtroAtivo={filtroResumo} />`

---

## 🎯 FASE 3: FilterBar com FlipButton

### 3.1 Criar VendasFilterBar
**Arquivo:** `src/features/vendas-online/components/VendasFilterBar.tsx`

**Elementos (da esquerda para direita):**
1. 🔍 Input de busca - `min-w-[200px] h-10`
2. 🏢 Select de conta - `min-w-[180px] h-10`
3. 📅 Select de período - `min-w-[180px] h-10`
4. 🔄 FlipButton - `min-w-[220px] h-10`
   - Estado Normal: "Aplicar Filtros e Buscar" (azul)
   - Estado Ativo: "Cancelar a Busca" (vermelho)
   - Animação: rotateX 180°, 0.05s
5. 📊 ColumnSelector - `h-10`

**Layout:**
```tsx
<div className="flex items-center gap-3 flex-nowrap overflow-x-auto">
  {/* elementos com h-10 e min-w definidos */}
</div>
```

### 3.2 Integrar na Página
**Mudanças em:** `VendasOnlinePage.tsx`

- Adicionar estado: `const [isManualSearching, setIsManualSearching] = useState(false)`
- Sincronizar `periodo` com `dateRange`
- Callbacks: `onBuscar`, `onCancel`
- Remover botão "Exportar" separado da linha de filtros

---

## 🎯 FASE 4: Padronização Visual Completa

### 4.1 Ajustar Espaçamentos da Página
**Arquivo:** `VendasOnlinePage.tsx`

**Estrutura HTML:**
```tsx
{/* Header - SEM py-6, apenas px */}
<div className="px-4 md:px-6">
  <h1 className="text-3xl font-bold">📋 Vendas Online</h1>
</div>

{/* Tabs + Filtros - com space-y-4 */}
<div className="px-4 md:px-6 space-y-4">
  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ativas' | 'historico')}>
    <div className="flex items-center gap-3 flex-nowrap overflow-x-auto">
      <TabsList className="grid w-auto grid-cols-2 shrink-0 h-10">
        <TabsTrigger value="ativas" className="h-10">
          Ativas ({countAtivas})
        </TabsTrigger>
        <TabsTrigger value="historico" className="h-10">
          Histórico ({countHistorico})
        </TabsTrigger>
      </TabsList>
      
      {/* Filtros integrados */}
      <div className="flex-1 min-w-0">
        <VendasFilterBar {...props} />
      </div>
    </div>
    
    {/* Resumo - mt-12 após as abas */}
    <div className="mt-12">
      <VendasResumo {...props} />
    </div>
  </Tabs>
</div>

{/* Tabela */}
<div className="px-4 md:px-6 pb-24">
  <Card className="p-6">
    {/* conteúdo */}
  </Card>
</div>
```

### 4.2 Padronizar Alturas
- Header `<h1>`: `text-3xl font-bold` (sem container extra)
- TabsList: `h-10`
- TabsTrigger: `h-10` (não h-8)
- Todos os inputs/selects: `h-10`
- FlipButton: `h-10`
- ColumnSelector: `h-10`

### 4.3 Padronizar Espaçamentos Verticais
- Header: sem `py-6`, apenas `px-4 md:px-6`
- Container de Tabs: `space-y-4`
- Entre tabs e resumo: `mt-12`
- Tabela: `pb-24` para espaço do rodapé fixo

### 4.4 Remover Elementos Extras
- ❌ Painel de alertas (DevolucaoAlertsPanel)
- ❌ Badge de alertas ao lado do título
- ❌ Botão NotificationsBell
- ❌ Botão "Exportar" da linha de filtros (manter apenas em lugar separado se necessário)
- ❌ Subtítulo "Gestão completa com X vendas"

---

## 📊 Checklist de Validação

### Após cada fase:
- [ ] Código compila sem erros TypeScript
- [ ] Funcionalidade testada manualmente
- [ ] Visual alinhado com /reclamacoes
- [ ] Comportamento idêntico ao padrão

### Visual Final Esperado:
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Vendas Online                                            │
├─────────────────────────────────────────────────────────────┤
│ [Ativas (37)] [Histórico (0)]  🔍 [Input] 🏢 [Conta]       │
│ 📅 [Período] 🔄 [Aplicar Filtros] 📊 [Colunas]             │
│                                                             │
│ Resumo: 📊 Total 37 | 🔴 Prazos 19 | 🟡 A Vencer 18 |     │
│         🔄 Mediações 12 | 📦 Devoluções 15 | ❌ Cancel 10  │
├─────────────────────────────────────────────────────────────┤
│                   [TABELA DE VENDAS]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Replicação para /pedidos

Este mesmo planejamento pode ser aplicado em `/pedidos` substituindo:
- `vendas` → `pedidos`
- `VendasResumo` → `PedidosResumo`
- `VendasFilterBar` → `PedidosFilterBar`
- `useVendaStorage` → `usePedidoStorage`
- Ajustar tipos específicos de badges conforme dados de pedidos

---

## 📝 Notas Importantes

1. **FlipButton Animation**: Garantir `transition-all duration-50` e `rotateX(180deg)` funcionando
2. **Persistência**: localStorage com prefixo `vendas_analise_` ou `pedidos_analise_`
3. **Badges Clicáveis**: onClick deve filtrar dados e marcar badge como ativo
4. **Espaçamentos**: Seguir EXATAMENTE o padrão de /reclamacoes
5. **Height Consistency**: Todos elementos de filtro com h-10
6. **Overflow**: `overflow-x-auto` na linha de filtros para mobile

---

**Criado em:** 2025-11-19  
**Baseado em:** Implementação de /reclamacoes e /devolucoesdevenda  
**Para aplicar em:** /vendas-online, /pedidos
