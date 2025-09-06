# 🔄 Sistema de Persistência de Estado - Página Pedidos

## Funcionalidade Implementada

O sistema agora mantém automaticamente os filtros aplicados e os dados dos pedidos quando o usuário:
- Sai da página `/pedidos` e volta
- Recarrega o navegador
- Navega para outras páginas e retorna

## Como Funciona

### 1. **Persistência Automática**
- **Filtros**: Salvos automaticamente quando aplicados (botão "Aplicar Filtros")
- **Dados**: Salvos automaticamente após cada busca bem-sucedida
- **Página**: Mantém a página atual da paginação
- **Filtro Rápido**: Mantém o filtro selecionado (todos, pronto para baixar, etc.)

### 2. **Duração do Cache**
- **5 minutos**: Tempo de vida dos dados em cache
- **Expiração automática**: Após 5 minutos, os dados são removidos e uma nova busca é necessária

### 3. **Limpeza Automática**
O estado persistido é limpo automaticamente quando:
- Usuário aplica novos filtros
- Usuário clica em "Limpar filtros"
- Usuário clica no botão "🔄 Debug & Recarregar"
- Cache expira (5 minutos)

## Comportamento do Usuário

### ✅ **Cenário: Filtros Aplicados → Sair → Voltar**
1. Usuário aplica filtros (ex: status "Enviado", data de 01/01 a 31/01)
2. Usuário sai da página (navega para /historico)
3. Usuário volta para /pedidos
4. **Resultado**: Os mesmos filtros estão aplicados e os mesmos dados são exibidos

### ✅ **Cenário: Nova Busca**
1. Usuário modifica os filtros
2. Usuário clica "Aplicar Filtros"
3. **Resultado**: Estado anterior é limpo, nova busca é executada e novo estado é salvo

### ✅ **Cenário: Atualização Manual**
1. Usuário clica "🔄 Debug & Recarregar"
2. **Resultado**: Estado persistido é limpo, dados são recarregados

### ✅ **Cenário: Cache Expirado**
1. Usuário volta à página após 5+ minutos
2. **Resultado**: Estado persistido é removido automaticamente, página carrega em estado inicial

## Implementação Técnica

### Hook Principal: `usePersistentPedidosState`
```typescript
const persistentState = usePersistentPedidosState();

// Verificar se existe estado válido
if (persistentState.hasValidPersistedState()) {
  // Restaurar dados sem refetch
  actions.restorePersistedData(data.orders, data.total, data.page);
}

// Salvar quando filtros são aplicados
persistentState.saveAppliedFilters(filters);

// Limpar quando necessário
persistentState.clearPersistedState();
```

### Armazenamento
- **Local Storage**: Key `pedidos_persistent_state`
- **Estrutura**: JSON com filtros, dados, timestamps
- **Validação**: Verificação de expiração automática

## Vantagens

1. **UX Melhorada**: Usuário não perde o trabalho ao navegar
2. **Performance**: Evita refetch desnecessário de dados recentes
3. **Eficiência**: Mantém contexto de trabalho do usuário
4. **Flexibilidade**: Sistema inteligente de expiração e limpeza

## Logs de Debug

O sistema gera logs úteis para debug:
```
🔄 Estado persistido carregado: { filters: {...}, ordersCount: 50, cacheAge: "30s" }
💾 Estado salvo: { hasFilters: true, ordersCount: 50, page: 1 }
🗑️ Estado persistido removido
⏰ Cache expirado, limpando estado persistido
```