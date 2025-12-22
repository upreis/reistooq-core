-- Tabela para armazenar empresas/lojas Shopee cadastradas
CREATE TABLE public.empresas_shopee (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nickname TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por organização
CREATE INDEX idx_empresas_shopee_org ON public.empresas_shopee(organization_id);

-- Habilitar RLS
ALTER TABLE public.empresas_shopee ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver empresas da sua organização"
ON public.empresas_shopee
FOR SELECT
USING (
  organization_id IN (
    SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuários podem criar empresas na sua organização"
ON public.empresas_shopee
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar empresas da sua organização"
ON public.empresas_shopee
FOR UPDATE
USING (
  organization_id IN (
    SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar empresas da sua organização"
ON public.empresas_shopee
FOR DELETE
USING (
  organization_id IN (
    SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_empresas_shopee_updated_at
BEFORE UPDATE ON public.empresas_shopee
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();