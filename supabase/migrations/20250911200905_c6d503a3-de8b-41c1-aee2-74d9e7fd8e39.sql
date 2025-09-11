-- Fix Security Definer View Issues
-- Remove views that may be triggering security warnings and replace with direct table access

-- Drop potentially problematic views
DROP VIEW IF EXISTS public.profiles_safe CASCADE;
DROP VIEW IF EXISTS public.historico_vendas_safe CASCADE; 
DROP VIEW IF EXISTS public.clientes_safe CASCADE;

-- Instead of views, we'll rely on direct table access with proper RLS policies
-- The views were not actually needed since RLS policies already handle security

-- Add comments to document the security approach
COMMENT ON TABLE public.profiles IS 'Secure access via RLS policies - no SECURITY DEFINER views needed';
COMMENT ON TABLE public.historico_vendas IS 'Secure access via RLS policies - no SECURITY DEFINER views needed';
COMMENT ON TABLE public.clientes IS 'Secure access via RLS policies - no SECURITY DEFINER views needed';