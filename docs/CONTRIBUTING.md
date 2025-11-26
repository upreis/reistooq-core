# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para este projeto! Este guia ajudará você a entender nossos processos e padrões.

---

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Começar](#como-começar)
3. [Estrutura de Branches](#estrutura-de-branches)
4. [Padrões de Código](#padrões-de-código)
5. [Commits](#commits)
6. [Pull Requests](#pull-requests)
7. [Testes](#testes)
8. [Documentação](#documentação)

---

## 📜 Código de Conduta

- ✅ Seja respeitoso e inclusivo
- ✅ Aceite críticas construtivas
- ✅ Foque no que é melhor para a comunidade
- ✅ Mostre empatia com outros membros

---

## 🚀 Como Começar

### 1. Setup do Ambiente

```bash
# Clone o repositório
git clone <repo-url>
cd <repo-name>

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
```

### 2. Conecte ao Supabase

1. Crie projeto no [Supabase](https://supabase.com)
2. Configure credenciais no `.env.local`
3. Execute migrations: `npm run supabase:migration:up`

### 3. Explore a Codebase

- Leia `docs/ARCHITECTURE.md` para entender a estrutura
- Leia `docs/PATTERNS.md` para padrões de código
- Veja exemplos em `src/features/reclamacoes/` (feature de referência)

---

## 🌳 Estrutura de Branches

### Branch Principal
- `main` - código em produção (protegida)

### Feature Branches
```bash
# Criar nova feature
git checkout -b feature/nome-da-feature

# Exemplos:
feature/adicionar-dashboard-vendas
feature/melhorar-filtros-pedidos
```

### Bugfix Branches
```bash
# Criar bugfix
git checkout -b fix/descricao-do-bug

# Exemplos:
fix/corrigir-calculo-total
fix/resolver-erro-login
```

### Outros Tipos
- `docs/` - Mudanças em documentação
- `refactor/` - Refatoração de código
- `test/` - Adição de testes
- `chore/` - Tarefas de manutenção

---

## 💻 Padrões de Código

### TypeScript

```typescript
// ✅ BOM - Types explícitos
interface UserData {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<UserData> {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

// ❌ EVITAR - Types implícitos
function getUser(id) {
  return fetch(`/api/users/${id}`).then(r => r.json());
}
```

### React Components

```typescript
// ✅ BOM - Functional components com TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};

// ❌ EVITAR - Props sem type, lógica complexa no JSX
export const Button = ({ label, onClick, variant }) => {
  return (
    <button onClick={onClick}>
      {variant === 'primary' ? '🔵' : '⚫'} {label}
    </button>
  );
};
```

### Custom Hooks

```typescript
// ✅ BOM - Hook focado, type-safe
interface UseUserDataReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUserData(userId: string): UseUserDataReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  
  return {
    user: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

// ❌ EVITAR - Hook genérico fazendo muitas coisas
export function useUser(userId) {
  // 200 linhas de lógica misturada
}
```

### Naming Conventions

```typescript
// ✅ Componentes - PascalCase
export const UserCard = () => { ... };

// ✅ Hooks - camelCase com prefixo "use"
export const useUserData = () => { ... };

// ✅ Utils - camelCase
export const formatCurrency = () => { ... };

// ✅ Constants - UPPER_SNAKE_CASE
export const MAX_RETRIES = 3;

// ✅ Types/Interfaces - PascalCase
interface UserData { ... }
type OrderStatus = 'pending' | 'shipped';
```

---

## 📝 Commits

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat` - Nova feature
- `fix` - Bug fix
- `docs` - Mudanças em documentação
- `style` - Formatação, sem mudança de lógica
- `refactor` - Refatoração de código
- `test` - Adição de testes
- `chore` - Tarefas de manutenção

### Exemplos

```bash
# Feature
feat(pedidos): adicionar filtro por status

Implementa filtro dropdown para filtrar pedidos por status.
Inclui estados: pending, processing, shipped, delivered.

# Bug fix
fix(auth): corrigir refresh token expirado

Previne logout automático quando refresh token expira.
Adiciona retry automático com backoff exponencial.

# Docs
docs(api): documentar endpoint de pedidos

Adiciona documentação completa do endpoint /api/pedidos
incluindo exemplos de request/response.

# Refactor
refactor(hooks): extrair lógica de filtros para hook

Move lógica de filtros de componente para useFilters hook
melhorando reusabilidade.
```

---

## 🔄 Pull Requests

### Antes de Criar PR

1. ✅ Código compila sem erros (`npm run type-check`)
2. ✅ Testes passam (`npm run test`)
3. ✅ Lint passa (`npm run lint`)
4. ✅ Branch atualizada com `main`

### Template de PR

```markdown
## 📋 Descrição

Breve descrição do que foi implementado/corrigido.

## 🎯 Motivação

Por que esta mudança é necessária? Qual problema resolve?

## 🔄 Tipo de Mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## ✅ Checklist

- [ ] Código compila sem erros
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Sem impacto em API/tokens/autenticação

## 📸 Screenshots (se aplicável)

Antes | Depois
--- | ---
![antes](url) | ![depois](url)

## 🧪 Como Testar

1. Checkout da branch
2. Execute `npm install`
3. Execute `npm run dev`
4. Navegue para `/pagina-teste`
5. Teste funcionalidade X
```

### Revisão de Código

Reviewers devem verificar:
- ✅ Código segue padrões do projeto
- ✅ Lógica está correta
- ✅ Sem code smells óbvios
- ✅ Performance aceitável
- ✅ Testes adequados
- ✅ Documentação atualizada

---

## 🧪 Testes

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  it('formata valor positivo corretamente', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });
  
  it('formata zero corretamente', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
  
  it('formata valor negativo corretamente', () => {
    expect(formatCurrency(-1234.56)).toBe('-R$ 1.234,56');
  });
});
```

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza com label correto', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('chama onClick quando clicado', () => {
    const handleClick = vi.fn();
    render(<Button label="Click" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Executar Testes

```bash
# Todos os testes
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 📚 Documentação

### Comentários de Código

```typescript
// ✅ BOM - Documenta o "porquê", não o "o quê"
// Usamos debounce aqui pois filtros podem mudar rapidamente
// e queremos evitar chamadas excessivas à API
const debouncedFilters = useMemo(
  () => debounce(filters, 500),
  [filters]
);

// ❌ EVITAR - Comenta o óbvio
// Cria variável debouncedFilters
const debouncedFilters = debounce(filters, 500);
```

### JSDoc para Funções Públicas

```typescript
/**
 * Formata valor monetário para formato brasileiro
 * 
 * @param value - Valor numérico a ser formatado
 * @param currency - Moeda (default: 'BRL')
 * @returns String formatada (ex: "R$ 1.234,56")
 * 
 * @example
 * ```typescript
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(1234.56, 'USD') // "$ 1,234.56"
 * ```
 */
export function formatCurrency(
  value: number, 
  currency: string = 'BRL'
): string {
  // implementation
}
```

### README para Features

Cada feature complexa deve ter `README.md`:

```markdown
# Feature: Reclamações

## Objetivo
Gerenciar reclamações de clientes do Mercado Livre.

## Arquitetura
[Diagrama ou descrição]

## Componentes Principais
- `ReclamacoesTable` - Tabela principal
- `ReclamacoesFilterBar` - Filtros
- `useReclamacoesData` - Hook de dados

## Como Usar
[Exemplos]

## Decisões Técnicas
- Por que escolhemos X ao invés de Y
- Trade-offs considerados
```

---

## 🚨 Issues Comuns

### Erro de Type

```typescript
// ❌ PROBLEMA
const data = fetchData(); // Type 'any'

// ✅ SOLUÇÃO
const data: UserData = await fetchData();
```

### Memory Leak

```typescript
// ❌ PROBLEMA - useEffect sem cleanup
useEffect(() => {
  const subscription = subscribeToData();
}, []);

// ✅ SOLUÇÃO - cleanup no return
useEffect(() => {
  const subscription = subscribeToData();
  return () => subscription.unsubscribe();
}, []);
```

### Re-render Excessivo

```typescript
// ❌ PROBLEMA - função recriada a cada render
function MyComponent() {
  const handleClick = () => console.log('click');
  return <Button onClick={handleClick} />;
}

// ✅ SOLUÇÃO - useCallback
function MyComponent() {
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);
  return <Button onClick={handleClick} />;
}
```

---

## 💡 Dicas

1. **Leia a documentação** antes de começar
2. **Pergunte** se tiver dúvidas (não fique travado)
3. **Teste localmente** antes de criar PR
4. **Commits pequenos** são melhores que um commit gigante
5. **Code review** é para aprender, não julgar

---

## 📞 Contato

- Issues: [GitHub Issues](link)
- Discussões: [GitHub Discussions](link)
- Email: [email]

---

**Obrigado por contribuir! 🎉**
