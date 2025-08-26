-- ⚠️ CORREÇÃO CRÍTICA: Função para backfill de integration_account_id em histórico órfão
CREATE OR REPLACE FUNCTION public.fix_historico_integration_accounts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_count integer := 0;
  default_account_id uuid;
  org_id uuid;
BEGIN
  -- Obter organização atual
  org_id := public.get_current_org_id();
  
  IF org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;

  -- Buscar account padrão da organização
  SELECT id INTO default_account_id
  FROM public.integration_accounts
  WHERE organization_id = org_id
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  -- Se não houver account, criar um padrão
  IF default_account_id IS NULL THEN
    INSERT INTO public.integration_accounts (name, provider, organization_id, is_active)
    VALUES ('Sistema Padrão', 'sistema', org_id, true)
    RETURNING id INTO default_account_id;
  END IF;

  -- Atualizar registros órfãos no histórico
  UPDATE public.historico_vendas
  SET integration_account_id = default_account_id,
      updated_at = now()
  WHERE integration_account_id IS NULL
    AND status = 'baixado';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'updated_count', updated_count,
    'default_account_id', default_account_id,
    'organization_id', org_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;