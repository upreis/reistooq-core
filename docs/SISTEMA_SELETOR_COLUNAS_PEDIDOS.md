# 📋 Sistema de Seletor de Colunas - Página /pedidos

## 🎯 Visão Geral

O sistema de seletor de colunas da página `/pedidos` é uma implementação avançada que permite aos usuários personalizar completamente quais colunas da tabela são exibidas, com suporte a perfis pré-definidos, busca, categorização e persistência de preferências.

---

## 📁 Arquitetura de Arquivos

### 1. **Tipos TypeScript**
📄 `src/features/pedidos/types/columns.types.ts`

Define todas as interfaces e tipos utilizados pelo sistema:

```typescript
// Categorias disponíveis para agrupar colunas
export type ColumnCategory = 
  | 'basic'      // Colunas básicas (ID, Empresa, Número, etc.)
  | 'products'   // Produtos e SKUs
  | 'financial'  // Valores, taxas, receitas
  | 'mapping'    // Mapeamento de SKUs, status de baixa
  | 'shipping'   // Envio, rastreamento, endereços
  | 'meta'       // Metadados ML (Pack ID, Pickup ID, Tags)
  | 'ml';        // Dados específicos do Mercado Livre

// Prioridade da coluna
export type ColumnPriority = 'essential' | 'important' | 'optional';

// Definição de uma coluna
export interface ColumnDefinition {
  key: string;              // Identificador único
  label: string;            // Nome exibido no seletor
  category: ColumnCategory; // Categoria para agrupamento
  priority: ColumnPriority; // Prioridade (afeta perfis)
  visible: boolean;         // Visível atualmente?
  default: boolean;         // Faz parte do perfil padrão?
  description?: string;     // Descrição da coluna
  width?: number;           // Largura sugerida
  sortable?: boolean;       // Pode ordenar?
  filterable?: boolean;     // Pode filtrar?
}

// Perfil de colunas (conjunto pré-definido)
export interface ColumnProfile {
  id: string;
  name: string;
  description: string;
  columns: string[];        // Array de keys das colunas
}

// Estado do sistema de colunas
export interface ColumnState {
  visibleColumns: Set<string>;      // Colunas visíveis
  columnOrder: string[];            // Ordem das colunas
  activeProfile: string | null;     // Perfil ativo
  customProfiles: ColumnProfile[];  // Perfis customizados
}

// Ações disponíveis
export interface ColumnActions {
  toggleColumn: (key: string) => void;
  showColumn: (key: string) => void;
  hideColumn: (key: string) => void;
  setVisibleColumns: (columns: string[]) => void;
  reorderColumns: (columnOrder: string[]) => void;
  loadProfile: (profileId: string) => void;
  saveProfile: (profile: Omit<ColumnProfile, 'id'>) => void;
  deleteProfile: (profileId: string) => void;
  resetToDefault: () => void;
  resetToEssentials: () => void;
}

// Retorno completo do hook
export interface UseColumnManagerReturn {
  state: ColumnState;
  actions: ColumnActions;
  definitions: ColumnDefinition[];
  visibleDefinitions: ColumnDefinition[];
  profiles: ColumnProfile[];
}
```

---

### 2. **Configuração Centralizada**
📄 `src/features/pedidos/config/columns.config.ts`

Define TODAS as colunas disponíveis e perfis pré-definidos:

```typescript
// Array com TODAS as 45 colunas disponíveis
export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // BÁSICAS
  { key: 'id', label: 'ID-Único', category: 'basic', priority: 'essential', ... },
  { key: 'empresa', label: 'Empresa', category: 'basic', priority: 'essential', ... },
  { key: 'numero', label: 'Número do Pedido', category: 'basic', ... },
  
  // PRODUTOS
  { key: 'skus_produtos', label: 'SKUs/Produtos', category: 'products', ... },
  { key: 'quantidade_itens', label: 'Quantidade Total', category: 'products', ... },
  
  // FINANCEIRAS
  { key: 'valor_total', label: 'Valor Total', category: 'financial', ... },
  { key: 'receita_flex', label: 'Receita Flex (Bônus)', category: 'financial', ... },
  { key: 'marketplace_fee', label: 'Taxa Marketplace', category: 'financial', ... },
  
  // MAPEAMENTO
  { key: 'cpf_cnpj', label: 'CPF/CNPJ', category: 'mapping', ... },
  { key: 'sku_estoque', label: 'SKU Estoque', category: 'mapping', ... },
  { key: 'status_baixa', label: 'Status da Baixa', category: 'mapping', ... },
  
  // ENVIO
  { key: 'shipping_status', label: 'Status do Envio', category: 'shipping', ... },
  { key: 'codigo_rastreamento', label: 'Código Rastreamento', category: 'shipping', ... },
  { key: 'endereco_cidade', label: 'Cidade', category: 'shipping', ... },
  
  // METADADOS ML
  { key: 'pack_id', label: 'Pack ID', category: 'meta', ... },
  { key: 'pickup_id', label: 'Pickup ID', category: 'meta', ... },
  { key: 'tags', label: 'Tags do Pedido', category: 'meta', ... }
];

// Perfis pré-definidos
export const DEFAULT_PROFILES: ColumnProfile[] = [
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Visualização padrão com colunas essenciais e importantes',
    columns: COLUMN_DEFINITIONS.filter(col => col.default).map(col => col.key)
  },
  {
    id: 'essential',
    name: 'Essencial',
    description: 'Apenas colunas essenciais para análise rápida',
    columns: COLUMN_DEFINITIONS.filter(col => col.priority === 'essential').map(col => col.key)
  },
  {
    id: 'complete',
    name: 'Completo',
    description: 'Todas as colunas disponíveis',
    columns: COLUMN_DEFINITIONS.map(col => col.key)
  }
];

// Labels das categorias
export const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Básicas',
  products: 'Produtos',
  financial: 'Financeiras',
  mapping: 'Mapeamento',
  shipping: 'Envio',
  meta: 'Metadados ML',
  ml: 'Mercado Livre'
};
```

---

### 3. **Hook de Gerenciamento**
📄 `src/features/pedidos/hooks/useColumnManager.ts`

Gerencia estado, persistência e ações:

#### **Persistência Inteligente**
```typescript
const STORAGE_KEY = 'pedidos-column-preferences-v5';

// Carrega preferências do localStorage
const loadStoredPreferences = (): Partial<ColumnState> => {
  // 1. Tenta carregar da última consulta PRIMEIRO
  const lastSearch = localStorage.getItem('pedidos:lastSearch');
  if (lastSearch) {
    const parsed = JSON.parse(lastSearch);
    return { visibleColumns: new Set(parsed.visibleColumns) };
  }
  
  // 2. Fallback para configuração separada
  const stored = localStorage.getItem(STORAGE_KEY);
  // ... validação e remapeamento de chaves legadas
};

// Salva em DOIS locais (configuração + última consulta)
const savePreferences = (state: ColumnState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  
  // Atualiza também na última consulta
  const lastSearch = localStorage.getItem('pedidos:lastSearch');
  if (lastSearch) {
    const parsed = JSON.parse(lastSearch);
    parsed.visibleColumns = state.visibleColumns;
    localStorage.setItem('pedidos:lastSearch', JSON.stringify(parsed));
  }
};
```

#### **Ações Disponíveis**
```typescript
export const useColumnManager = (): UseColumnManagerReturn => {
  const [state, setState] = useState<ColumnState>(() => {
    const initial = getInitialState();
    const stored = loadStoredPreferences();
    return stored.visibleColumns ? { ...initial, ...stored } : initial;
  });

  // Auto-save quando estado mudar
  useEffect(() => {
    savePreferences(state);
  }, [state]);

  const actions: ColumnActions = {
    toggleColumn: (key) => { /* ... */ },
    showColumn: (key) => { /* ... */ },
    hideColumn: (key) => { /* ... */ },
    setVisibleColumns: (columns) => { /* ... */ },
    loadProfile: (profileId) => { /* ... */ },
    resetToDefault: () => { /* ... */ },
    resetToEssentials: () => { /* ... */ }
  };

  return { state, actions, definitions: COLUMN_DEFINITIONS, ... };
};
```

---

### 4. **Componente de Interface**
📄 `src/features/pedidos/components/ColumnManager.tsx`

Interface visual do seletor:

#### **Estrutura da UI**
```tsx
export function ColumnManager({ manager, onColumnsChange }: ColumnManagerProps) {
  const { state, actions, definitions, profiles } = manager || useColumnManager();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
          Colunas ({visibleCount})
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[600px] sm:w-[700px]">
        {/* 1. Seletor de Perfis */}
        <Select value={state.activeProfile} onValueChange={actions.loadProfile}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um perfil" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map(profile => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name} ({profile.columns.length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 2. Ações Rápidas */}
        <div className="flex gap-2">
          <Button onClick={actions.resetToEssentials}>Essenciais</Button>
          <Button onClick={actions.resetToDefault}>Padrão</Button>
          <Button onClick={() => actions.setVisibleColumns(definitions.map(d => d.key))}>
            Todas
          </Button>
        </div>

        {/* 3. Filtros */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nome da coluna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* 4. Lista de Colunas por Categoria */}
        {Object.entries(groupedColumns).map(([category, columns]) => (
          <div key={category}>
            {/* Checkbox da categoria (select all) */}
            <Checkbox
              checked={allVisible}
              indeterminate={someVisible}
              onCheckedChange={(checked) => handleCategoryToggle(category, checked)}
            />
            <span>{CATEGORY_LABELS[category]}</span>
            <Badge>{visibleInCategory}/{columns.length}</Badge>

            {/* Colunas individuais */}
            {columns.map(col => (
              <div key={col.key}>
                <Checkbox
                  checked={state.visibleColumns.has(col.key)}
                  onCheckedChange={() => actions.toggleColumn(col.key)}
                />
                <span>{col.label}</span>
                {col.description && <p className="text-xs">{col.description}</p>}
              </div>
            ))}
          </div>
        ))}

        {/* 5. Footer */}
        <div className="flex justify-between">
          <span>{visibleCount} de {totalCount} colunas selecionadas</span>
          <Button onClick={() => setIsOpen(false)}>Aplicar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│ 1. INICIALIZAÇÃO                                │
│                                                 │
│  useColumnManager()                             │
│    ↓                                            │
│  loadStoredPreferences()                        │
│    ↓                                            │
│  ✅ Carrega de pedidos:lastSearch (prioridade)  │
│  ✅ Fallback: pedidos-column-preferences-v5     │
│    ↓                                            │
│  Inicializa state com preferências salvas       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. INTERAÇÃO DO USUÁRIO                         │
│                                                 │
│  ColumnManager Component                        │
│    ↓                                            │
│  Usuário clica em coluna/perfil/ação            │
│    ↓                                            │
│  Chama action (toggleColumn, loadProfile, etc.) │
│    ↓                                            │
│  setState() atualiza estado                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. PERSISTÊNCIA AUTOMÁTICA                      │
│                                                 │
│  useEffect detecta mudança no state             │
│    ↓                                            │
│  savePreferences(state)                         │
│    ↓                                            │
│  ✅ Salva em pedidos-column-preferences-v5      │
│  ✅ Sincroniza com pedidos:lastSearch           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. RENDERIZAÇÃO DA TABELA                       │
│                                                 │
│  visibleDefinitions (computed)                  │
│    ↓                                            │
│  Filtra definitions por state.visibleColumns    │
│    ↓                                            │
│  Ordena por state.columnOrder                   │
│    ↓                                            │
│  Tabela renderiza apenas colunas visíveis       │
└─────────────────────────────────────────────────┘
```

---

## 📊 Funcionalidades

### ✅ Perfis Pré-definidos
- **Padrão**: Colunas essenciais + importantes com `default: true`
- **Essencial**: Apenas colunas com `priority: 'essential'`
- **Completo**: Todas as 45 colunas disponíveis

### 🔍 Busca e Filtro
- Busca por nome da coluna ou descrição
- Filtro por categoria (Básicas, Produtos, Financeiras, etc.)
- Combina ambos os filtros simultaneamente

### 📂 Categorização Inteligente
- Colunas agrupadas por categoria
- Checkbox de categoria permite selecionar/desmarcar todas de uma vez
- Badge mostra quantas colunas da categoria estão visíveis

### 💾 Persistência Dupla
1. **pedidos-column-preferences-v5**: Configuração dedicada
2. **pedidos:lastSearch**: Sincronização com filtros da última busca

### ♻️ Remapeamento de Chaves Legadas
```typescript
const aliasMap: Record<string, string> = {
  cidade: 'endereco_cidade',
  uf: 'endereco_uf',
  rua: 'endereco_rua',
  // ... garante compatibilidade com versões antigas
};
```

### 🧹 Limpeza de Colunas Removidas
```typescript
const removedColumns = new Set([
  'marketplace_fee_detail', 'payment_issuer', 'refund_data',
  // ... filtra colunas que foram descontinuadas
]);
```

---

## 🛠️ Como Aplicar em Outras Páginas

### Passo 1: Copiar Estrutura de Arquivos
```bash
# Estrutura base
src/features/[PÁGINA]/
  ├── types/
  │   └── columns.types.ts      # Copiar de /pedidos
  ├── config/
  │   └── columns.config.ts     # Adaptar colunas específicas
  ├── hooks/
  │   └── useColumnManager.ts   # Copiar de /pedidos
  └── components/
      └── ColumnManager.tsx     # Copiar de /pedidos
```

### Passo 2: Definir Colunas Específicas
Editar `columns.config.ts`:

```typescript
export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    key: 'claim_id',
    label: 'N.º da Reclamação',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Número identificador da reclamação',
    width: 150
  },
  // ... definir todas as colunas da página
];

export const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Básicas',
  dates: 'Datas',
  customer: 'Cliente',
  // ... adaptar categorias
};
```

### Passo 3: Ajustar Persistência
Editar `useColumnManager.ts`:

```typescript
const STORAGE_KEY = '[PÁGINA]-column-preferences-v1'; // Nome único
const LAST_SEARCH_KEY = '[PÁGINA]:lastSearch';        // Chave de busca
```

### Passo 4: Integrar na Página
```tsx
import { ColumnManager } from './components/ColumnManager';
import { useColumnManager } from './hooks/useColumnManager';

export function MinhaPage() {
  const columnManager = useColumnManager();
  
  return (
    <div>
      {/* Seletor de Colunas */}
      <ColumnManager manager={columnManager} />
      
      {/* Tabela usando columnManager.visibleDefinitions */}
      <Table columns={columnManager.visibleDefinitions} />
    </div>
  );
}
```

---

## 📌 Checklist de Implementação

- [ ] Copiar `types/columns.types.ts`
- [ ] Criar `config/columns.config.ts` com colunas específicas
- [ ] Copiar `hooks/useColumnManager.ts` e ajustar STORAGE_KEY
- [ ] Copiar `components/ColumnManager.tsx`
- [ ] Integrar hook na página principal
- [ ] Passar `columnManager.visibleDefinitions` para a tabela
- [ ] Testar perfis pré-definidos (Essencial, Padrão, Completo)
- [ ] Testar busca e filtro por categoria
- [ ] Validar persistência (sair e retornar à página)
- [ ] Validar sincronização com pedidos:lastSearch (se aplicável)

---

## 🎯 Resumo

O sistema de seletor de colunas da página `/pedidos` é:

✅ **Modular**: Arquivos separados por responsabilidade  
✅ **Escalável**: Fácil adicionar/remover colunas  
✅ **Persistente**: Salva preferências automaticamente  
✅ **Inteligente**: Remapeia chaves legadas e filtra colunas removidas  
✅ **Reutilizável**: Pode ser replicado em qualquer página  
✅ **User-Friendly**: Interface visual intuitiva com busca e categorias  

Siga esta documentação para implementar o mesmo padrão em `/reclamacoes`, `/devolucoesdevenda`, `/vendas-online`, e qualquer outra página com tabelas.
