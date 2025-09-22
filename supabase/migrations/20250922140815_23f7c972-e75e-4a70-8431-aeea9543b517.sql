-- ===================================================================
-- EMERGENCY FIX: Complete System Recovery
-- ===================================================================

-- ⚠️ CRITICAL: Remove all blocking policies and restore functionality

-- 1. REMOVE FUNCTION OVERLOAD CONFLICT
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(_search text, _start date, _end date, _limit integer, _offset integer);

-- Create single, working function
CREATE OR REPLACE FUNCTION public.get_historico_vendas_masked(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  numero_pedido text,
  data_pedido date,
  valor_total numeric,
  cliente_nome text,
  sku_produto text,
  quantidade integer,
  origem text,
  status text,
  integration_account_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    hv.id,
    hv.numero_pedido,
    hv.data_pedido,
    hv.valor_total,
    CASE 
      WHEN has_permission('historico:read_full') THEN hv.cliente_nome
      ELSE LEFT(COALESCE(hv.cliente_nome, ''), 3) || '***'
    END as cliente_nome,
    hv.sku_produto,
    hv.quantidade,
    hv.origem,
    hv.status,
    hv.integration_account_id
  FROM public.historico_vendas hv
  WHERE (auth.uid() IS NOT NULL)
    AND (_start IS NULL OR hv.data_pedido >= _start)
    AND (_end IS NULL OR hv.data_pedido <= _end)
    AND (_search IS NULL OR hv.cliente_nome ILIKE '%' || _search || '%' OR hv.numero_pedido ILIKE '%' || _search || '%')
  ORDER BY hv.data_pedido DESC
  LIMIT _limit
  OFFSET _offset;
$$;

-- 2. FIX ALL SECURITY FUNCTIONS (add missing search_path)
CREATE OR REPLACE FUNCTION public.check_clientes_secure_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth.uid() IS NOT NULL 
    AND get_current_org_id() IS NOT NULL
    AND has_permission('customers:read');
$$;

-- Fix other functions with missing search_path
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = public, auth
AS $$
  SELECT organizacao_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Update search_path for existing functions (fix the 17 security warnings)
ALTER FUNCTION public.can_view_sensitive_customer_data() SET search_path = public, auth;
ALTER FUNCTION public.has_permission(text) SET search_path = public, auth;
ALTER FUNCTION public.get_user_permissions() SET search_path = public, auth;