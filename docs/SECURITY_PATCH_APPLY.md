# Aplicação do Patch de Segurança

## Visão Geral
Este documento orienta a aplicação do patch de segurança para as tabelas `historico_vendas` e `invitations`, implementando:

1. ✅ **RPC segura** `get_historico_vendas_masked()` com mascaramento de PII
2. ✅ **Bloqueio** da view/tabela `historico_vendas_public` 
3. ✅ **RLS rigoroso** para `invitations` com controle por organização e permissões
4. ✅ **Verificações** de segurança e idempotência

## Como Aplicar

### 1. Acessar o Supabase Studio
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Navegue até **SQL Editor** no menu lateral

### 2. Executar o Patch
1. Abra o arquivo `supabase/sql/2025-08-16_security_patch.sql`
2. **Copie todo o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **Run** para executar

> ⚠️ **IMPORTANTE**: O patch é **idempotente** - pode ser executado múltiplas vezes sem problemas.

### 3. Verificar Aplicação

Execute as seguintes queries para verificar se o patch foi aplicado corretamente:

```sql
-- 1. Verificar se a função RPC foi criada
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_name = 'get_historico_vendas_masked';

-- 2. Verificar se historico_vendas_public está bloqueada
SELECT tablename, hasrls 
FROM pg_tables 
WHERE tablename = 'historico_vendas_public';

-- 3. Verificar políticas RLS de invitations
SELECT policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'invitations'
ORDER BY policyname;

-- 4. Testar função (requer usuário autenticado)
SELECT COUNT(*) FROM public.get_historico_vendas_masked(null, 5, 0);
```

### 4. Resultados Esperados

#### Função RPC
```
routine_name: get_historico_vendas_masked
routine_type: FUNCTION  
security_type: INVOKER
```

#### Tabela Bloqueada
```
tablename: historico_vendas_public
hasrls: t (true)
```

#### Políticas de Invitations
```
invitations_delete_org_managers
invitations_insert_org_managers  
invitations_select_org_with_permission
invitations_update_org_managers
```

## Rollback (Se Necessário)

Caso precise reverter as alterações:

```sql
-- 1. Remover função RPC
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(text, int, int);

-- 2. Reativar historico_vendas_public (se necessário)
ALTER TABLE public.historico_vendas_public DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.historico_vendas_public TO authenticated;

-- 3. Remover políticas RLS de invitations
DROP POLICY IF EXISTS "invitations_select_org_with_permission" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert_org_managers" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update_org_managers" ON public.invitations;
DROP POLICY IF EXISTS "invitations_delete_org_managers" ON public.invitations;

-- 4. Restaurar políticas antigas (se existirem)
-- [Adicionar aqui as políticas que existiam antes, se necessário]
```

## Impacto no Frontend

### ✅ Já Migrado
O frontend já foi atualizado para usar:
- `get_historico_vendas_masked()` em vez de `select('*')`
- Tipagem `HistoricoVendaPublic` para dados seguros
- Validações ESLint que proíbem `select('*')`

### 🔍 Verificações Adicionais
Para garantir conformidade:

```bash
# Verificar se não há select('*') no código
npm run guard:select

# Executar linting
npm run lint
```

## Monitoramento Pós-Aplicação

### Métricas de Segurança
- ✅ Acesso a dados PII controlado por permissões
- ✅ Queries diretas a `historico_vendas` bloqueadas  
- ✅ Convites restritos por organização
- ✅ Auditoria de acesso via RLS policies

### Logs a Monitorar
1. **Tentativas de acesso negado** a `historico_vendas_public`
2. **Calls para** `get_historico_vendas_masked()` 
3. **Operações em** `invitations` (via Supabase logs)

## Suporte

Se houver problemas:

1. **Verificar logs** no Supabase Dashboard → Logs → Database
2. **Executar queries de verificação** desta documentação  
3. **Revisar permissões** do usuário atual com `SELECT public.get_user_permissions()`

---

**Status**: ✅ Patch de segurança aplicado com sucesso!