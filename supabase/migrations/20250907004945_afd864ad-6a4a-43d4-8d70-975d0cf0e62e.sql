-- Complete security enhancement for customer data protection
-- Drop existing functions first
DROP FUNCTION IF EXISTS public.mask_name(text);
DROP FUNCTION IF EXISTS public.mask_phone(text);

-- 1. Create enhanced masking function for names
CREATE OR REPLACE FUNCTION public.mask_name(input_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF input_name IS NULL OR trim(input_name) = '' THEN
    RETURN input_name;
  END IF;
  
  DECLARE
    name_parts text[];
    first_name text;
    masked_name text;
  BEGIN
    name_parts := string_to_array(trim(input_name), ' ');
    
    IF array_length(name_parts, 1) = 1 THEN
      -- Single name: show first 2 chars
      RETURN left(name_parts[1], 2) || repeat('*', greatest(length(name_parts[1]) - 2, 1));
    ELSE
      -- Multiple names: show first name + masked last name
      first_name := name_parts[1];
      masked_name := first_name || ' ' || left(name_parts[array_length(name_parts, 1)], 1) || repeat('*', greatest(length(name_parts[array_length(name_parts, 1)]) - 1, 1));
      RETURN masked_name;
    END IF;
  END;
END;
$$;

-- 2. Enhanced phone masking function
CREATE OR REPLACE FUNCTION public.mask_phone(input_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN input_phone IS NULL OR length(trim(input_phone)) < 4 THEN input_phone
    ELSE '****' || right(trim(input_phone), 4)
  END;
$$;

-- 3. Enhanced RLS policy for clientes table with additional security checks
DROP POLICY IF EXISTS "clientes_read_with_permissions" ON public.clientes;
DROP POLICY IF EXISTS "clientes_enhanced_read_security" ON public.clientes;

CREATE POLICY "clientes_enhanced_read_security" 
ON public.clientes 
FOR SELECT 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('customers:read')
  -- Additional security: ensure user has been active recently
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND last_sign_in_at > (now() - interval '30 days')
  )
);

-- 4. Create function to audit customer data access
CREATE OR REPLACE FUNCTION public.log_customer_access(
  customer_id uuid,
  access_type text DEFAULT 'view',
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    new_values,
    source_function
  ) VALUES (
    public.get_current_org_id(),
    auth.uid(),
    access_type,
    'customer',
    customer_id::text,
    details,
    'customer_access_audit'
  );
EXCEPTION 
  WHEN OTHERS THEN
    -- Don't fail if audit logging fails
    NULL;
END;
$$;

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.log_customer_access(uuid, text, jsonb) TO authenticated;