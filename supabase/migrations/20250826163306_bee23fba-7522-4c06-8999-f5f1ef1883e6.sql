-- Corrigir funções de exclusão do histórico para funcionar com integration_account_id NULL
-- Problema: as RPC atuais falham quando integration_account_id é NULL

-- 1. Corrigir função hv_delete
CREATE OR REPLACE FUNCTION public.hv_delete(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se integration_account_id é NULL, excluir direto (dados legacy)
  -- Se não for NULL, verificar a organização via integration_accounts
  DELETE FROM public.historico_vendas hv
  WHERE hv.id = _id
    AND (
      hv.integration_account_id IS NULL 
      OR 
      EXISTS (
        SELECT 1 FROM public.integration_accounts ia
        WHERE ia.id = hv.integration_account_id
          AND ia.organization_id = public.get_current_org_id()
      )
    );
END;
$$;

-- 2. Corrigir função hv_delete_many  
CREATE OR REPLACE FUNCTION public.hv_delete_many(_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se integration_account_id é NULL, excluir direto (dados legacy)
  -- Se não for NULL, verificar a organização via integration_accounts
  DELETE FROM public.historico_vendas hv
  WHERE hv.id = ANY(_ids)
    AND (
      hv.integration_account_id IS NULL 
      OR 
      EXISTS (
        SELECT 1 FROM public.integration_accounts ia
        WHERE ia.id = hv.integration_account_id
          AND ia.organization_id = public.get_current_org_id()
      )
    );
END;
$$;