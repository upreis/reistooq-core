-- Criar cargo de Super Admin com todas as permissões para o usuário atual
DO $$
DECLARE
  current_user_id uuid;
  current_org_id uuid;
  super_admin_role_id uuid;
  perm_key text;
BEGIN
  -- Obter usuário e organização atual
  current_user_id := auth.uid();
  current_org_id := public.get_current_org_id();
  
  -- Criar o cargo Super Admin se não existir
  INSERT INTO public.roles (organization_id, name, slug, is_system, description)
  VALUES (current_org_id, 'Super Admin', 'super_admin', true, 'Acesso total ao sistema - poder absoluto')
  ON CONFLICT (organization_id, slug) 
  DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description
  RETURNING id INTO super_admin_role_id;
  
  -- Se não conseguiu retornar o ID, buscar o existente
  IF super_admin_role_id IS NULL THEN
    SELECT id INTO super_admin_role_id 
    FROM public.roles 
    WHERE organization_id = current_org_id AND slug = 'super_admin';
  END IF;
  
  -- Remover todas as permissões antigas do cargo (para garantir que terá todas)
  DELETE FROM public.role_permissions WHERE role_id = super_admin_role_id;
  
  -- Adicionar TODAS as permissões disponíveis ao Super Admin
  FOR perm_key IN SELECT key FROM public.app_permissions
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_key)
    VALUES (super_admin_role_id, perm_key)
    ON CONFLICT (role_id, permission_key) DO NOTHING;
  END LOOP;
  
  -- Atribuir o cargo Super Admin ao usuário atual
  INSERT INTO public.user_role_assignments (user_id, role_id, organization_id)
  VALUES (current_user_id, super_admin_role_id, current_org_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  -- Log da operação
  RAISE NOTICE 'Super Admin criado com sucesso para usuário % na organização %', current_user_id, current_org_id;
END $$;