-- Just fix the user without dealing with configurations for now
DO $$
DECLARE
  existing_user_id uuid := '8607407f-fd66-48e9-ac22-39ca13a00c3c';
  new_org_id uuid;
BEGIN
  -- Create organization for the existing user
  INSERT INTO public.organizacoes (nome, plano)
  VALUES ('teste shopee - Empresa', 'basico')
  RETURNING id INTO new_org_id;
  
  -- Update user profile with organization
  UPDATE public.profiles 
  SET organizacao_id = new_org_id,
      updated_at = now()
  WHERE id = existing_user_id;
  
  -- Create admin role and assign all permissions
  PERFORM public.seed_admin_role_for_org(new_org_id, existing_user_id);
END
$$;