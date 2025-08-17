-- Security fix: Block access to historico_vendas_safe view completely
-- The secure pattern is to use get_historico_vendas_masked() RPC function instead

-- Drop the unsafe historico_vendas_safe view if it exists
DROP VIEW IF EXISTS public.historico_vendas_safe;

-- Create a comment explaining the security decision
COMMENT ON FUNCTION public.get_historico_vendas_masked IS 'Secure access to sales history with organization filtering and PII masking. Use this instead of direct table access.';

-- Ensure the main historico_vendas table has proper RLS blocking
-- (This should already be in place from previous migrations)
DO $$
BEGIN
  -- Verify RLS is enabled on historico_vendas
  IF NOT (SELECT pg_class.relrowsecurity FROM pg_class WHERE relname = 'historico_vendas' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;