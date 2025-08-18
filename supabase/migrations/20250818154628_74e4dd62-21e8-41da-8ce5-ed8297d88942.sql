-- Corrigir criação condicional da política em historico_vendas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'historico_vendas' AND policyname = 'hv_select_org_perms'
  ) THEN
    EXECUTE 'CREATE POLICY "hv_select_org_perms" ON public.historico_vendas '
         || 'FOR SELECT USING ( '
         || 'public.has_permission(''vendas:read'') AND EXISTS ( '
         || 'SELECT 1 FROM public.integration_accounts ia '
         || 'WHERE ia.id = historico_vendas.integration_account_id '
         || 'AND ia.organization_id = public.get_current_org_id() '
         || ') )';
  END IF;
END$$;