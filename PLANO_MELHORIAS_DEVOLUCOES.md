# 📋 PLANO DE MELHORIAS - SISTEMA DE DEVOLUÇÕES (RETURNS)

**Data:** 2025-10-24  
**Objetivo:** Melhorar a visualização e gestão de devoluções associadas a claims

---

## 🔍 **AUDITORIA REALIZADA**

### ✅ **O QUE JÁ FUNCIONA:**

1. **Backend (Edge Function `ml-api-direct`):**
   - ✅ Busca `return_details_v2` via `/post-purchase/v2/claims/{claim_id}/returns`
   - ✅ Busca `return_details_v1` via `/post-purchase/v1/claims/{claim_id}/returns`
   - ✅ Identifica `related_entities: ["return"]` quando claim tem devolução
   - ✅ Calcula `has_related_return` boolean
   - ✅ Extrai TODOS os campos de devolução:
     - `status_devolucao`
     - `status_dinheiro` (refund status)
     - `subtipo_devolucao` (return_partial, etc)
     - `data_criacao_devolucao`
     - `data_atualizacao_devolucao`
     - `data_fechamento_devolucao`
     - `reembolso_quando` (refund_at: "delivered", "warehouse", etc)
     - `shipment_id_devolucao`
     - `status_envio_devolucao`
     - `codigo_rastreamento_devolucao`
     - `tipo_envio_devolucao`
     - `destino_devolucao`
     - `endereco_destino_devolucao`
     - `return_intermediate_check`
     - Histórico de rastreamento da devolução

2. **Frontend:**
   - ✅ Badge "TEM DEVOLUÇÃO" aparece na tabela quando `has_related_return = true`
   - ✅ Seção de returns no modal de detalhes (`ClaimReturnsSection`)
   - ✅ Campo `status_devolucao` exibido

### ❌ **O QUE ESTÁ FALTANDO/MELHORAR:**

1. **Visibilidade dos Dados:**
   - ❌ Informações de devolução **não são destacadas** o suficiente
   - ❌ Status do reembolso (`status_dinheiro`) não é exibido claramente
   - ❌ Timeline de rastreamento da devolução não está visível
   - ❌ Quando é "refund_at: delivered" vs "warehouse" não fica claro

2. **Filtros:**
   - ❌ Não existe filtro "Apenas com devolução"
   - ❌ Não existe filtro por status de devolução
   - ❌ Não existe filtro por status de reembolso

3. **Analytics/Dashboard:**
   - ❌ Sem estatísticas específicas de devoluções
   - ❌ Sem análise de tempo médio de devolução
   - ❌ Sem análise de custo de devoluções

---

## 🎯 **PLANO DE IMPLEMENTAÇÃO - 4 FASES**

### **FASE 1: BACKEND - LOGS E VALIDAÇÃO** ✅

**Objetivo:** Garantir que dados de devolução chegam corretamente

**Tarefas:**
1. ✅ Adicionar logs detalhados quando devolução é encontrada
2. ✅ Log do `return_id` extraído
3. ✅ Log dos status (`status`, `status_money`, `subtype`)
4. ✅ Validar que `has_related_return` está correto

**Arquivos:**
- `supabase/functions/ml-api-direct/index.ts` (linhas 1685-1701, 1940-2000)

---

### **FASE 2: FRONTEND - MELHORAR VISUALIZAÇÃO EXISTENTE** 🎯

**Objetivo:** Tornar informações de devolução mais visíveis e úteis

#### **2.1 - Melhorar Badge na Tabela**
**Arquivo:** `src/components/ml/devolucao/DevolucaoTableRow.tsx` (linha 650)

**Mudança:**
```tsx
// ANTES
{devolucao.has_related_return ? (
  <Badge variant="default" className="bg-green-600">
    TEM DEVOLUÇÃO
  </Badge>
) : (
  <span className="text-muted-foreground">-</span>
)}

// DEPOIS - Mostrar STATUS da devolução
{devolucao.has_related_return ? (
  <div className="flex flex-col gap-1">
    <Badge variant="default" className="bg-blue-600">
      📦 DEVOLUÇÃO
    </Badge>
    {devolucao.status_devolucao && (
      <Badge variant="outline" className="text-xs">
        {devolucao.status_devolucao}
      </Badge>
    )}
  </div>
) : (
  <span className="text-muted-foreground">-</span>
)}
```

#### **2.2 - Adicionar Coluna de Status de Reembolso**
**Arquivo:** `src/components/ml/devolucao/DevolucaoTable.tsx`

**Mudança:** Adicionar nova coluna após coluna de devolução:
```tsx
<th className="text-center px-3 py-3 font-semibold text-muted-foreground" style={{minWidth: '140px'}}>
  Status Reembolso
</th>
```

**No Row:**
```tsx
<td className="px-3 py-3 text-center">
  {devolucao.status_dinheiro ? (
    <Badge variant={
      devolucao.status_dinheiro === 'refunded' ? 'default' :
      devolucao.status_dinheiro === 'pending' ? 'secondary' :
      'outline'
    }>
      {devolucao.status_dinheiro}
    </Badge>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</td>
```

#### **2.3 - Melhorar Modal de Detalhes**
**Arquivo:** `src/components/ml/devolucao/DevolucaoDetailsModal.tsx`

**Adicionar seção expandida de devolução:**
```tsx
{devolucao.has_related_return && (
  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Package className="h-5 w-5" />
        📦 Informações da Devolução
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status da Devolução</Label>
          <Badge>{devolucao.status_devolucao}</Badge>
        </div>
        <div>
          <Label>Status do Reembolso</Label>
          <Badge>{devolucao.status_dinheiro}</Badge>
        </div>
        <div>
          <Label>Tipo de Devolução</Label>
          <p>{devolucao.subtipo_devolucao}</p>
        </div>
        <div>
          <Label>Reembolso Quando</Label>
          <Badge variant="outline">{devolucao.reembolso_quando}</Badge>
        </div>
        <div>
          <Label>Código de Rastreamento</Label>
          <p className="font-mono text-sm">{devolucao.codigo_rastreamento_devolucao || '-'}</p>
        </div>
        <div>
          <Label>Destino</Label>
          <p>{devolucao.destino_devolucao}</p>
        </div>
      </div>

      {/* Timeline de Rastreamento */}
      {devolucao.timeline_rastreamento && devolucao.timeline_rastreamento.length > 0 && (
        <div className="mt-4">
          <Label>Timeline de Rastreamento</Label>
          <div className="mt-2 space-y-2">
            {devolucao.timeline_rastreamento.map((event: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-2 bg-white dark:bg-gray-800 rounded border">
                <div className="text-xs text-muted-foreground">
                  {new Date(event.date_created).toLocaleString('pt-BR')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.status}</p>
                  <p className="text-xs text-muted-foreground">{event.substatus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
)}
```

---

### **FASE 3: FILTROS DE DEVOLUÇÕES** 📊

**Objetivo:** Permitir filtrar por devoluções

#### **3.1 - Adicionar Filtro "Tem Devolução"**
**Arquivo:** `src/components/ml/devolucao/DevolucaoFiltersUnified.tsx`

**Adicionar toggle:**
```tsx
<div className="flex items-center gap-2">
  <Switch
    checked={filters.apenasComDevolucao}
    onCheckedChange={(checked) => onFilterChange('apenasComDevolucao', checked)}
  />
  <Label>Apenas com devolução</Label>
</div>
```

#### **3.2 - Adicionar Filtro por Status de Devolução**
```tsx
<Select
  value={filters.statusDevolucao}
  onValueChange={(value) => onFilterChange('statusDevolucao', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Status da Devolução" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todos</SelectItem>
    <SelectItem value="created">Criada</SelectItem>
    <SelectItem value="delivered">Entregue</SelectItem>
    <SelectItem value="cancelled">Cancelada</SelectItem>
    <SelectItem value="expired">Expirada</SelectItem>
  </SelectContent>
</Select>
```

#### **3.3 - Atualizar Lógica de Filtro**
**Arquivo:** `src/features/devolucoes/utils/FilterUtils.ts`

```typescript
// Filtrar por devolução
if (filters.apenasComDevolucao) {
  filtered = filtered.filter(dev => dev.has_related_return === true);
}

// Filtrar por status de devolução
if (filters.statusDevolucao && filters.statusDevolucao !== 'all') {
  filtered = filtered.filter(dev => 
    dev.status_devolucao === filters.statusDevolucao
  );
}
```

---

### **FASE 4: ANALYTICS E DASHBOARD** 📈

**Objetivo:** Estatísticas sobre devoluções

#### **4.1 - Card de Estatísticas de Devoluções**
**Novo componente:** `src/components/ml/devolucao/DevolucoesStats.tsx`

```tsx
export function DevolucoesStats({ devolucoes }: { devolucoes: any[] }) {
  const comDevolucao = devolucoes.filter(d => d.has_related_return);
  const percentual = (comDevolucao.length / devolucoes.length) * 100;
  
  const reembolsadas = comDevolucao.filter(d => d.status_dinheiro === 'refunded').length;
  const pendentes = comDevolucao.filter(d => d.status_dinheiro === 'pending').length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>📦 Estatísticas de Devoluções</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total com Devolução</p>
            <p className="text-2xl font-bold">{comDevolucao.length}</p>
            <p className="text-xs text-muted-foreground">{percentual.toFixed(1)}% do total</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reembolsadas</p>
            <p className="text-2xl font-bold text-green-600">{reembolsadas}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{pendentes}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### **4.2 - Gráfico de Timeline**
Mostrar distribuição de devoluções por período

---

## 🎬 **ORDEM DE IMPLEMENTAÇÃO**

### **Sprint 1 - Básico (2-3 horas)**
1. ✅ Fase 1: Adicionar logs no backend
2. ✅ Fase 2.1: Melhorar badge na tabela
3. ✅ Fase 2.2: Adicionar coluna de status de reembolso

### **Sprint 2 - Detalhamento (3-4 horas)**
4. Fase 2.3: Melhorar modal de detalhes
5. Fase 3.1: Filtro "Tem Devolução"
6. Fase 3.2: Filtro por status

### **Sprint 3 - Analytics (2-3 horas)**
7. Fase 3.3: Lógica de filtros
8. Fase 4.1: Card de estatísticas
9. Fase 4.2: Gráficos

---

## 📊 **CAMPOS DISPONÍVEIS DE DEVOLUÇÃO**

Todos esses campos já estão sendo extraídos pelo backend:

```typescript
interface DevolucaoReturn {
  // Status
  status_devolucao: string;           // 'created', 'delivered', 'cancelled', 'expired'
  status_dinheiro: string;            // 'refunded', 'pending', 'not_refunded'
  subtipo_devolucao: string;          // 'return_partial', 'return_full'
  
  // Datas
  data_criacao_devolucao: string;
  data_atualizacao_devolucao: string;
  data_fechamento_devolucao: string;
  
  // Reembolso
  reembolso_quando: string;           // 'delivered', 'warehouse', 'immediate'
  
  // Rastreamento
  shipment_id_devolucao: string;
  status_envio_devolucao: string;
  codigo_rastreamento_devolucao: string;
  tipo_envio_devolucao: string;       // 'return'
  destino_devolucao: string;          // 'warehouse', 'seller'
  endereco_destino_devolucao: object;
  
  // Timeline
  timeline_rastreamento: Array<{
    date_created: string;
    status: string;
    substatus: string;
    description: string;
  }>;
  
  // Checagem
  return_intermediate_check: boolean;
  return_resource_type: string;
  
  // Relação
  has_related_return: boolean;
  related_entities: string[];         // ['return']
}
```

---

## 🎯 **RESULTADO ESPERADO**

Após implementação completa:

1. ✅ Usuário vê **claramente** quais claims têm devolução
2. ✅ Usuário vê **status do reembolso** sem abrir modal
3. ✅ Usuário pode **filtrar** apenas devoluções
4. ✅ Usuário pode **filtrar** por status de devolução
5. ✅ Usuário vê **timeline completa** da devolução no modal
6. ✅ Usuário tem **dashboard** com estatísticas de devoluções
7. ✅ Todos os dados já existentes são aproveitados ao máximo

---

## 📝 **NOTAS TÉCNICAS**

- Backend já está 100% funcional ✅
- Dados já chegam no frontend ✅
- Falta apenas **UI/UX** para exibir melhor ✅
- Zero mudanças necessárias na edge function ✅
- Foco total em melhorias visuais e de filtros ✅
