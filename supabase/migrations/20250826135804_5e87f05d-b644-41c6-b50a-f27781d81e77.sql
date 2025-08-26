-- Associar segunda conta de integração (que contém 37 vendas) à organização correta
DO $$
DECLARE
  v_account uuid := 'fc3a730e-b606-4530-9990-5ea4e4bb66c8';
  v_org uuid := '9d52ba63-0de8-4d77-8b57-ed14d3189768';
BEGIN
  UPDATE public.integration_accounts
  SET organization_id = v_org, is_active = true, updated_at = now()
  WHERE id = v_account;
END $$;

-- Verificação
SELECT 
  (SELECT count(*) FROM public.historico_vendas) AS total_hv,
  (SELECT count(*) FROM public.historico_vendas hv JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id AND ia.organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768') AS visible_to_org_after;