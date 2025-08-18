-- Criar tabela isolada para integração ML v2
CREATE TABLE public.ml_accounts_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  ml_user_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT,
  site_id TEXT NOT NULL DEFAULT 'MLB',
  country_id TEXT NOT NULL DEFAULT 'BR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, ml_user_id)
);

-- RLS para ML accounts v2
ALTER TABLE public.ml_accounts_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ml_accounts_v2: select by org" 
ON public.ml_accounts_v2 FOR SELECT 
USING (organization_id = public.get_current_org_id());

CREATE POLICY "ml_accounts_v2: mutate by org" 
ON public.ml_accounts_v2 FOR ALL 
USING (organization_id = public.get_current_org_id())
WITH CHECK (organization_id = public.get_current_org_id());

-- Trigger para updated_at
CREATE TRIGGER update_ml_accounts_v2_updated_at
  BEFORE UPDATE ON public.ml_accounts_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para obter organização via service role (sem depender de profiles)
CREATE OR REPLACE FUNCTION public.get_org_id_from_oauth_state(p_state_value TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id 
  FROM public.oauth_states 
  WHERE state_value = p_state_value 
    AND expires_at > now() 
    AND used = false
  LIMIT 1;
$$;

-- Função para marcar state como usado
CREATE OR REPLACE FUNCTION public.mark_oauth_state_used(p_state_value TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.oauth_states 
  SET used = true 
  WHERE state_value = p_state_value 
    AND expires_at > now() 
    AND used = false;
  
  SELECT found;
$$;