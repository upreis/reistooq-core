-- ====================================
-- MAPEAMENTO DE LOCAIS DE ESTOQUE
-- ====================================

-- Tabela para mapear pedidos → locais de estoque
CREATE TABLE public.mapeamento_locais_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  
  -- Chaves do mapeamento
  empresa TEXT NOT NULL,
  tipo_logistico TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  
  -- Destino
  local_estoque_id UUID NOT NULL REFERENCES public.locais_estoque(id) ON DELETE CASCADE,
  
  -- Status e observações
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint de unicidade
  UNIQUE(organization_id, empresa, tipo_logistico, marketplace)
);

-- Index para performance
CREATE INDEX idx_mapeamento_locais_org ON public.mapeamento_locais_estoque(organization_id);
CREATE INDEX idx_mapeamento_locais_lookup ON public.mapeamento_locais_estoque(organization_id, empresa, tipo_logistico, marketplace) WHERE ativo = true;

-- RLS Policies
ALTER TABLE public.mapeamento_locais_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mapeamento locais: select org"
ON public.mapeamento_locais_estoque
FOR SELECT
USING (organization_id = get_current_org_id());

CREATE POLICY "Mapeamento locais: mutate org"
ON public.mapeamento_locais_estoque
FOR ALL
USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Trigger para updated_at
CREATE TRIGGER update_mapeamento_locais_estoque_updated_at
BEFORE UPDATE ON public.mapeamento_locais_estoque
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna local_estoque_id na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS local_estoque_id UUID REFERENCES public.locais_estoque(id);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_local_estoque ON public.pedidos(local_estoque_id);

-- Função para aplicar mapeamento automaticamente
CREATE OR REPLACE FUNCTION public.aplicar_mapeamento_local_estoque(
  p_pedido_id UUID
) RETURNS UUID AS $$
DECLARE
  v_empresa TEXT;
  v_tipo_logistico TEXT;
  v_marketplace TEXT;
  v_local_id UUID;
  v_org_id UUID;
BEGIN
  -- Buscar dados do pedido
  SELECT 
    empresa,
    COALESCE(logistic_type, 'Padrão'),
    COALESCE(
      CASE 
        WHEN integration_account_id IN (
          SELECT id FROM integration_accounts WHERE provider = 'mercadolivre'
        ) THEN 'Mercado Livre'
        WHEN integration_account_id IN (
          SELECT id FROM integration_accounts WHERE provider = 'shopee'
        ) THEN 'Shopee'
        WHEN integration_account_id IN (
          SELECT id FROM integration_accounts WHERE provider = 'tiny'
        ) THEN 'Tiny'
        ELSE 'Interno'
      END,
      'Interno'
    ),
    organization_id
  INTO v_empresa, v_tipo_logistico, v_marketplace, v_org_id
  FROM pedidos
  WHERE id = p_pedido_id;
  
  -- Buscar mapeamento
  SELECT local_estoque_id
  INTO v_local_id
  FROM mapeamento_locais_estoque
  WHERE organization_id = v_org_id
    AND empresa = v_empresa
    AND tipo_logistico = v_tipo_logistico
    AND marketplace = v_marketplace
    AND ativo = true
  LIMIT 1;
  
  -- Atualizar pedido se encontrou mapeamento
  IF v_local_id IS NOT NULL THEN
    UPDATE pedidos
    SET local_estoque_id = v_local_id
    WHERE id = p_pedido_id;
  END IF;
  
  RETURN v_local_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;