-- Corrigir política de INSERT para incluir WITH CHECK
DROP POLICY IF EXISTS "historico_vendas_insert_org" ON public.historico_vendas;

CREATE POLICY "historico_vendas_insert_org" 
ON public.historico_vendas 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (
    integration_account_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM public.integration_accounts ia 
      WHERE ia.id = integration_account_id 
      AND ia.organization_id = public.get_current_org_id()
    )
  )
);

-- Permitir inserção direta para usuários autenticados quando integration_account_id é NULL
CREATE POLICY "historico_vendas_insert_direct" 
ON public.historico_vendas 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  integration_account_id IS NULL
);