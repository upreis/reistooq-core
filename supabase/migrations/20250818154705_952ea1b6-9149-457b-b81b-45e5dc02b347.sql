-- Aplicar política à tabela pedidos
-- Remover política de deny total e adicionar SELECT restrito

DO $$
BEGIN
  -- Remover a política de deny se existir
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'pedidos' AND policyname = 'pedidos: deny select'
  ) THEN
    EXECUTE 'DROP POLICY "pedidos: deny select" ON public.pedidos';
  END IF;
END$$;

-- Garantir que RLS está ativado
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Criar política de SELECT por organização e permissão
CREATE POLICY "pedidos_select_org_perms" ON public.pedidos
FOR SELECT USING (
  public.has_permission('orders:read') AND EXISTS (
    SELECT 1 FROM public.integration_accounts ia
    WHERE ia.id = pedidos.integration_account_id
      AND ia.organization_id = public.get_current_org_id()
  )
);