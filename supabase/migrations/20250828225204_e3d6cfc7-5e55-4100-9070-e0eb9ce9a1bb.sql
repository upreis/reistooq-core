-- Criar Super Admin sem triggers de auditoria
DO $$
DECLARE
  org_id uuid;
  super_admin_role_id uuid;
  perm_key text;
  first_user_id uuid;
BEGIN
  -- Desabilitar triggers de auditoria temporariamente
  ALTER TABLE public.roles DISABLE TRIGGER ALL;
  ALTER TABLE public.role_permissions DISABLE TRIGGER ALL;
  ALTER TABLE public.user_role_assignments DISABLE TRIGGER ALL;
  
  -- Buscar a primeira organização ativa
  SELECT id INTO org_id FROM public.organizacoes WHERE ativo = true ORDER BY created_at LIMIT 1;
  
  -- Se não existe organização, criar uma
  IF org_id IS NULL THEN
    INSERT INTO public.organizacoes (nome, plano, ativo)
    VALUES ('Organização Principal', 'premium', true)
    RETURNING id INTO org_id;
  END IF;
  
  -- Buscar o primeiro usuário
  SELECT id INTO first_user_id FROM public.profiles ORDER BY created_at LIMIT 1;
  
  -- Se não tem usuário, não pode continuar
  IF first_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado. É necessário ter pelo menos um usuário registrado.';
  END IF;
  
  -- Atualizar usuário para pertencer à organização
  UPDATE public.profiles SET organizacao_id = org_id WHERE id = first_user_id;
  
  -- Criar ou atualizar o cargo Super Admin
  INSERT INTO public.roles (organization_id, name, slug, is_system)
  VALUES (org_id, 'Super Admin', 'super_admin', true)
  ON CONFLICT (organization_id, slug) DO UPDATE SET 
    name = EXCLUDED.name,
    is_system = EXCLUDED.is_system
  RETURNING id INTO super_admin_role_id;
  
  -- Se não conseguiu retornar o ID, buscar o existente
  IF super_admin_role_id IS NULL THEN
    SELECT id INTO super_admin_role_id 
    FROM public.roles 
    WHERE organization_id = org_id AND slug = 'super_admin';
  END IF;
  
  -- Limpar permissões antigas
  DELETE FROM public.role_permissions WHERE role_id = super_admin_role_id;
  
  -- Adicionar TODAS as permissões
  INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT super_admin_role_id, ap.key 
  FROM public.app_permissions ap
  ON CONFLICT (role_id, permission_key) DO NOTHING;
  
  -- Limpar atribuições antigas
  DELETE FROM public.user_role_assignments WHERE user_id = first_user_id;
  
  -- Atribuir Super Admin
  INSERT INTO public.user_role_assignments (user_id, role_id, organization_id)
  VALUES (first_user_id, super_admin_role_id, org_id);
  
  -- Reabilitar triggers
  ALTER TABLE public.roles ENABLE TRIGGER ALL;
  ALTER TABLE public.role_permissions ENABLE TRIGGER ALL;
  ALTER TABLE public.user_role_assignments ENABLE TRIGGER ALL;
  
  RAISE NOTICE 'Super Admin criado com sucesso! Org: %, User: %, Role: %', org_id, first_user_id, super_admin_role_id;
END $$;