-- Habilitar RLS na tabela tiny_v3_credentials que foi criada sem RLS
ALTER TABLE public.tiny_v3_credentials ENABLE ROW LEVEL SECURITY;

-- Criar política para a tabela tiny_v3_credentials
CREATE POLICY "tiny_v3_credentials: org only" ON public.tiny_v3_credentials
  FOR ALL USING (organization_id = public.get_current_org_id())
  WITH CHECK (organization_id = public.get_current_org_id());