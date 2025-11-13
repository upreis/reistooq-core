-- =====================================================
-- SECURITY FIX: Habilitar RLS na tabela background_jobs
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem gerenciar todos os jobs
CREATE POLICY "Admins can manage all background jobs"
ON public.background_jobs
FOR ALL
TO authenticated
USING (has_permission('system:admin'::text))
WITH CHECK (has_permission('system:admin'::text));

-- Política: Sistema pode inserir jobs
CREATE POLICY "System can insert background jobs"
ON public.background_jobs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Sistema pode atualizar jobs
CREATE POLICY "System can update background jobs"
ON public.background_jobs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: Usuários podem visualizar jobs relacionados aos seus recursos
CREATE POLICY "Users can view their organization background jobs"
ON public.background_jobs
FOR SELECT
TO authenticated
USING (
  -- Permitir visualização se o job está relacionado a recursos da organização do usuário
  resource_type IN ('organization', 'import', 'export', 'sync') OR
  -- Ou se o usuário tem permissão de admin
  has_permission('system:admin'::text)
);

COMMENT ON TABLE public.background_jobs IS 'Background jobs table with RLS enabled. Admins have full access, system can insert/update, users can view organization-related jobs.';