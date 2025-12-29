-- Adicionar coluna para indicar que o pedido foi atualizado recentemente
ALTER TABLE public.pedidos_shopee 
ADD COLUMN IF NOT EXISTS foi_atualizado boolean DEFAULT false;

-- Adicionar coluna para armazenar dados da versão anterior (para comparação)
ALTER TABLE public.pedidos_shopee 
ADD COLUMN IF NOT EXISTS dados_versao_anterior jsonb DEFAULT NULL;

-- Adicionar coluna para contar quantas vezes foi atualizado
ALTER TABLE public.pedidos_shopee 
ADD COLUMN IF NOT EXISTS contador_atualizacoes integer DEFAULT 0;

-- Criar índice para buscar pedidos atualizados recentemente
CREATE INDEX IF NOT EXISTS idx_pedidos_shopee_foi_atualizado 
ON public.pedidos_shopee(foi_atualizado) 
WHERE foi_atualizado = true;

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_pedidos_shopee_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pedidos_shopee_updated_at ON public.pedidos_shopee;
CREATE TRIGGER trigger_update_pedidos_shopee_updated_at
BEFORE UPDATE ON public.pedidos_shopee
FOR EACH ROW
EXECUTE FUNCTION public.update_pedidos_shopee_updated_at();