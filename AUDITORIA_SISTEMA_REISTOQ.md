# AUDITORIA COMPLETA & CORREÇÃO IDEMPOTENTE - SISTEMA REISTOQ

## Objetivo Principal
Realizar auditoria completa do sistema REISTOQ para:
1. **Corrigir erros críticos** (Router duplicado, hooks nulos, exports duplicados)
2. **Inativar/remover funcionalidades não utilizadas** que causam conflitos
3. **Eliminar código legado** e duplicidades
4. **Estabelecer desenvolvimento gradual** com ativação controlada de features
5. **Validar integrações** (Mercado Livre, Shopee, Tiny) e desativar as problemáticas

---

## PARTE A — AUDITORIA CRÍTICA DE REACT/PROVIDERS/ROUTER

### A1. Auditoria de Router (CRÍTICO)
**Verificar:**
- [ ] Existe **EXATAMENTE 1** `BrowserRouter` em todo o sistema?
- [ ] `main.tsx` contém o único Router? `App.tsx` não deve ter Router
- [ ] Não há importações de `BrowserRouter` em componentes filhos
- [ ] Sidebar/Layout não criam Routers adicionais

**Correções Idempotentes:**
```typescript
// main.tsx - ÚNICO local com Router
<BrowserRouter>
  <App />
</BrowserRouter>

// App.tsx - APENAS Routes/Route
<Routes>
  <Route path="/" element={<Index />} />
  // ... outras rotas
</Routes>
```

### A2. Hierarquia de Providers (CRÍTICO)
**Ordem correta (externo → interno):**
```
QueryClientProvider 
  → ThemeProvider 
    → TooltipProvider 
      → BrowserRouter 
        → AuthProvider 
          → MobileProvider 
            → SidebarUIProvider 
              → App/Routes
```

**Verificar:**
- [ ] `AuthContext.tsx` tem `"use client"` como primeira linha?
- [ ] Imports de hooks corretos (useState, useEffect) sem duplicação?
- [ ] `useAuth()` guard implementado corretamente?

### A3. Exports/Imports Duplicados (CRÍTICO)
**Verificar:**
- [ ] Cada arquivo tem **APENAS 1** `export default`
- [ ] Não há `Identifier '.default' has already been declared`
- [ ] Componentes não são importados/exportados múltiplas vezes
- [ ] `vite.config.ts` tem `resolve.dedupe: ['react', 'react-dom']`

---

## PARTE B — AUDITORIA DE FUNCIONALIDADES NÃO UTILIZADAS

### B1. Integrações para Análise/Desativação
**Mercado Livre:**
- [ ] OAuth funcionando? Se não → **DESATIVAR temporariamente**
- [ ] Secrets configurados? (`ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REDIRECT_URI`)
- [ ] Edge functions respondendo sem erro?

**Shopee:**
- [ ] Integração ativa e funcional? Se não → **DESATIVAR**
- [ ] Remover/comentar código relacionado se não utilizado

**Tiny ERP:**
- [ ] Credenciais configuradas? Se não → **DESATIVAR**
- [ ] API respondendo? Se não → **DESATIVAR temporariamente**

**Amazon:**
- [ ] Integração implementada? Se não → **REMOVER completamente**

### B2. Componentes/Features Não Utilizados
**Verificar e REMOVER/DESATIVAR:**
- [ ] Componentes importados mas não renderizados
- [ ] Rotas não acessíveis ou quebradas
- [ ] Hooks customizados não utilizados
- [ ] Services/APIs não funcionais
- [ ] Modais/Dialogs não implementados completamente

### B3. Código Legado para Remoção
**Identificar e REMOVER:**
- [ ] Imports não utilizados em todos os arquivos
- [ ] Variáveis/funções declaradas mas não usadas
- [ ] Comentários TODO antigos (> 30 dias)
- [ ] CSS/estilos órfãos
- [ ] Tipos TypeScript não referenciados

---

## PARTE C — AUDITORIA DE INTEGRAÇÕES ESPECÍFICAS

### C1. OAuth Mercado Livre (PKCE) - Se Mantido
**Verificar se funcional ou DESATIVAR:**
- [ ] `supabase/functions/mercadolivre-oauth-start/index.ts` sem erros
- [ ] `supabase/functions/mercadolivre-oauth-callback/index.ts` implementado
- [ ] Secrets disponíveis: `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REDIRECT_URI`
- [ ] Flow redirect (não popup) implementado
- [ ] PKCE S256 com `code_verifier`/`code_challenge`
- [ ] State validation com cookie seguro

**Se QUEBRADO → DESATIVAR:**
```typescript
// Comentar/desabilitar em IntegracoesPage
// <MercadoLivreConnection />
<div className="p-4 border rounded bg-muted">
  <p>Mercado Livre - Em manutenção</p>
</div>
```

### C2. Supabase Edge Functions
**Verificar funcionamento ou DESATIVAR:**
- [ ] `mercadolivre-oauth-start` responde sem erro 500?
- [ ] `mercadolivre-oauth-callback` existe e funciona?
- [ ] `mercadolivre-orders` implementado?
- [ ] Logs sem vazamento de secrets

**Se QUEBRADAS → COMENTAR no config.toml:**
```toml
# [functions.mercadolivre-oauth-start]
# verify_jwt = true

# [functions.mercadolivre-oauth-callback] 
# verify_jwt = false
```

---

## PARTE D — DESENVOLVIMENTO GRADUAL

### D1. Ativação Controlada de Features
**Implementar sistema de feature flags:**
```typescript
// src/config/features.ts
export const FEATURES = {
  MERCADO_LIVRE: false, // Ativar apenas quando OAuth funcionando
  SHOPEE: false,        // Ativar quando API configurada
  TINY_ERP: false,      // Ativar quando credenciais validadas
  SCANNER: true,        // Funcional
  ESTOQUE: true,        // Core feature
  PEDIDOS: true,        // Core feature
} as const;
```

### D2. Componentes Condicionais
**Renderizar apenas features ativas:**
```typescript
// IntegracoesPage.tsx
{FEATURES.MERCADO_LIVRE && <MercadoLivreConnection />}
{FEATURES.SHOPEE && <ShopeeConnection />}
{FEATURES.TINY_ERP && <TinyConnection />}
```

### D3. Rotas Condicionais
**Desativar rotas de features não prontas:**
```typescript
// App.tsx
{FEATURES.SCANNER && <Route path="/scanner" element={<Scanner />} />}
```

---

## PARTE E — CORREÇÕES ESPECÍFICAS DETECTADAS

### E1. Problema Router Duplo
**Correção imediata:**
1. Mover `BrowserRouter` para `main.tsx`
2. Remover todos os outros Routers
3. `App.tsx` apenas com `Routes`/`Route`

### E2. Problema useState Null
**Verificar ordem de providers:**
1. `AuthProvider` deve estar APÓS `BrowserRouter`
2. Verificar se `useAuth()` tem guard adequado
3. Garantir que hooks são chamados dentro de componentes React válidos

### E3. Export Default Duplicado
**Limpar exports:**
1. Cada arquivo: apenas 1 `export default`
2. Remover exports não utilizados
3. Consolidar imports duplicados

---

## ENTREGÁVEIS OBRIGATÓRIOS

### 1. Relatório de Problemas Encontrados
```
❌ CRÍTICOS:
- Router duplicado em [arquivo:linha]
- useState retornando null em [arquivo:linha]
- Export duplicado em [arquivo:linha]

⚠️ FUNCIONALIDADES PROBLEMÁTICAS:
- Mercado Livre OAuth: [status]
- Shopee Integration: [status]
- Tiny ERP: [status]

🧹 CÓDIGO LEGADO REMOVIDO:
- [lista de arquivos/componentes removidos]
```

### 2. Arquivos Alterados (Diffs Resumidos)
```
main.tsx: + BrowserRouter wrapper
App.tsx: - BrowserRouter, reorganização providers
IntegracoesPage.tsx: + feature flags, - componentes quebrados
config/features.ts: + novo arquivo feature flags
```

### 3. Validação Manual (Passo a Passo)
```
1. ✅ Aplicação carrega sem erros no console
2. ✅ Navegação entre páginas funciona
3. ✅ Apenas integrações funcionais visíveis
4. ✅ OAuth flows testados (se ativos)
5. ✅ Core features (estoque, pedidos) operacionais
```

### 4. Melhorias Preventivas Aplicadas
```
- Feature flags system implementado
- Lint rules para Router único
- Bundle deduplication configurado
- Componentes condicionais por feature
- Edge functions com error handling melhorado
```

### 5. Roadmap de Reativação
```
FASE 1 (Imediato): Core features estáveis
FASE 2: Mercado Livre OAuth completo
FASE 3: Shopee integration
FASE 4: Tiny ERP full integration
```

---

## INSTRUÇÕES DE EXECUÇÃO

### Prioridade 1 - CRÍTICOS (Executar primeiro)
1. Corrigir Router duplicado
2. Resolver useState null
3. Limpar exports duplicados
4. Estabelecer hierarquia correta de providers

### Prioridade 2 - LIMPEZA (Após críticos resolvidos)
1. Implementar feature flags
2. Desativar integrações problemáticas
3. Remover código não utilizado
4. Limpar imports órfãos

### Prioridade 3 - PREVENÇÃO (Configurações futuras)
1. Scripts de validação
2. Lint rules customizadas
3. Bundle optimization
4. Monitoramento de regressões

---

**IMPORTANTE:** 
- ✅ Aplicar mudanças **idempotentes** (executar múltiplas vezes sem quebrar)
- ✅ Manter funcionalidades core (estoque, pedidos, scanner) sempre ativas
- ✅ Não alterar tema/design, apenas funcionalidade
- ✅ Não imprimir secrets em logs
- ✅ Testar cada correção isoladamente antes de prosseguir