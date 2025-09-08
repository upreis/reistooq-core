-- Fix: remove RPC overload causing PostgREST ambiguity (PGRST203)
-- Keep the canonical version: get_pedidos_masked(_search, _start, _end, _limit, _offset)
-- Drop the conflicting overload: get_pedidos_masked(_start, _end, _search, _limit, _offset)

DO $$
BEGIN
  -- Drop only if that overloaded signature exists
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_pedidos_masked'
      AND p.oid = 'public.get_pedidos_masked(date, date, text, integer, integer)'::regprocedure
  ) THEN
    EXECUTE 'DROP FUNCTION public.get_pedidos_masked(date, date, text, integer, integer)';
  END IF;
END$$;

-- Safety check: ensure the canonical function exists (do NOT recreate if already there)
-- Signature: public.get_pedidos_masked(text, date, date, integer, integer)
-- If missing for any reason, (re)create it exactly as expected
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_pedidos_masked'
      AND p.oid = 'public.get_pedidos_masked(text, date, date, integer, integer)'::regprocedure
  ) THEN
    EXECUTE $$
    CREATE OR REPLACE FUNCTION public.get_pedidos_masked(
      _search text DEFAULT NULL::text,
      _start date DEFAULT NULL::date,
      _end date DEFAULT NULL::date,
      _limit integer DEFAULT 100,
      _offset integer DEFAULT 0
    )
    RETURNS TABLE(
      id text,
      numero text,
      nome_cliente text,
      cpf_cnpj text,
      data_pedido date,
      situacao text,
      valor_total numeric,
      valor_frete numeric,
      valor_desconto numeric,
      numero_ecommerce text,
      numero_venda text,
      empresa text,
      cidade text,
      uf text,
      obs text,
      integration_account_id uuid,
      created_at timestamp with time zone,
      updated_at timestamp with time zone
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    BEGIN
      RETURN QUERY
      SELECT 
        p.id,
        p.numero,
        p.nome_cliente,
        p.cpf_cnpj,
        p.data_pedido,
        p.situacao,
        p.valor_total,
        p.valor_frete,
        p.valor_desconto,
        p.numero_ecommerce,
        p.numero_venda,
        p.empresa,
        p.cidade,
        p.uf,
        p.obs,
        p.integration_account_id,
        p.created_at,
        p.updated_at
      FROM public.pedidos p
      JOIN public.integration_accounts ia ON ia.id = p.integration_account_id
      WHERE ia.organization_id = public.get_current_org_id()
        AND public.has_permission('orders:read')
        AND (_search IS NULL OR (
          p.numero ILIKE '%' || _search || '%' OR
          p.nome_cliente ILIKE '%' || _search || '%' OR
          p.cpf_cnpj ILIKE '%' || _search || '%'
        ))
        AND (_start IS NULL OR p.data_pedido >= _start)
        AND (_end IS NULL OR p.data_pedido <= _end)
      ORDER BY p.created_at DESC
      LIMIT COALESCE(_limit, 100)
      OFFSET COALESCE(_offset, 0);
    END;
    $function$;
    $$;
  END IF;
END$$;