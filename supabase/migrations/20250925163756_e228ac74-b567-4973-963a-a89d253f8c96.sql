-- Adicionar novas colunas para produtos com campos de logística e importação
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS imagem_fornecedor TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS cor TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS package TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS pcs_ctn INTEGER DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS peso_unitario_g DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS peso_cx_master_kg DECIMAL(10,3) DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS comprimento_cm DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS largura_cm DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS altura_cm DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Comentários para documentar os campos calculados
COMMENT ON COLUMN public.produtos.peso_unitario_g IS 'Peso unitário em gramas';
COMMENT ON COLUMN public.produtos.peso_cx_master_kg IS 'Peso da caixa master em KG';
COMMENT ON COLUMN public.produtos.comprimento_cm IS 'Comprimento em centímetros';
COMMENT ON COLUMN public.produtos.largura_cm IS 'Largura em centímetros';
COMMENT ON COLUMN public.produtos.altura_cm IS 'Altura em centímetros';
COMMENT ON COLUMN public.produtos.pcs_ctn IS 'Peças por caixa (PCS/CTN)';

-- Criar função para calcular campos derivados automaticamente
CREATE OR REPLACE FUNCTION public.calculate_product_logistics_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Os campos calculados serão calculados no frontend para maior flexibilidade
  -- mas podemos adicionar validações aqui se necessário
  
  -- Garantir que valores não sejam negativos
  NEW.peso_unitario_g := GREATEST(COALESCE(NEW.peso_unitario_g, 0), 0);
  NEW.peso_cx_master_kg := GREATEST(COALESCE(NEW.peso_cx_master_kg, 0), 0);
  NEW.comprimento_cm := GREATEST(COALESCE(NEW.comprimento_cm, 0), 0);
  NEW.largura_cm := GREATEST(COALESCE(NEW.largura_cm, 0), 0);
  NEW.altura_cm := GREATEST(COALESCE(NEW.altura_cm, 0), 0);
  NEW.pcs_ctn := GREATEST(COALESCE(NEW.pcs_ctn, 0), 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS calculate_logistics_trigger ON public.produtos;
CREATE TRIGGER calculate_logistics_trigger
  BEFORE INSERT OR UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_product_logistics_fields();