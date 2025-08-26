-- Create a helper RPC to check if a historico_vendas record exists by id_unico within current org
CREATE OR REPLACE FUNCTION public.hv_exists(p_id_unico text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.historico_vendas hv
    JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
    WHERE ia.organization_id = public.get_current_org_id()
      AND hv.id_unico = p_id_unico
  );
$$;

-- Optional performance index (safe if already exists)
CREATE INDEX IF NOT EXISTS idx_historico_vendas_id_unico ON public.historico_vendas (id_unico);
