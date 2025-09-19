-- Create the missing mask_phone function that's being referenced in admin_list_profiles
CREATE OR REPLACE FUNCTION public.mask_phone(phone text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF phone IS NULL OR phone = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remove non-numeric characters
  phone := REGEXP_REPLACE(phone, '[^0-9]', '', 'g');
  
  IF LENGTH(phone) >= 8 THEN
    RETURN '****-' || RIGHT(phone, 4);
  ELSE
    RETURN '****';
  END IF;
END;
$function$;