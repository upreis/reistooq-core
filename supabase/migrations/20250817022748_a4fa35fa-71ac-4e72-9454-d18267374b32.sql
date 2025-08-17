-- Secure access to historico_vendas_safe by revoking direct selects and enforcing RPC-only access
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'historico_vendas_safe'
      AND n.nspname = 'public'
      AND c.relkind IN ('v', 'm')
  ) THEN
    RAISE NOTICE 'Securing view public.historico_vendas_safe: revoking all privileges';
    REVOKE ALL ON TABLE public.historico_vendas_safe FROM PUBLIC;
    -- Best-effort revokes for common roles
    BEGIN
      REVOKE ALL ON TABLE public.historico_vendas_safe FROM anon;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    BEGIN
      REVOKE ALL ON TABLE public.historico_vendas_safe FROM authenticated;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    COMMENT ON VIEW public.historico_vendas_safe IS 'Deprecated and access-restricted. Use RPC public.get_historico_vendas_masked(_start,_end,_search,_limit,_offset).';
  END IF;
END$$;

-- Ensure authenticated clients can execute the secure RPC
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_masked(date, date, text, integer, integer) TO authenticated;