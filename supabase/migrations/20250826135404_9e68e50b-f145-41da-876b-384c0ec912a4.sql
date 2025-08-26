-- Corrigir organization_id da conta padrão criada no backfill
DO $$
DECLARE
  v_account uuid := 'da163c47-9942-4133-934f-b31bfa8210ae';
  v_org uuid := '9d52ba63-0de8-4d77-8b57-ed14d3189768';
BEGIN
  UPDATE public.integration_accounts
  SET organization_id = v_org, is_active = true, updated_at = now()
  WHERE id = v_account;
END $$;

-- Opcional: garantir que todas as vendas já vinculadas a essa conta sejam vistas pela org
-- (nada a fazer aqui, o JOIN usa integration_accounts.organization_id)

-- Verificação rápida (safe)
SELECT 
  (SELECT count(*) FROM public.historico_vendas) AS total_hv,
  (SELECT count(*) FROM public.historico_vendas hv JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id AND ia.organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768') AS visible_to_org_after;