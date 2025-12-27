
-- Adicionar coluna local_venda_id na tabela produtos_composicoes
ALTER TABLE public.produtos_composicoes 
ADD COLUMN IF NOT EXISTS local_venda_id UUID REFERENCES public.locais_venda(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_produtos_composicoes_local_venda 
ON public.produtos_composicoes(local_venda_id);

-- Atualizar constraint unique para incluir local_venda_id
-- Primeiro dropar a existente se houver
ALTER TABLE public.produtos_composicoes 
DROP CONSTRAINT IF EXISTS produtos_composicoes_sku_interno_organization_id_key;

-- Criar nova constraint unique incluindo local_venda_id
ALTER TABLE public.produtos_composicoes 
ADD CONSTRAINT produtos_composicoes_sku_local_venda_unique 
UNIQUE (sku_interno, organization_id, local_venda_id);
