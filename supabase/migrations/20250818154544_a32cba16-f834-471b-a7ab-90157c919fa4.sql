-- Fortalecer RLS definitiva para historico_vendas e pedidos

-- historico_vendas: garantir política de SELECT por organização e permissão
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'historico_vendas' AND policyname = 'hv_select_org_perms'
  ) THEN
    EXECUTE $$CREATE POLICY "hv_select_org_perms" ON public.historico_vendas
    FOR SELECT USING (
      public.has_permission('vendas:read') AND EXISTS (
        SELECT 1 FROM public.integration_accounts ia
        WHERE ia.id = historico_vendas.integration_account_id
          AND ia.organization_id = public.get_current_org_id()
      )
    )$$;
  END IF;
END $$;

-- pedidos: substituir deny total por SELECT restrito à organização
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'pedidos' AND policyname = 'pedidos: deny select'
  ) THEN
    EXECUTE 'DROP POLICY "pedidos: deny select" ON public.pedidos';
  END IF;
END $$;

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "pedidos_select_org_perms" ON public.pedidos
FOR SELECT USING (
  public.has_permission('orders:read') AND EXISTS (
    SELECT 1 FROM public.integration_accounts ia
    WHERE ia.id = pedidos.integration_account_id
      AND ia.organization_id = public.get_current_org_id()
  )
);
