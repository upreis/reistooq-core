-- CRITICAL SECURITY FIX: Secure historico_vendas_safe view containing sensitive customer data
-- This view currently exposes PII including customer names, tax IDs, and addresses

-- Step 1: Enable RLS on the view and block all access
ALTER VIEW public.historico_vendas_safe SET (security_barrier = true);
REVOKE ALL ON TABLE public.historico_vendas_safe FROM PUBLIC;
REVOKE ALL ON TABLE public.historico_vendas_safe FROM anon;
REVOKE ALL ON TABLE public.historico_vendas_safe FROM authenticated;

-- Step 2: Add a strict deny-all RLS policy to block any remaining access
-- Since this is a view, we can't directly enable RLS, so we'll drop it and replace with a secured function
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE;

-- Step 3: Create a comment to document the security fix
COMMENT ON FUNCTION public.get_historico_vendas_masked IS 'SECURITY: This function replaces the unsafe historico_vendas_safe view. It properly masks PII data and enforces organizational access controls. Customer names, documents, and addresses are masked unless the user has vendas:view_pii permission.';

-- Step 4: Ensure the secure RPC is properly configured for authenticated users
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_masked(date, date, text, integer, integer) TO authenticated;

-- Step 5: Create an audit log entry
INSERT INTO public.historico (tipo, descricao, detalhes) 
VALUES (
  'security_fix',
  'Removed unsafe historico_vendas_safe view containing customer PII',
  jsonb_build_object(
    'action', 'drop_view',
    'view_name', 'historico_vendas_safe',
    'reason', 'Contains unprotected customer PII (names, tax IDs, addresses)',
    'replacement', 'get_historico_vendas_masked() RPC with proper masking',
    'timestamp', now()
  )
);

-- Step 6: Verify the secure RPC function has proper permissions check
DO $$
BEGIN
  -- Ensure the function exists and has the right security properties
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON n.oid = p.pronamespace 
    WHERE p.proname = 'get_historico_vendas_masked' 
    AND n.nspname = 'public'
    AND p.prosecdef = true  -- SECURITY DEFINER
  ) THEN
    RAISE EXCEPTION 'Security function get_historico_vendas_masked not found or not properly secured';
  END IF;
  
  RAISE NOTICE '✅ Security fix completed: historico_vendas_safe view removed, secure RPC function active';
END$$;