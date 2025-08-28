-- Conceder acesso total (Admin) ao usuário por e-mail
DO $$
DECLARE
  v_email text := 'nildoreiz@hotmail.com';
  v_user_id uuid;
  v_org_id uuid;
  v_role_id uuid;
BEGIN
  -- 1) Encontrar usuário pelo e-mail
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE lower(email) = lower(v_email)
  LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com e-mail % não encontrado', v_email;
  END IF;

  -- 2) Garantir que o usuário tem uma organização
  SELECT organizacao_id INTO v_org_id 
  FROM public.profiles 
  WHERE id = v_user_id;

  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM public.organizacoes ORDER BY created_at LIMIT 1;
    IF v_org_id IS NULL THEN
      INSERT INTO public.organizacoes (nome, plano, ativo)
      VALUES ('Organização Principal', 'basico', true)
      RETURNING id INTO v_org_id;
    END IF;
    UPDATE public.profiles 
    SET organizacao_id = v_org_id, updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- 3) Encontrar ou criar o cargo administrador/super admin da org
  SELECT id INTO v_role_id 
  FROM public.roles 
  WHERE organization_id = v_org_id AND slug = 'super_admin' 
  LIMIT 1;

  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id 
    FROM public.roles 
    WHERE organization_id = v_org_id AND slug = 'admin' 
    LIMIT 1;
  END IF;

  IF v_role_id IS NULL THEN
    -- Tentar criar via função segura que já concede permissões
    PERFORM public.seed_admin_role_for_org(v_org_id, v_user_id);

    SELECT id INTO v_role_id 
    FROM public.roles 
    WHERE organization_id = v_org_id AND slug IN ('super_admin','admin')
    ORDER BY slug
    LIMIT 1;
  END IF;

  IF v_role_id IS NULL THEN
    -- Fallback: criar Super Admin diretamente
    INSERT INTO public.roles (organization_id, name, slug, is_system)
    VALUES (v_org_id, 'Super Admin', 'super_admin', true)
    ON CONFLICT (organization_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_role_id;
  END IF;

  -- 4) Garantir TODAS as permissões nesse cargo
  INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT v_role_id, ap.key
  FROM public.app_permissions ap
  ON CONFLICT (role_id, permission_key) DO NOTHING;

  -- 5) Atribuir o cargo ao usuário
  INSERT INTO public.user_role_assignments (user_id, role_id, organization_id)
  VALUES (v_user_id, v_role_id, v_org_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;