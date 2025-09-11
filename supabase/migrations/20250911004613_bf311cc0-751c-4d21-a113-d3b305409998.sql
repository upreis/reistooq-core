-- Security Hardening: Drop and recreate functions with proper search_path
-- This addresses the "Function Search Path Mutable" warnings

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.mask_phone(text);
DROP FUNCTION IF EXISTS public.mask_email(text);
DROP FUNCTION IF EXISTS public.mask_name(text);
DROP FUNCTION IF EXISTS public.mask_cpf_cnpj(text);
DROP FUNCTION IF EXISTS public.log_audit_event(text, text, text, jsonb, jsonb);

-- Recreate with proper search_path
CREATE OR REPLACE FUNCTION public.mask_phone(phone_number text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF phone_number IS NULL OR length(phone_number) < 8 THEN
    RETURN phone_number;
  END IF;
  
  -- Mask middle digits: +55(11)9****-4567 or (11)9****-4567
  IF phone_number ~ '^\+?[0-9]+\([0-9]{2}\)[0-9]' THEN
    RETURN regexp_replace(phone_number, '(\+?[0-9]*\([0-9]{2}\)[0-9])[0-9]+([0-9]{4})$', '\1****-\2');
  END IF;
  
  -- Mask middle digits for simple format: 11987654321 -> 119****4321
  IF length(phone_number) >= 10 THEN
    RETURN left(phone_number, 3) || '****' || right(phone_number, 4);
  END IF;
  
  RETURN '****' || right(phone_number, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email_address text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  local_part text;
  domain_part text;
  at_position integer;
BEGIN
  IF email_address IS NULL OR email_address = '' THEN
    RETURN email_address;
  END IF;
  
  at_position := position('@' in email_address);
  
  IF at_position = 0 THEN
    RETURN email_address; -- Not a valid email format
  END IF;
  
  local_part := left(email_address, at_position - 1);
  domain_part := substring(email_address from at_position);
  
  -- Mask local part: show first 2 chars + *** + last char before @
  IF length(local_part) <= 3 THEN
    RETURN left(local_part, 1) || '***' || domain_part;
  ELSE
    RETURN left(local_part, 2) || '***' || right(local_part, 1) || domain_part;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_name(full_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  name_parts text[];
  masked_name text := '';
  i integer;
BEGIN
  IF full_name IS NULL OR full_name = '' THEN
    RETURN full_name;
  END IF;
  
  -- Split name into parts
  name_parts := string_to_array(trim(full_name), ' ');
  
  -- If only one name, mask middle characters
  IF array_length(name_parts, 1) = 1 THEN
    IF length(name_parts[1]) <= 3 THEN
      RETURN left(name_parts[1], 1) || '***';
    ELSE
      RETURN left(name_parts[1], 1) || '***' || right(name_parts[1], 1);
    END IF;
  END IF;
  
  -- Show first name + mask middle names + show last name
  FOR i IN 1..array_length(name_parts, 1) LOOP
    IF i = 1 THEN
      -- First name: show completely
      masked_name := name_parts[i];
    ELSIF i = array_length(name_parts, 1) THEN
      -- Last name: show completely
      masked_name := masked_name || ' ' || name_parts[i];
    ELSE
      -- Middle names: mask
      masked_name := masked_name || ' ' || left(name_parts[i], 1) || '***';
    END IF;
  END LOOP;
  
  RETURN masked_name;
END;
$$;

-- Enhanced security for customer data access
CREATE OR REPLACE FUNCTION public.mask_cpf_cnpj(document text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF document IS NULL OR document = '' THEN
    RETURN document;
  END IF;
  
  -- Remove formatting
  document := regexp_replace(document, '[^0-9]', '', 'g');
  
  -- CPF: 123.456.789-01 -> 123.***.**9-01
  IF length(document) = 11 THEN
    RETURN left(document, 3) || '.***.***-' || right(document, 2);
  END IF;
  
  -- CNPJ: 12.345.678/0001-01 -> 12.***.***/**01-01
  IF length(document) = 14 THEN
    RETURN left(document, 2) || '.***.***/**' || substring(document, 11, 2) || '-' || right(document, 2);
  END IF;
  
  -- Unknown format, mask middle
  IF length(document) > 4 THEN
    RETURN left(document, 2) || '***' || right(document, 2);
  END IF;
  
  RETURN '***';
END;
$$;

-- Enhanced audit logging
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    get_current_org_id(),
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values
  );
EXCEPTION 
  WHEN OTHERS THEN
    -- Log errors silently, don't fail the main operation
    NULL;
END;
$$;