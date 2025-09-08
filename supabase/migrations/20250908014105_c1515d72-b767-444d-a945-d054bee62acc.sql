-- Fix: Drop conflicting RPC function to resolve PostgREST ambiguity (PGRST203)
-- This fixes the "Could not choose the best candidate function" error 300

DROP FUNCTION IF EXISTS public.get_pedidos_masked(date, date, text, integer, integer);

-- Keep only the canonical signature: get_pedidos_masked(text, date, date, integer, integer)
-- This function already exists, we just removed the conflicting overload