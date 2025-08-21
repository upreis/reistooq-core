-- Create RPC ensure_current_org for organizational robustness
CREATE OR REPLACE FUNCTION public.ensure_current_org()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_id uuid;
  org_id uuid;
  created_org boolean := false;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  -- Check if user already has an organization
  SELECT organizacao_id INTO org_id FROM public.profiles WHERE id = user_id;
  
  IF org_id IS NULL THEN
    -- Create default organization for user
    INSERT INTO public.organizacoes (nome, plano, ativo)
    VALUES (
      'Organização Principal',
      'basico',
      true
    )
    RETURNING id INTO org_id;
    
    -- Update user profile
    UPDATE public.profiles 
    SET organizacao_id = org_id, updated_at = now()
    WHERE id = user_id;
    
    -- Create admin role for user
    PERFORM public.seed_admin_role_for_org(org_id, user_id);
    
    created_org := true;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'organization_id', org_id,
    'created_org', created_org
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;