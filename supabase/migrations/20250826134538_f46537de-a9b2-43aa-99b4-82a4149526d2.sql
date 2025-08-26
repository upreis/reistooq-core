-- Backfill seguro: atualizar registros órfãos com integration_account_id da organização
-- e habilitar realtime para historico_vendas

-- Função para fazer backfill seguro dos registros órfãos
CREATE OR REPLACE FUNCTION public.backfill_historico_vendas_orphans()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  default_account_id uuid;
  updated_count integer := 0;
  total_orphans integer := 0;
BEGIN
  -- Contar registros órfãos
  SELECT COUNT(*) INTO total_orphans
  FROM public.historico_vendas 
  WHERE integration_account_id IS NULL;

  IF total_orphans = 0 THEN
    RETURN json_build_object('success', true, 'message', 'Nenhum registro órfão encontrado', 'updated', 0, 'total_orphans', 0);
  END IF;

  -- Buscar uma conta de integração ativa para usar como padrão
  -- Prioriza contas ativas, depois qualquer conta da organização
  SELECT ia.id INTO default_account_id
  FROM public.integration_accounts ia
  WHERE ia.organization_id = public.get_current_org_id()
    AND ia.is_active = true
  LIMIT 1;

  -- Se não encontrou conta ativa, pega qualquer conta da organização
  IF default_account_id IS NULL THEN
    SELECT ia.id INTO default_account_id
    FROM public.integration_accounts ia
    WHERE ia.organization_id = public.get_current_org_id()
    LIMIT 1;
  END IF;

  -- Se ainda não tem conta, cria uma conta padrão usando 'tiny' como provider
  IF default_account_id IS NULL THEN
    INSERT INTO public.integration_accounts (name, provider, organization_id, is_active)
    VALUES ('Conta Padrão (Sistema)', 'tiny', public.get_current_org_id(), true)
    RETURNING id INTO default_account_id;
  END IF;

  -- Atualizar registros órfãos
  UPDATE public.historico_vendas 
  SET integration_account_id = default_account_id,
      updated_at = now()
  WHERE integration_account_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true, 
    'message', 'Backfill concluído com sucesso',
    'updated', updated_count, 
    'total_orphans', total_orphans,
    'default_account_id', default_account_id
  );
END;
$$;

-- Habilitar realtime para historico_vendas
ALTER TABLE public.historico_vendas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.historico_vendas;

-- Executar o backfill automaticamente
SELECT public.backfill_historico_vendas_orphans();