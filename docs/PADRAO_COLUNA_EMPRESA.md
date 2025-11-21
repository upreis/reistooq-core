# 📋 PADRÃO: COLUNA EMPRESA (Account Name)

## 🎯 Problema
Páginas que exibem dados de múltiplas contas do Mercado Livre precisam mostrar de qual empresa/conta cada registro pertence.

## ✅ Solução Implementada em /reclamacoes

A página /reclamacoes implementa a coluna "Empresa" seguindo um padrão completo que enriquece os dados com o nome da conta durante a busca.

---

## 📦 Arquitetura da Solução

### 1️⃣ **BUSCA DE DADOS DAS CONTAS**
Primeiro, buscar informações completas das contas selecionadas:

```typescript
// Buscar seller_id e nome das contas
const { data: accountsData, error: accountsError } = await supabase
  .from('integration_accounts')
  .select('id, account_identifier, name')
  .in('id', selectedAccountIds);

if (accountsError || !accountsData || accountsData.length === 0) {
  console.error('Erro ao buscar dados das contas:', accountsError);
  throw new Error('Não foi possível obter informações das contas');
}
```

**Campos necessários:**
- `id`: UUID da conta no Supabase
- `account_identifier`: Seller ID do Mercado Livre
- `name`: Nome amigável da empresa/conta

---

### 2️⃣ **ENRIQUECIMENTO DOS DADOS**
Durante o processamento dos dados retornados pela Edge Function, adicionar o nome da empresa a cada item:

```typescript
// Para cada conta
for (const account of accountsData) {
  // ... buscar dados da edge function ...
  
  // ✅ ENRIQUECER CADA ITEM COM O NOME DA EMPRESA
  const itemsWithEmpresa = data.items.map((item: any) => ({
    ...item,
    account_name: account.name,        // Nome da empresa
    account_id: account.id,            // ID da conta (opcional, útil para filtros)
    empresa: account.name || account.account_identifier  // Fallback
  }));
  
  allItems.push(...itemsWithEmpresa);
}
```

**⚠️ IMPORTANTE:** 
- Adicionar `account_name` DURANTE a busca, não depois
- Usar `account.name` como valor primário
- Fallback para `account.account_identifier` se name não existir

---

### 3️⃣ **DEFINIÇÃO DA COLUNA NA TABELA**
Criar coluna ordenável na definição de colunas:

```typescript
// src/features/[sua-feature]/components/[Sua]TableColumns.tsx
{
  accessorKey: 'account_name',
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Empresa
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  },
  cell: ({ row }) => (
    <span className="text-sm font-medium">
      {row.getValue('account_name') || '-'}
    </span>
  ),
  size: 120,  // Largura sugerida
}
```

---

### 4️⃣ **CONFIGURAÇÃO DA COLUNA (Column Manager)**
Se a página usa sistema de Column Manager, adicionar à configuração:

```typescript
// src/features/[sua-feature]/config/columns.config.ts
{
  key: 'empresa',
  label: 'Empresa',
  category: 'basic',
  priority: 'essential',
  visible: true,
  default: true,
  description: 'Empresa/Conta do Mercado Livre',
  width: 120,
  sortable: true,
  filterable: true
}
```

---

### 5️⃣ **SELETOR DE COLUNAS**
Adicionar ao mapeamento de nomes no ColumnSelector:

```typescript
// src/features/[sua-feature]/components/[Sua]ColumnSelector.tsx
const columnNameMap: Record<string, string> = {
  // ... outras colunas
  'empresa': 'Empresa',
  'account_name': 'Empresa',
  // ... 
};
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Passo 1: Hook de Busca
- [ ] Buscar `integration_accounts` com `id, account_identifier, name`
- [ ] Filtrar por `selectedAccountIds`
- [ ] Validar que accountsData não está vazio

### ✅ Passo 2: Enriquecimento
- [ ] Mapear cada item retornado
- [ ] Adicionar `account_name: account.name`
- [ ] Adicionar `account_id: account.id` (opcional)
- [ ] Adicionar `empresa` como fallback (opcional)

### ✅ Passo 3: Coluna na Tabela
- [ ] Criar coluna com `accessorKey: 'account_name'`
- [ ] Adicionar botão de ordenação no header
- [ ] Renderizar célula com fallback para '-'
- [ ] Definir largura apropriada (sugestão: 120px)

### ✅ Passo 4: Configuração
- [ ] Adicionar à `columns.config.ts`
- [ ] Marcar como `priority: 'essential'`
- [ ] Habilitar `sortable: true`

### ✅ Passo 5: Seletor
- [ ] Adicionar ao `columnNameMap`
- [ ] Testar visibilidade/ocultação da coluna

---

## 🎨 EXEMPLO COMPLETO (ReclamacoesPage.tsx)

```typescript
// 1️⃣ BUSCAR DADOS DAS CONTAS
const { data: accountsData, error: accountsError } = await supabase
  .from('integration_accounts')
  .select('id, account_identifier, name')
  .in('id', selectedAccountIds);

if (accountsError || !accountsData) {
  throw new Error('Erro ao buscar contas');
}

// 2️⃣ BUSCAR E ENRIQUECER DADOS
const allClaims: any[] = [];

for (const account of accountsData) {
  // Buscar claims da edge function
  const { data } = await supabase.functions.invoke('ml-claims-fetch', {
    body: {
      accountId: account.id,
      sellerId: account.account_identifier,
      // ... outros filtros
    }
  });

  // ✅ ENRIQUECER COM NOME DA EMPRESA
  const claimsWithAccount = data.claims.map((claim: any) => ({
    ...claim,
    account_name: account.name,
    account_id: account.id
  }));

  allClaims.push(...claimsWithAccount);
}

// 3️⃣ USAR OS DADOS ENRIQUECIDOS
setReclamacoes(allClaims);
```

---

## 🔄 FLUXO DE DADOS

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USUÁRIO SELECIONA EMPRESAS                               │
│    selectedAccountIds: [uuid1, uuid2, uuid3]                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BUSCAR DADOS DAS CONTAS                                  │
│    SELECT id, account_identifier, name                      │
│    FROM integration_accounts                                │
│    WHERE id IN (selectedAccountIds)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PARA CADA CONTA: BUSCAR DADOS DA API ML                  │
│    Edge Function ml-claims-fetch                            │
│    Body: { accountId, sellerId, filters }                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ENRIQUECER CADA ITEM COM account_name                    │
│    claims.map(claim => ({                                   │
│      ...claim,                                              │
│      account_name: account.name                             │
│    }))                                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ACUMULAR TODOS OS ITENS                                  │
│    allClaims.push(...claimsWithAccount)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. RENDERIZAR TABELA COM COLUNA EMPRESA                     │
│    <TableCell>{row.getValue('account_name')}</TableCell>    │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ PROBLEMAS COMUNS

### ❌ Problema 1: Coluna aparece vazia
**Causa:** Campo `account_name` não foi adicionado durante enriquecimento
**Solução:** Verificar se `.map()` está adicionando o campo corretamente

### ❌ Problema 2: Todas as linhas mostram mesma empresa
**Causa:** Enriquecimento está fora do loop de contas
**Solução:** Mover `.map()` para DENTRO do `for (const account of accountsData)`

### ❌ Problema 3: Erro "account is undefined"
**Causa:** accountsData está vazio ou query falhou
**Solução:** Validar retorno de `integration_accounts` antes do loop

### ❌ Problema 4: Coluna não ordena corretamente
**Causa:** `accessorKey` está errado ou campo não existe nos dados
**Solução:** Usar exatamente `accessorKey: 'account_name'` e verificar dados

---

## 🎯 ARQUIVOS DE REFERÊNCIA

Veja implementação completa em `/reclamacoes`:
- **Hook de busca:** `src/features/reclamacoes/pages/ReclamacoesPage.tsx` (linhas 85-210)
- **Definição de coluna:** `src/features/reclamacoes/components/ReclamacoesTableColumns.tsx` (linhas 310-324)
- **Configuração:** `src/features/reclamacoes/config/columns.config.ts`

---

## 💡 DICAS

1. **Sempre enriquecer durante a busca**, não depois
2. **Use `account.name`** como valor primário (mais amigável que account_identifier)
3. **Adicione fallback** para '-' na renderização da célula
4. **Marque como essential** no column manager se aplicável
5. **Habilite ordenação** para facilitar navegação

---

## 🚀 PRONTO PARA REPLICAR

Este padrão está validado e funcionando em `/reclamacoes`. 

Para aplicar em outra página:
1. Copie o código de busca de `integration_accounts`
2. Copie o enriquecimento com `.map()`
3. Copie a definição da coluna
4. Teste ordenação e visibilidade

**Tempo estimado de implementação:** 15-20 minutos
