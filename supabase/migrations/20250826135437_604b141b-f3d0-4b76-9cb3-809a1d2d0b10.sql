-- Corrigir TODOS os registros órfãos para a organização do usuário
DO $$
DECLARE
  default_account_id uuid := 'da163c47-9942-4133-934f-b31bfa8210ae';
  updated_count integer := 0;
BEGIN
  -- Atualizar TODOS os registros com integration_account_id NULL
  UPDATE public.historico_vendas 
  SET integration_account_id = default_account_id,
      updated_at = now()
  WHERE integration_account_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Atualizados % registros órfãos', updated_count;
END $$;

-- Verificar resultados
SELECT 
  'Totais:' as tipo,
  (SELECT count(*) FROM public.historico_vendas) AS total_hv,
  (SELECT count(*) FROM public.historico_vendas WHERE integration_account_id IS NULL) AS orphans,
  (SELECT count(*) FROM public.historico_vendas hv JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id WHERE ia.organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768') AS visible_to_org;