-- Fix Function Search Path Mutable warnings
-- Add SET search_path = public to functions that are missing it

-- Fix mask_phone function
CREATE OR REPLACE FUNCTION public.mask_phone(txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN txt IS NULL THEN NULL ELSE '****' || right(txt, 4) END
$$;

-- Fix enforce_encrypted_secrets_only function (just created)
CREATE OR REPLACE FUNCTION public.enforce_encrypted_secrets_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure all secrets must be encrypted via secret_enc column
  IF NEW.secret_enc IS NULL THEN
    RAISE EXCEPTION 'All integration secrets must be encrypted. Use Edge Functions with encrypt_integration_secret.';
  END IF;
  
  -- Nullify any legacy plaintext columns to prevent accidental exposure
  NEW.access_token := NULL;
  NEW.refresh_token := NULL;
  
  RETURN NEW;
END;
$$;

-- Fix any other functions that might be missing search_path
-- Update the user_matches_announcement function if it exists
CREATE OR REPLACE FUNCTION public.user_matches_announcement(target_users uuid[], target_roles uuid[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN target_users IS NOT NULL AND auth.uid() = ANY(target_users) THEN true
      WHEN target_roles IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_role_assignments ura 
        WHERE ura.user_id = auth.uid() 
        AND ura.role_id = ANY(target_roles)
      ) THEN true
      WHEN target_users IS NULL AND target_roles IS NULL THEN true
      ELSE false
    END
$$;

-- Fix the verify_view_security function if it exists  
CREATE OR REPLACE FUNCTION public.verify_view_security()
RETURNS TABLE(view_name text, is_security_definer boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.relname::text as view_name,
    CASE 
      WHEN c.relkind = 'v' AND pg_has_role(c.relowner, 'USAGE') THEN
        EXISTS (
          SELECT 1 FROM pg_rewrite r 
          WHERE r.ev_class = c.oid 
          AND r.ev_type = '1'
        )
      ELSE false
    END as is_security_definer
  FROM pg_class c
  WHERE c.relkind = 'v'
  AND c.relname IN ('profiles_safe', 'historico_vendas_safe', 'clientes_safe')
$$;

-- Additional security: Create a mask_name function for PII protection
CREATE OR REPLACE FUNCTION public.mask_name(full_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN full_name IS NULL THEN NULL
      WHEN length(trim(full_name)) <= 2 THEN full_name
      ELSE left(trim(full_name), 1) || repeat('*', greatest(length(trim(full_name)) - 2, 1)) || right(trim(full_name), 1)
    END
$$;