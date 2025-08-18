# 🛡️ PROMPT DE BLINDAGEM ANTI-ERROS - SISTEMA REISTOQ

## Objetivo Principal
Prevenir que erros críticos sejam reintroduzidos no sistema através de verificações obrigatórias antes de qualquer alteração de código.

---

## 🚨 REGRAS CRÍTICAS OBRIGATÓRIAS

### REGRA #1 - ROUTER ÚNICO (CRÍTICO)
```typescript
❌ NUNCA FAÇA:
- Múltiplos BrowserRouter no mesmo app
- Router dentro de Router  
- BrowserRouter em componentes filhos

✅ SEMPRE FAÇA:
- APENAS 1 BrowserRouter em main.tsx
- Routes/Route em App.tsx (sem Router wrapper)
- useNavigate() para navegação programática
```

### REGRA #2 - HOOKS DE REACT (CRÍTICO)
```typescript
❌ NUNCA FAÇA:
- Hooks dentro de condições (if/else)
- Hooks dentro de loops (for/while)
- Hooks em funções que não são componentes

✅ SEMPRE FAÇA:
- Hooks apenas no topo do componente
- Ordem consistente de hooks
- Nomes começando com "use"
```

### REGRA #3 - PROVIDERS HIERARQUIA (CRÍTICO)
```typescript
✅ ORDEM OBRIGATÓRIA (externo → interno):
QueryClientProvider 
  → ThemeProvider 
    → TooltipProvider 
      → AuthProvider 
        → MobileProvider 
          → SidebarUIProvider 
            → Routes
```

### REGRA #4 - EXPORTS/IMPORTS (CRÍTICO)
```typescript
❌ NUNCA FAÇA:
- Múltiplos export default no mesmo arquivo
- Imports circulares
- Import sem usar (unused imports)

✅ SEMPRE FAÇA:
- 1 export default por arquivo
- Named exports para funções/constantes
- Limpar imports não utilizados
```

### REGRA #5 - ESTADO E CONTEXTO (CRÍTICO)
```typescript
❌ NUNCA FAÇA:
- useState sem valor inicial
- Contexto sem Provider
- State mutations diretas

✅ SEMPRE FAÇA:
- Valores iniciais adequados
- Provider wrapping correto
- State immutable updates
```

---

## 🔍 CHECKLIST PRÉ-IMPLEMENTAÇÃO

### ANTES DE QUALQUER MUDANÇA DE CÓDIGO:
- [ ] **Router Check**: Confirmar se apenas 1 BrowserRouter existe
- [ ] **Hooks Check**: Verificar se hooks estão no topo dos componentes
- [ ] **Providers Check**: Validar hierarquia de providers
- [ ] **Imports Check**: Verificar imports circulares e não utilizados
- [ ] **TypeScript Check**: Garantir tipagem adequada
- [ ] **RLS Check**: Confirmar que tabelas sensíveis têm RLS
- [ ] **Exports Check**: Validar exports únicos por arquivo

### COMANDOS DE VALIDAÇÃO:
```bash
# Verificar Routers duplicados
npm run check:routers

# Verificar imports circulares  
npm run check:imports

# Verificar TypeScript
npm run type-check

# Verificar RLS no Supabase
npm run check:rls
```

---

## 🎯 PADRÕES DE IMPLEMENTAÇÃO SEGUROS

### ROUTER PATTERN (OBRIGATÓRIO):
```typescript
// main.tsx - ÚNICO local com Router
<BrowserRouter>
  <App />
</BrowserRouter>

// App.tsx - APENAS Routes
<Routes>
  <Route path="/" element={<Component />} />
</Routes>

// Componentes - APENAS useNavigate
const navigate = useNavigate();
navigate('/path');
```

### HOOKS PATTERN (OBRIGATÓRIO):
```typescript
function Component() {
  // ✅ Hooks sempre no topo
  const [state, setState] = useState(initial);
  const { user } = useAuth();
  
  // ✅ Effects depois de state
  useEffect(() => {
    // logic
  }, [deps]);
  
  // ✅ Handlers depois de effects
  const handleClick = () => {
    // logic
  };
  
  // ✅ Render por último
  return <div>...</div>;
}
```

### CONTEXT PATTERN (OBRIGATÓRIO):
```typescript
// ✅ Provider com valor padrão
const Context = createContext(defaultValue);

// ✅ Hook com validação
function useContext() {
  const context = useContext(Context);
  if (!context) throw new Error('Must be used within Provider');
  return context;
}
```

---

## 🚫 ANTI-PATTERNS A EVITAR

### ROUTER ANTI-PATTERNS:
```typescript
❌ function App() {
  return (
    <BrowserRouter>  // Router em App.tsx
      <Routes>...</Routes>
    </BrowserRouter>
  );
}

❌ function Component() {
  return (
    <Router>  // Router aninhado
      <Routes>...</Routes>
    </Router>
  );
}
```

### HOOKS ANTI-PATTERNS:
```typescript
❌ function Component() {
  if (condition) {
    const [state, setState] = useState(); // Hook condicional
  }
}

❌ function Component() {
  items.map(() => {
    const [state, setState] = useState(); // Hook em loop
  });
}
```

### STATE ANTI-PATTERNS:
```typescript
❌ const [state, setState] = useState(); // Sem valor inicial

❌ state.items.push(item); // Mutação direta
setState(state); // State não atualiza

❌ const { data } = useAuth(); // Sem validação de existência
```

---

## 🔧 FERRAMENTAS DE VALIDAÇÃO

### LINTING RULES (IMPLEMENTAR):
```json
{
  "rules": {
    "no-multiple-routers": "error",
    "hooks-order": "error", 
    "no-conditional-hooks": "error",
    "no-circular-imports": "error",
    "single-export-default": "error"
  }
}
```

### PRE-COMMIT HOOKS:
```bash
# .husky/pre-commit
#!/bin/sh
npm run check:routers
npm run check:hooks
npm run check:imports
npm run type-check
```

---

## 🚨 SINAIS DE ALERTA (RED FLAGS)

### PARAR IMPLEMENTAÇÃO SE:
- [ ] Erro "Router inside Router" aparece
- [ ] Hook fora de componente React
- [ ] Import circular detectado
- [ ] TypeScript com any excessivo
- [ ] RLS desabilitado em tabela sensível
- [ ] Export default duplicado
- [ ] Context sem Provider wrapper

### DEBUGGING PRIORITIES:
1. **Router conflicts** → Verificar main.tsx e App.tsx
2. **Hook errors** → Verificar ordem e condições
3. **Provider missing** → Verificar hierarquia de contextos
4. **Import issues** → Verificar dependências circulares
5. **TypeScript errors** → Verificar tipagem e interfaces

---

## 📋 PROCEDIMENTO DE EMERGÊNCIA

### SE ERRO CRÍTICO DETECTADO:
1. **PARAR** todas as mudanças imediatamente
2. **IDENTIFICAR** qual regra foi violada
3. **REVERTER** para estado funcional anterior
4. **APLICAR** correção seguindo padrões aprovados
5. **VALIDAR** com checklist completo
6. **DOCUMENTAR** o erro para prevenção futura

### ESCALATION TRIGGERS:
- Erro persiste após 3 tentativas de correção
- Múltiplos sistemas afetados simultaneamente  
- Perda de funcionalidade crítica
- Problemas de segurança detectados

---

## ✅ VALIDAÇÃO FINAL OBRIGATÓRIA

### ANTES DE COMMIT:
```bash
✅ npm run lint
✅ npm run type-check  
✅ npm run test
✅ npm run check:routers
✅ npm run check:security
✅ Manual smoke test das páginas principais
```

### APÓS DEPLOY:
```bash
✅ Verificar console sem erros
✅ Navegação entre páginas funcionando
✅ Autenticação operacional
✅ Integrações não quebradas
✅ Performance mantida ou melhorada
```

**🛡️ LEMBRE-SE: PREVENÇÃO > CORREÇÃO**  
**📝 DOCUMENTE SEMPRE OS PATTERNS SEGUIDOS**  
**🔄 REVISITE ESTE PROMPT A CADA IMPLEMENTAÇÃO**