-- Habilitar RLS na tabela devolucoes_avancadas
ALTER TABLE public.devolucoes_avancadas ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura por organização (via integration_account)
CREATE POLICY "devolucoes_avancadas_select_org" 
ON public.devolucoes_avancadas 
FOR SELECT 
USING (
  integration_account_id IN (
    SELECT id FROM public.integration_accounts 
    WHERE organization_id = public.get_current_org_id()
  )
);

-- Criar política para permitir inserção por organização  
CREATE POLICY "devolucoes_avancadas_insert_org" 
ON public.devolucoes_avancadas 
FOR INSERT 
WITH CHECK (
  integration_account_id IN (
    SELECT id FROM public.integration_accounts 
    WHERE organization_id = public.get_current_org_id()
  )
);

-- Criar política para permitir atualização por organização
CREATE POLICY "devolucoes_avancadas_update_org" 
ON public.devolucoes_avancadas 
FOR UPDATE 
USING (
  integration_account_id IN (
    SELECT id FROM public.integration_accounts 
    WHERE organization_id = public.get_current_org_id()
  )
);

-- Criar política para permitir exclusão por organização
CREATE POLICY "devolucoes_avancadas_delete_org" 
ON public.devolucoes_avancadas 
FOR DELETE 
USING (
  integration_account_id IN (
    SELECT id FROM public.integration_accounts 
    WHERE organization_id = public.get_current_org_id()
  )
);