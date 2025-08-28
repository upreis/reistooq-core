-- Garantir que existe uma organização e criar Super Admin
DO $$
DECLARE
  org_id uuid;
  super_admin_role_id uuid;
  perm_key text;
  first_user_id uuid;
BEGIN
  -- Buscar a primeira organização ativa, ou criar uma se não existir
  SELECT id INTO org_id FROM public.organizacoes WHERE ativo = true ORDER BY created_at LIMIT 1;
  
  IF org_id IS NULL THEN
    INSERT INTO public.organizacoes (nome, plano, ativo)
    VALUES ('Organização Principal', 'premium', true)
    RETURNING id INTO org_id;
  END IF;
  
  -- Buscar o primeiro usuário da organização ou qualquer usuário se não houver
  SELECT id INTO first_user_id 
  FROM public.profiles 
  WHERE organizacao_id = org_id 
  ORDER BY created_at 
  LIMIT 1;
  
  -- Se não encontrou usuário na org, pegar o primeiro usuário registrado
  IF first_user_id IS NULL THEN
    SELECT id INTO first_user_id FROM public.profiles ORDER BY created_at LIMIT 1;
    
    -- Atualizar o usuário para pertencer à organização
    IF first_user_id IS NOT NULL THEN
      UPDATE public.profiles SET organizacao_id = org_id WHERE id = first_user_id;
    END IF;
  END IF;
  
  -- Se ainda não tem usuário, não pode continuar
  IF first_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado para atribuir Super Admin';
  END IF;
  
  -- Criar o cargo Super Admin
  INSERT INTO public.roles (organization_id, name, slug, is_system)
  VALUES (org_id, 'Super Admin', 'super_admin', true)
  ON CONFLICT (organization_id, slug) 
  DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO super_admin_role_id;
  
  -- Se não conseguiu retornar o ID, buscar o existente
  IF super_admin_role_id IS NULL THEN
    SELECT id INTO super_admin_role_id 
    FROM public.roles 
    WHERE organization_id = org_id AND slug = 'super_admin';
  END IF;
  
  -- Limpar permissões antigas do cargo
  DELETE FROM public.role_permissions WHERE role_id = super_admin_role_id;
  
  -- Adicionar TODAS as permissões ao Super Admin
  FOR perm_key IN SELECT key FROM public.app_permissions
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_key)
    VALUES (super_admin_role_id, perm_key)
    ON CONFLICT (role_id, permission_key) DO NOTHING;
  END LOOP;
  
  -- Limpar atribuições antigas do usuário
  DELETE FROM public.user_role_assignments WHERE user_id = first_user_id;
  
  -- Atribuir Super Admin ao usuário
  INSERT INTO public.user_role_assignments (user_id, role_id, organization_id)
  VALUES (first_user_id, super_admin_role_id, org_id);
  
  -- Log da operação
  RAISE NOTICE 'Super Admin criado! Organização: %, Usuário: %, Role: %', org_id, first_user_id, super_admin_role_id;
END $$;