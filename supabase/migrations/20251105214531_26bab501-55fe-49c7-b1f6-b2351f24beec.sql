-- ============================================
-- CORREÇÃO CRÍTICA: Mapeamento de Locais
-- ============================================

-- 1. DROPAR função problemática
DROP FUNCTION IF EXISTS public.aplicar_mapeamento_local_estoque(UUID);

-- 2. CRIAR função corrigida com search_path e lógica segura
CREATE OR REPLACE FUNCTION public.aplicar_mapeamento_local_estoque(
  p_pedido_id UUID
) RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_empresa TEXT;
  v_tipo_logistico TEXT;
  v_marketplace TEXT;
  v_local_id UUID;
  v_org_id UUID;
  v_integration_account_id UUID;
BEGIN
  -- Buscar dados do pedido (sem usar integration_accounts diretamente)
  SELECT 
    empresa,
    COALESCE(logistic_type, 'Padrão'),
    organization_id,
    integration_account_id
  INTO v_empresa, v_tipo_logistico, v_org_id, v_integration_account_id
  FROM pedidos
  WHERE id = p_pedido_id;
  
  -- Se não encontrou pedido, retornar NULL
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Detectar marketplace baseado em integration_account_id
  -- Usando função segura que já existe no sistema
  IF v_integration_account_id IS NOT NULL THEN
    -- Buscar provider da conta de integração de forma segura
    SELECT 
      CASE 
        WHEN provider = 'mercadolivre' THEN 'Mercado Livre'
        WHEN provider = 'shopee' THEN 'Shopee'
        WHEN provider = 'tiny' THEN 'Tiny'
        ELSE 'Outro'
      END
    INTO v_marketplace
    FROM integration_accounts
    WHERE id = v_integration_account_id
    AND organization_id = v_org_id;
    
    -- Se não encontrou ou deu erro RLS, usar fallback
    IF v_marketplace IS NULL THEN
      v_marketplace := 'Interno';
    END IF;
  ELSE
    v_marketplace := 'Interno';
  END IF;
  
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
    SET local_estoque_id = v_local_id,
        updated_at = now()
    WHERE id = p_pedido_id;
  END IF;
  
  RETURN v_local_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falhar
    RAISE WARNING 'Erro ao aplicar mapeamento local estoque para pedido %: %', p_pedido_id, SQLERRM;
    RETURN NULL;
END;
$$;

-- 3. CRIAR coluna para cache do marketplace (evitar lookups constantes)
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS marketplace_origem TEXT;

-- 4. CRIAR índice para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_marketplace ON public.pedidos(marketplace_origem) WHERE marketplace_origem IS NOT NULL;

-- 5. CRIAR função helper para detectar marketplace de forma segura
CREATE OR REPLACE FUNCTION public.detectar_marketplace_pedido(
  p_integration_account_id UUID,
  p_organization_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_provider TEXT;
BEGIN
  -- Pedidos internos
  IF p_integration_account_id IS NULL THEN
    RETURN 'Interno';
  END IF;
  
  -- Buscar provider
  SELECT provider INTO v_provider
  FROM integration_accounts
  WHERE id = p_integration_account_id
  AND organization_id = p_organization_id;
  
  -- Mapear para nome amigável
  RETURN CASE 
    WHEN v_provider = 'mercadolivre' THEN 'Mercado Livre'
    WHEN v_provider = 'shopee' THEN 'Shopee'
    WHEN v_provider = 'tiny' THEN 'Tiny'
    ELSE COALESCE(v_provider, 'Interno')
  END;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback seguro
    RETURN 'Interno';
END;
$$;

-- 6. CRIAR RLS policy segura para integration_accounts (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'integration_accounts' 
    AND policyname = 'integration_accounts_org_read'
  ) THEN
    CREATE POLICY "integration_accounts_org_read"
    ON public.integration_accounts
    FOR SELECT
    USING (organization_id = get_current_org_id());
  END IF;
END
$$;

-- 7. COMENTÁRIOS de documentação
COMMENT ON FUNCTION public.aplicar_mapeamento_local_estoque(UUID) IS 
'Aplica mapeamento de local de estoque automaticamente para um pedido baseado em: Empresa + Tipo Logístico + Marketplace. Retorna o local_estoque_id ou NULL se não houver mapeamento.';

COMMENT ON FUNCTION public.detectar_marketplace_pedido(UUID, UUID) IS 
'Detecta o marketplace de origem de um pedido de forma segura (Mercado Livre, Shopee, Tiny ou Interno).';

COMMENT ON TABLE public.mapeamento_locais_estoque IS 
'Regras de mapeamento: Empresa + Tipo Logístico + Marketplace → Local de Estoque. Aplicado automaticamente aos pedidos.';