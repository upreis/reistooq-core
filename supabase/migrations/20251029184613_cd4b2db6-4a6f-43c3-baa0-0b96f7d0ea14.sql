-- ========================================
-- 🔒 CORREÇÃO CRÍTICA DE SEGURANÇA - RLS  
-- Fix multi-tenant isolation
-- ========================================

-- 1. Integration Accounts
ALTER TABLE public.integration_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integration_accounts_org_isolation" ON public.integration_accounts;
CREATE POLICY "integration_accounts_org_isolation" 
ON public.integration_accounts 
FOR ALL 
USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- 2. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_org_read" ON public.profiles;
CREATE POLICY "profiles_org_read" 
ON public.profiles 
FOR SELECT
USING (organizacao_id = get_current_org_id());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" 
ON public.profiles 
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_org_isolation" ON public.clientes;
CREATE POLICY "clientes_org_isolation" 
ON public.clientes 
FOR ALL
USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- 4. Reclamações
ALTER TABLE public.reclamacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reclamacoes_org_isolation" ON public.reclamacoes;
CREATE POLICY "reclamacoes_org_isolation" 
ON public.reclamacoes 
FOR ALL
USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- 5. Mensagens de Reclamações (via JOIN com reclamacoes)
ALTER TABLE public.reclamacoes_mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reclamacoes_mensagens_org_isolation" ON public.reclamacoes_mensagens;
CREATE POLICY "reclamacoes_mensagens_org_isolation" 
ON public.reclamacoes_mensagens 
FOR ALL
USING (
  claim_id IN (
    SELECT claim_id FROM public.reclamacoes 
    WHERE organization_id = get_current_org_id()
  )
)
WITH CHECK (
  claim_id IN (
    SELECT claim_id FROM public.reclamacoes 
    WHERE organization_id = get_current_org_id()
  )
);

-- 6. Evidências de Reclamações (via JOIN com reclamacoes)
ALTER TABLE public.reclamacoes_evidencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reclamacoes_evidencias_org_isolation" ON public.reclamacoes_evidencias;
CREATE POLICY "reclamacoes_evidencias_org_isolation" 
ON public.reclamacoes_evidencias 
FOR ALL
USING (
  claim_id IN (
    SELECT claim_id FROM public.reclamacoes 
    WHERE organization_id = get_current_org_id()
  )
)
WITH CHECK (
  claim_id IN (
    SELECT claim_id FROM public.reclamacoes 
    WHERE organization_id = get_current_org_id()
  )
);

-- ✅ RLS crítico aplicado com sucesso!