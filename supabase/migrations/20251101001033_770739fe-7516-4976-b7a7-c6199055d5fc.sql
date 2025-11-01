-- ============================================
-- SISTEMA DE MÚLTIPLOS LOCAIS DE ESTOQUE
-- ============================================

-- 1. Tabela de Locais de Estoque
CREATE TABLE IF NOT EXISTS public.locais_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'principal',
  endereco TEXT,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT locais_estoque_tipo_check CHECK (tipo IN ('principal', 'fullfilment_ml', 'fullfilment_shopee', 'filial', 'outro'))
);

-- Index para performance
CREATE INDEX idx_locais_estoque_org ON public.locais_estoque(organization_id);
CREATE INDEX idx_locais_estoque_ativo ON public.locais_estoque(ativo) WHERE ativo = true;

-- RLS Policies
ALTER TABLE public.locais_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locais_estoque_select_org" ON public.locais_estoque
  FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "locais_estoque_insert_org" ON public.locais_estoque
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "locais_estoque_update_org" ON public.locais_estoque
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "locais_estoque_delete_org" ON public.locais_estoque
  FOR DELETE USING (organization_id = get_current_org_id());

-- Trigger para updated_at
CREATE TRIGGER update_locais_estoque_updated_at
  BEFORE UPDATE ON public.locais_estoque
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabela de Estoque por Local
CREATE TABLE IF NOT EXISTS public.estoque_por_local (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  local_id UUID NOT NULL REFERENCES public.locais_estoque(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 0,
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT estoque_por_local_quantidade_check CHECK (quantidade >= 0),
  CONSTRAINT estoque_por_local_unique UNIQUE (produto_id, local_id)
);

-- Indexes para performance
CREATE INDEX idx_estoque_por_local_produto ON public.estoque_por_local(produto_id);
CREATE INDEX idx_estoque_por_local_local ON public.estoque_por_local(local_id);
CREATE INDEX idx_estoque_por_local_org ON public.estoque_por_local(organization_id);

-- RLS Policies
ALTER TABLE public.estoque_por_local ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estoque_por_local_select_org" ON public.estoque_por_local
  FOR SELECT USING (organization_id = get_current_org_id());

CREATE POLICY "estoque_por_local_insert_org" ON public.estoque_por_local
  FOR INSERT WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "estoque_por_local_update_org" ON public.estoque_por_local
  FOR UPDATE USING (organization_id = get_current_org_id());

CREATE POLICY "estoque_por_local_delete_org" ON public.estoque_por_local
  FOR DELETE USING (organization_id = get_current_org_id());

-- Trigger para updated_at
CREATE TRIGGER update_estoque_por_local_updated_at
  BEFORE UPDATE ON public.estoque_por_local
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Adicionar local_id à tabela de movimentações
ALTER TABLE public.movimentacoes_estoque 
ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES public.locais_estoque(id);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_local ON public.movimentacoes_estoque(local_id);

-- 4. Função para criar local padrão para organizações
CREATE OR REPLACE FUNCTION public.criar_local_padrao_org(p_organization_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_local_id UUID;
BEGIN
  -- Verifica se já existe local padrão
  SELECT id INTO v_local_id
  FROM public.locais_estoque
  WHERE organization_id = p_organization_id
    AND tipo = 'principal'
  LIMIT 1;
  
  -- Se não existe, cria
  IF v_local_id IS NULL THEN
    INSERT INTO public.locais_estoque (
      organization_id,
      nome,
      tipo,
      descricao,
      ativo
    ) VALUES (
      p_organization_id,
      'Estoque Principal',
      'principal',
      'Local de estoque padrão criado automaticamente',
      true
    )
    RETURNING id INTO v_local_id;
  END IF;
  
  RETURN v_local_id;
END;
$$;

-- 5. Função para migrar estoque atual para sistema de locais
CREATE OR REPLACE FUNCTION public.migrar_estoque_para_locais()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org RECORD;
  v_produto RECORD;
  v_local_id UUID;
  v_total_migrados INTEGER := 0;
  v_total_criados INTEGER := 0;
BEGIN
  -- Para cada organização
  FOR v_org IN 
    SELECT DISTINCT organization_id 
    FROM public.produtos 
    WHERE organization_id IS NOT NULL
  LOOP
    -- Criar ou obter local padrão
    v_local_id := public.criar_local_padrao_org(v_org.organization_id);
    v_total_criados := v_total_criados + 1;
    
    -- Migrar produtos desta organização
    FOR v_produto IN
      SELECT id, organization_id, quantidade_atual
      FROM public.produtos
      WHERE organization_id = v_org.organization_id
        AND ativo = true
    LOOP
      -- Inserir no estoque_por_local se não existir
      INSERT INTO public.estoque_por_local (
        produto_id,
        local_id,
        quantidade,
        organization_id
      ) VALUES (
        v_produto.id,
        v_local_id,
        COALESCE(v_produto.quantidade_atual, 0),
        v_produto.organization_id
      )
      ON CONFLICT (produto_id, local_id) DO NOTHING;
      
      v_total_migrados := v_total_migrados + 1;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'locais_criados', v_total_criados,
    'produtos_migrados', v_total_migrados,
    'sucesso', true
  );
END;
$$;

-- 6. Executar migração inicial
SELECT public.migrar_estoque_para_locais();

COMMENT ON TABLE public.locais_estoque IS 'Locais de estoque (principal, fullfilment, filiais)';
COMMENT ON TABLE public.estoque_por_local IS 'Quantidade de cada produto em cada local de estoque';
COMMENT ON COLUMN public.movimentacoes_estoque.local_id IS 'Local de estoque onde ocorreu a movimentação';