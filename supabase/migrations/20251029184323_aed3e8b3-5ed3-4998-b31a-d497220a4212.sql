-- ========================================
-- 🔒 CORREÇÃO CRÍTICA DE SEGURANÇA - RLS
-- Proteção Multi-tenant e Conformidade LGPD/GDPR
-- ========================================

-- ✅ 1. Integration Accounts (Credenciais de Marketplace)
ALTER TABLE public.integration_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integration_accounts_org_isolation" ON public.integration_accounts;
CREATE POLICY "integration_accounts_org_isolation" 
ON public.integration_accounts 
FOR ALL 
USING (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- ✅ 2. Profiles (Dados Pessoais de Funcionários)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_org_isolation" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_org_isolation" 
ON public.profiles 
FOR SELECT
USING (
  organizacao_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "profiles_update_own" 
ON public.profiles 
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert" 
ON public.profiles 
FOR INSERT
WITH CHECK (id = auth.uid());

-- ✅ 3. Clientes (PII - LGPD/GDPR)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_org_isolation" ON public.clientes;
CREATE POLICY "clientes_org_isolation" 
ON public.clientes 
FOR ALL
USING (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- ✅ 4. Histórico de Vendas (Dados Financeiros e Comerciais)
ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico_vendas_org_isolation" ON public.historico_vendas;
CREATE POLICY "historico_vendas_org_isolation" 
ON public.historico_vendas 
FOR ALL
USING (
  integration_account_id IN (
    SELECT ia.id
    FROM public.integration_accounts ia
    JOIN public.profiles p ON p.organizacao_id = ia.organization_id
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  integration_account_id IN (
    SELECT ia.id
    FROM public.integration_accounts ia
    JOIN public.profiles p ON p.organizacao_id = ia.organization_id
    WHERE p.id = auth.uid()
  )
);

-- ✅ 5. Reclamações (Claims - Atendimento e Suporte)
ALTER TABLE public.reclamacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reclamacoes_org_isolation" ON public.reclamacoes;
CREATE POLICY "reclamacoes_org_isolation" 
ON public.reclamacoes 
FOR ALL
USING (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- ✅ 6. Devoluções Avançadas (Returns e Reembolsos)
ALTER TABLE public.devolucoes_avancadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "devolucoes_org_isolation" ON public.devolucoes_avancadas;
CREATE POLICY "devolucoes_org_isolation" 
ON public.devolucoes_avancadas 
FOR ALL
USING (
  integration_account_id IN (
    SELECT ia.id
    FROM public.integration_accounts ia
    JOIN public.profiles p ON p.organizacao_id = ia.organization_id
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  integration_account_id IN (
    SELECT ia.id
    FROM public.integration_accounts ia
    JOIN public.profiles p ON p.organizacao_id = ia.organization_id
    WHERE p.id = auth.uid()
  )
);

-- ========================================
-- 📝 DOCUMENTAÇÃO E AUDITORIA
-- ========================================

COMMENT ON POLICY "integration_accounts_org_isolation" ON public.integration_accounts IS 
'🔒 CRÍTICO: Previne vazamento de credenciais entre organizações. Isola tokens OAuth e secrets de marketplaces.';

COMMENT ON POLICY "profiles_org_isolation" ON public.profiles IS 
'🔒 PRIVACIDADE: Protege dados pessoais de funcionários (nome, telefone, cargo, departamento). Isolamento multi-tenant.';

COMMENT ON POLICY "clientes_org_isolation" ON public.clientes IS 
'🛡️ LGPD Art. 46: Protege PII de clientes - CPF/CNPJ, email, telefone, endereço completo. Acesso restrito à organização proprietária.';

COMMENT ON POLICY "historico_vendas_org_isolation" ON public.historico_vendas IS 
'💰 COMERCIAL: Protege dados financeiros sensíveis - valores, métodos de pagamento, margens. Isolamento via integration_account_id.';

COMMENT ON POLICY "reclamacoes_org_isolation" ON public.reclamacoes IS 
'📋 ATENDIMENTO: Isola dados de reclamações e suporte ao cliente. Informações sensíveis de relacionamento comercial.';

COMMENT ON POLICY "devolucoes_org_isolation" ON public.devolucoes_avancadas IS 
'🔄 OPERACIONAL: Protege dados de devoluções, reembolsos e disputas. Informações financeiras e de atendimento críticas.';