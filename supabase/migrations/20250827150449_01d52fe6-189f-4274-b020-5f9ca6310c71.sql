-- Remover a política que bloqueia tudo e criar uma política que permite inserção e leitura organizacional para historico_vendas
DROP POLICY IF EXISTS "historico_vendas_deny_all_access" ON public.historico_vendas;

-- Criar política para permitir inserção por usuários autenticados da organização
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

-- Criar política para permitir leitura por usuários da organização
CREATE POLICY "historico_vendas_select_org" 
ON public.historico_vendas 
FOR SELECT 
USING (
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

-- Permitir updates para correções (mesma lógica)
CREATE POLICY "historico_vendas_update_org" 
ON public.historico_vendas 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND
  (
    integration_account_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM public.integration_accounts ia 
      WHERE ia.id = integration_account_id 
      AND ia.organization_id = public.get_current_org_id()
    )
  )
)
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