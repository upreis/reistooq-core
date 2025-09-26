-- Tabela para armazenar arquivos de importação por cotação
CREATE TABLE public.cotacoes_arquivos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotacao_id uuid NOT NULL,
  nome_arquivo text NOT NULL,
  tipo_arquivo text NOT NULL, -- 'excel' ou 'csv'
  url_arquivo text, -- URL do arquivo no storage
  dados_processados jsonb, -- Dados do arquivo processado
  status text NOT NULL DEFAULT 'pendente', -- 'pendente', 'processado', 'erro'
  total_linhas integer DEFAULT 0,
  linhas_processadas integer DEFAULT 0,
  linhas_erro integer DEFAULT 0,
  detalhes_erro jsonb DEFAULT '[]'::jsonb,
  organization_id uuid NOT NULL DEFAULT get_current_org_id(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid()
);

-- RLS Policies
ALTER TABLE public.cotacoes_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cotação arquivos visíveis por organização" 
ON public.cotacoes_arquivos 
FOR ALL 
USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Índices
CREATE INDEX idx_cotacoes_arquivos_cotacao_id ON public.cotacoes_arquivos(cotacao_id);
CREATE INDEX idx_cotacoes_arquivos_organization_id ON public.cotacoes_arquivos(organization_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_cotacoes_arquivos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cotacoes_arquivos_updated_at
  BEFORE UPDATE ON public.cotacoes_arquivos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cotacoes_arquivos_updated_at();

-- Criar bucket de storage para arquivos de cotação
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cotacoes-arquivos', 'cotacoes-arquivos', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage
CREATE POLICY "Usuários podem ver arquivos de cotação da organização" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cotacoes-arquivos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT organizacao_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuários podem fazer upload de arquivos de cotação" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cotacoes-arquivos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT organizacao_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar arquivos de cotação da organização" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'cotacoes-arquivos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT organizacao_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);