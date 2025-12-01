-- 🔧 CORREÇÃO CRÍTICA: RLS Policies para ml_claims
-- Problema: RLS bloqueando acesso do frontend mesmo com usuário autenticado
-- Solução: Policies permitindo SELECT baseado em organization_id do usuário

-- ✅ DROP policies antigas se existirem
DROP POLICY IF EXISTS "Users can view their org claims" ON public.ml_claims;
DROP POLICY IF EXISTS "Enable read for authenticated users based on org" ON public.ml_claims;

-- ✅ CREATE policy correta: SELECT permitido para claims da organização do usuário
CREATE POLICY "Users can view ml_claims from their organization"
ON public.ml_claims
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organizacao_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- 📝 Comentário explicativo
COMMENT ON POLICY "Users can view ml_claims from their organization" ON public.ml_claims 
IS 'Permite usuários autenticados verem claims da sua organização via profiles.organizacao_id';

-- ✅ Garantir que RLS está ativa
ALTER TABLE public.ml_claims ENABLE ROW LEVEL SECURITY;