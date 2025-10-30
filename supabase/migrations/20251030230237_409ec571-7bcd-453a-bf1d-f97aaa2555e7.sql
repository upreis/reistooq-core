-- ============================================
-- 📦 COMPOSIÇÕES DE INSUMOS
-- Sistema para insumos debitados 1x por pedido
-- ============================================

-- 1. Criar tabela composicoes_insumos
CREATE TABLE IF NOT EXISTS public.composicoes_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  
  -- SKU do produto final
  sku_produto TEXT NOT NULL,
  
  -- SKU do insumo (deve existir em produtos)
  sku_insumo TEXT NOT NULL,
  
  -- Quantidade fixa (sempre 1 por pedido)
  quantidade INTEGER NOT NULL DEFAULT 1,
  
  -- Metadados
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT composicoes_insumos_org_sku_insumo_unique 
    UNIQUE (organization_id, sku_produto, sku_insumo),
  
  CONSTRAINT composicoes_insumos_quantidade_positiva 
    CHECK (quantidade > 0)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_composicoes_insumos_org 
  ON public.composicoes_insumos(organization_id);

CREATE INDEX IF NOT EXISTS idx_composicoes_insumos_sku_produto 
  ON public.composicoes_insumos(sku_produto);

CREATE INDEX IF NOT EXISTS idx_composicoes_insumos_sku_insumo 
  ON public.composicoes_insumos(sku_insumo);

-- 3. Habilitar RLS
ALTER TABLE public.composicoes_insumos ENABLE ROW LEVEL SECURITY;

-- 4. Criar policies RLS
CREATE POLICY "Users can view insumos from their org"
  ON public.composicoes_insumos FOR SELECT
  USING (organization_id = public.get_current_org_id());

CREATE POLICY "Users can insert insumos in their org"
  ON public.composicoes_insumos FOR INSERT
  WITH CHECK (organization_id = public.get_current_org_id());

CREATE POLICY "Users can update insumos in their org"
  ON public.composicoes_insumos FOR UPDATE
  USING (organization_id = public.get_current_org_id());

CREATE POLICY "Users can delete insumos in their org"
  ON public.composicoes_insumos FOR DELETE
  USING (organization_id = public.get_current_org_id());

-- 5. Criar trigger para updated_at
CREATE TRIGGER update_composicoes_insumos_updated_at
  BEFORE UPDATE ON public.composicoes_insumos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Criar função RPC para baixar insumos de pedido
CREATE OR REPLACE FUNCTION public.baixar_insumos_pedido(p_insumos jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_sku text;
  v_produto record;
  v_total_processados int := 0;
  v_total_sucesso int := 0;
  v_erros jsonb := '[]'::jsonb;
  v_insumo jsonb;
BEGIN
  v_org_id := public.get_current_org_id();
  
  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;

  -- Processar cada insumo (sempre quantidade = 1)
  FOR v_insumo IN SELECT * FROM jsonb_array_elements(p_insumos)
  LOOP
    v_sku := v_insumo->>'sku';
    v_total_processados := v_total_processados + 1;
    
    IF v_sku IS NULL OR v_sku = '' THEN
      v_erros := v_erros || jsonb_build_object('sku', v_sku, 'erro', 'SKU não informado');
      CONTINUE;
    END IF;
    
    -- Buscar produto (insumo no estoque)
    SELECT * INTO v_produto 
    FROM public.produtos 
    WHERE sku_interno = v_sku 
      AND organization_id = v_org_id 
      AND ativo = true;
    
    IF NOT FOUND THEN
      v_erros := v_erros || jsonb_build_object(
        'sku', v_sku, 
        'erro', format('Insumo "%s" não cadastrado no estoque', v_sku)
      );
      CONTINUE;
    END IF;
    
    -- Verificar estoque
    IF v_produto.quantidade_atual < 1 THEN
      v_erros := v_erros || jsonb_build_object(
        'sku', v_sku, 
        'erro', format('Estoque insuficiente para insumo "%s". Disponível: %s', v_sku, v_produto.quantidade_atual)
      );
      CONTINUE;
    END IF;
    
    -- Baixar 1 unidade
    UPDATE public.produtos 
    SET quantidade_atual = quantidade_atual - 1,
        updated_at = now()
    WHERE id = v_produto.id;
    
    -- Registrar movimentação
    INSERT INTO public.movimentacoes_estoque (
      produto_id, 
      tipo_movimentacao, 
      quantidade_anterior, 
      quantidade_nova, 
      quantidade_movimentada,
      motivo,
      observacoes
    ) VALUES (
      v_produto.id,
      'saida',
      v_produto.quantidade_atual,
      v_produto.quantidade_atual - 1,
      1,
      'baixa_insumo_pedido',
      format('Baixa de insumo por pedido - SKU: %s', v_sku)
    );
    
    v_total_sucesso := v_total_sucesso + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', v_total_sucesso > 0,
    'total_processados', v_total_processados,
    'total_sucesso', v_total_sucesso,
    'total_erros', v_total_processados - v_total_sucesso,
    'erros', v_erros
  );
END;
$$;