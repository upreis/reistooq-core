
-- Função para validar se email pode receber convite (bloqueia se já está em outra organização)
CREATE OR REPLACE FUNCTION public.validate_invitation_email(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_org uuid;
  target_user_id uuid;
  target_org_id uuid;
  target_org_name text;
BEGIN
  -- Get current user's organization
  SELECT organizacao_id INTO current_org FROM public.profiles WHERE id = auth.uid();

  -- Check if email exists in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = p_email;

  IF target_user_id IS NULL THEN
    -- Email not registered, safe to invite
    RETURN json_build_object('valid', true, 'message', 'Email available for invitation');
  END IF;

  -- User exists, check their organization
  SELECT p.organizacao_id, o.nome INTO target_org_id, target_org_name
  FROM public.profiles p
  LEFT JOIN public.organizacoes o ON o.id = p.organizacao_id
  WHERE p.id = target_user_id;

  IF target_org_id IS NULL THEN
    -- User exists but has no organization, safe to invite
    RETURN json_build_object('valid', true, 'message', 'User exists without organization, can be invited');
  END IF;

  IF target_org_id = current_org THEN
    -- User already in same organization
    RETURN json_build_object(
      'valid', false, 
      'error', 'Este e-mail já pertence a um usuário da sua organização'
    );
  END IF;

  -- User belongs to another organization
  RETURN json_build_object(
    'valid', false, 
    'error', 'Este e-mail já está vinculado a outra organização no sistema'
  );
END;
$$;
