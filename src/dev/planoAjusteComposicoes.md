# 📋 PLANO DE AJUSTE - SISTEMA DE COMPOSIÇÕES

## 🎯 OBJETIVO
Corrigir o sistema para que produtos **SEM composição cadastrada** não apareçam como "Pronto p/ Baixar" e bloqueie a baixa de estoque até que a composição seja configurada.

---

## 📝 ETAPAS DO AJUSTE

### **ETAPA 1: Adicionar Novo Status "sem_composicao"**

#### **Arquivo:** `src/services/MapeamentoService.ts`
**Ação:** Modificar type e adicionar verificação de composição

```typescript
// LINHA 14: Adicionar novo status
statusBaixa?: 'pronto_baixar' | 'sem_estoque' | 'sem_mapear' | 'sku_nao_cadastrado' | 'pedido_baixado' | 'sem_composicao';

// LINHAS 100-122: Modificar lógica de verificação
if (!temMapeamento || !skuEstoque) {
  statusBaixa = 'sem_mapear';
} else {
  const produtoInfo = produtosInfoMap.get(skuEstoque);
  
  if (!produtoInfo?.existe) {
    statusBaixa = 'sku_nao_cadastrado';
    skuCadastradoNoEstoque = false;
  } else if (produtoInfo.quantidade <= 0) {
    statusBaixa = 'sem_estoque';
    skuCadastradoNoEstoque = true;
  } else {
    // 🔍 NOVO: Verificar se tem composição
    const { data: temComposicao } = await supabase
      .from('produto_componentes')
      .select('id')
      .eq('sku_produto', skuEstoque)
      .limit(1)
      .maybeSingle();
    
    if (!temComposicao) {
      statusBaixa = 'sem_composicao';
    } else {
      statusBaixa = 'pronto_baixar';
    }
    skuCadastradoNoEstoque = true;
  }
}
```

---

### **ETAPA 2: Bloquear Baixa Sem Composição**

#### **Arquivo:** `src/hooks/useEstoqueBaixa.ts`
**Ação:** Adicionar validação antes de processar baixa

```typescript
// LINHAS 183-216: Adicionar validação de composições ANTES da validação de estoque
console.log('🔍 Verificando composições dos produtos...');
const skusParaValidarComposicao = baixas.map(b => b.sku);

const { data: composicoesExistentes, error: composicaoError } = await supabase
  .from('produto_componentes')
  .select('sku_produto')
  .in('sku_produto', skusParaValidarComposicao);

if (composicaoError) {
  console.error('❌ Erro ao verificar composições:', composicaoError);
  throw new Error('Erro ao verificar composições dos produtos');
}

const skusComComposicao = new Set(composicoesExistentes?.map(c => c.sku_produto) || []);
const skusSemComposicao = skusParaValidarComposicao.filter(sku => !skusComComposicao.has(sku));

if (skusSemComposicao.length > 0) {
  const erroMsg = `❌ Os seguintes SKUs não têm composição cadastrada: ${skusSemComposicao.join(', ')}.\n\n` +
                  `Por favor, cadastre as composições em /estoque/composicoes antes de fazer a baixa.`;
  console.error(erroMsg);
  throw new Error(erroMsg);
}

console.log('✅ Todos os SKUs possuem composição cadastrada');

// LINHAS 251-254: Modificar para ERRO em vez de "continue"
if (!composicao || composicao.length === 0) {
  const erroMsg = `❌ ERRO CRÍTICO: SKU ${skuMapeado} passou na validação mas não tem composição!`;
  console.error(erroMsg);
  throw new Error(erroMsg);
}
```

---

### **ETAPA 3: Adicionar Visual para Novo Status**

#### **Arquivo:** `src/components/pedidos/SimplePedidosPage.tsx`
**Ação:** Adicionar ícone e badge para "sem_composicao"

```typescript
// Procurar função getStatusIcon (aproximadamente linha 900-950)
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pronto_baixar': return <CheckCircle className="h-4 w-4 text-success" />;
    case 'sem_estoque': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'sem_mapear': return <Clock className="h-4 w-4 text-warning" />;
    case 'sku_nao_cadastrado': return <Database className="h-4 w-4 text-orange-500" />;
    case 'sem_composicao': return <AlertCircle className="h-4 w-4 text-orange-600" />; // NOVO
    default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  }
};

// Procurar função getStatusBadge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pronto_baixar': return <Badge variant="default">Pronto p/ Baixar</Badge>;
    case 'sem_estoque': return <Badge variant="destructive">Sem Estoque</Badge>;
    case 'sem_mapear': return <Badge variant="secondary">Sem Mapear</Badge>;
    case 'sku_nao_cadastrado': return <Badge variant="outline" className="bg-orange-500/10">SKU não cadastrado</Badge>;
    case 'sem_composicao': return <Badge variant="outline" className="bg-orange-600/10 text-orange-600">Sem Composição</Badge>; // NOVO
    default: return <Badge variant="outline">Indefinido</Badge>;
  }
};
```

---

### **ETAPA 4: Atualizar Modal de Baixa**

#### **Arquivo:** `src/components/pedidos/BaixaEstoqueModal.tsx`
**Ação:** Adicionar status "sem_composicao" nos componentes visuais

```typescript
// LINHA 14: Atualizar type
statusBaixa?: 'pronto_baixar' | 'sem_estoque' | 'sem_mapear' | 'sku_nao_cadastrado' | 'pedido_baixado' | 'sem_composicao';

// LINHA 65: Atualizar lógica de statusBaixaCalc
if (!temMapeamento) {
  statusBaixaCalc = 'sem_mapear';
} else if (mapping?.statusBaixa === 'sem_composicao') {
  statusBaixaCalc = 'sem_composicao';
} else if (mapping?.statusBaixa === 'sku_nao_cadastrado') {
  statusBaixaCalc = 'sku_nao_cadastrado';
} else if (mapping?.statusBaixa === 'sem_estoque') {
  statusBaixaCalc = 'sem_estoque';
} else {
  statusBaixaCalc = temMapeamento ? 'pronto_baixar' : 'sem_mapear';
}

// LINHAS 168-176: Adicionar ícone
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pronto_baixar': return <CheckCircle className="h-4 w-4 text-success" />;
    case 'sem_estoque': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'sem_mapear': return <Clock className="h-4 w-4 text-warning" />;
    case 'sku_nao_cadastrado': return <Database className="h-4 w-4 text-orange-500" />;
    case 'sem_composicao': return <AlertCircle className="h-4 w-4 text-orange-600" />; // NOVO
    default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  }
};

// LINHAS 178-186: Adicionar badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pronto_baixar': return <Badge variant="default">Pronto</Badge>;
    case 'sem_estoque': return <Badge variant="destructive">Sem Estoque</Badge>;
    case 'sem_mapear': return <Badge variant="secondary">Sem Mapeamento</Badge>;
    case 'sku_nao_cadastrado': return <Badge variant="outline">SKU sem cadastro</Badge>;
    case 'sem_composicao': return <Badge variant="outline" className="text-orange-600">Sem Composição</Badge>; // NOVO
    default: return <Badge variant="outline">Indefinido</Badge>;
  }
};

// LINHA 126-130: Atualizar filtro de pedidos prontos
const pedidosProntos = pedidosAnalise.filter(p => 
  p.temEstoque && 
  p.temMapeamento && 
  p.statusBaixa === 'pronto_baixar' && // Só processar se for realmente "pronto_baixar"
  p.statusBaixa !== 'sem_composicao'   // NOVO: Bloquear sem composição
);
```

---

### **ETAPA 5: Adicionar Filtro Rápido**

#### **Arquivo:** `src/components/pedidos/SimplePedidosPage.tsx`
**Ação:** Adicionar opção de filtro rápido para "sem_composicao"

```typescript
// LINHA 302: Adicionar ao type do filtro rápido
const [quickFilter, setQuickFilter] = useState<
  'all' | 'pronto_baixar' | 'mapear_incompleto' | 'baixado' | 'shipped' | 
  'delivered' | 'sem_estoque' | 'sku_nao_cadastrado' | 'sem_composicao'  // NOVO
>('all');

// LINHA 307-346: Adicionar case no switch
switch (quickFilter) {
  // ... outros cases
  case 'sem_composicao':
    return mapping?.statusBaixa === 'sem_composicao';
  // ...
}
```

---

### **ETAPA 6: Adicionar Card no Dashboard**

#### **Arquivo:** `src/components/pedidos/components/PedidosDashboardSection.tsx`
**Ação:** Adicionar card para pedidos sem composição (se existir)

```typescript
// Adicionar card laranja para "Sem Composição"
<Card 
  className="cursor-pointer hover:shadow-md transition-shadow border-orange-500/20"
  onClick={() => handleQuickFilterChange('sem_composicao')}
>
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Sem Composição</p>
        <p className="text-2xl font-bold text-orange-600">
          {globalCounts?.semComposicao || 0}
        </p>
      </div>
      <AlertCircle className="h-8 w-8 text-orange-500" />
    </div>
  </CardContent>
</Card>
```

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] **Etapa 1:** Adicionar status "sem_composicao" no MapeamentoService
- [ ] **Etapa 2:** Bloquear baixa sem composição no useEstoqueBaixa
- [ ] **Etapa 3:** Adicionar visual no SimplePedidosPage
- [ ] **Etapa 4:** Atualizar BaixaEstoqueModal
- [ ] **Etapa 5:** Adicionar filtro rápido
- [ ] **Etapa 6:** Adicionar card no dashboard

---

## 🧪 TESTES NECESSÁRIOS

### **Teste 1: Status Correto**
1. Ir em `/pedidos`
2. Verificar se "FL-14-TRAN-1" aparece como "Sem Composição" (laranja)
3. ✅ Status correto exibido

### **Teste 2: Bloqueio de Baixa**
1. Tentar processar baixa de pedido sem composição
2. Deve exibir erro: "SKU não tem composição cadastrada"
3. Deve orientar: "Configure em /estoque/composicoes"
4. ✅ Baixa bloqueada com mensagem clara

### **Teste 3: Fluxo Completo**
1. Cadastrar composição em `/estoque/composicoes`
2. Voltar em `/pedidos`
3. Status deve mudar para "Pronto p/ Baixar"
4. Processar baixa com sucesso
5. ✅ Fluxo completo funcionando

---

## 🎯 RESULTADO ESPERADO

### **ANTES:**
- ❌ "FL-14-TRAN-1" → Status: "Pronto p/ Baixar" (INCORRETO)
- ❌ Baixa processa e pula silenciosamente
- ❌ Usuário confuso sem orientação

### **DEPOIS:**
- ✅ "FL-14-TRAN-1" → Status: "Sem Composição" (CORRETO)
- ✅ Baixa bloqueada com erro claro
- ✅ Mensagem: "Configure em /estoque/composicoes"
- ✅ Após cadastrar composição → Status muda para "Pronto p/ Baixar"

---

## ⏱️ TEMPO ESTIMADO
- **Implementação:** 30-40 minutos
- **Testes:** 15-20 minutos
- **Total:** ~1 hora

---

## 🚀 PRÓXIMOS PASSOS
1. Revisar e aprovar este plano
2. Executar implementação seguindo as etapas
3. Testar cada etapa individualmente
4. Validar fluxo completo
5. Documentar mudanças
