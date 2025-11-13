-- =====================================================
-- SECURITY FIX: Últimas funções complexas
-- =====================================================

CREATE OR REPLACE FUNCTION public.seed_admin_role_for_org(_org_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  admin_role_id uuid;
BEGIN
  INSERT INTO public.roles (organization_id, name, slug, is_system)
  VALUES (_org_id, 'Administrador', 'admin', true)
  ON CONFLICT (organization_id, slug) DO NOTHING;

  SELECT id INTO admin_role_id FROM public.roles WHERE organization_id = _org_id AND slug = 'admin';

  INSERT INTO public.role_permissions (role_id, permission_key)
  SELECT admin_role_id, ap.key FROM public.app_permissions ap
  ON CONFLICT (role_id, permission_key) DO NOTHING;

  INSERT INTO public.user_role_assignments (user_id, role_id, organization_id)
  VALUES (_user_id, admin_role_id, _org_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.complete_onboarding(org_nome text, org_cnpj text, user_nome text, user_cargo text, tiny_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  new_org_id UUID;
  result JSON;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN '{"error": "Usuário não autenticado"}'::JSON;
  END IF;

  INSERT INTO public.organizacoes (nome, cnpj, plano)
  VALUES (org_nome, NULLIF(org_cnpj, ''), 'basico')
  RETURNING id INTO new_org_id;

  UPDATE public.profiles 
  SET nome_completo = user_nome,
      cargo = user_cargo,
      organizacao_id = new_org_id,
      updated_at = now()
  WHERE id = current_user_id;

  DELETE FROM public.configuracoes 
  WHERE organization_id = new_org_id 
    AND chave IN ('alertas_email', 'onboarding_completo');

  INSERT INTO public.configuracoes (organization_id, chave, valor, tipo) VALUES
  (new_org_id, 'alertas_email', 'true', 'boolean'),
  (new_org_id, 'onboarding_completo', 'true', 'boolean');

  PERFORM public.seed_admin_role_for_org(new_org_id, current_user_id);

  result := json_build_object(
    'success', true,
    'organizacao_id', new_org_id,
    'user_id', current_user_id
  );
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'detail', SQLSTATE);
END; $$;

CREATE OR REPLACE FUNCTION public.log_customer_data_access(p_customer_id uuid, p_action text DEFAULT 'view'::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_has_sensitive_access boolean;
BEGIN
  v_has_sensitive_access := public.can_view_sensitive_customer_data();
  
  PERFORM public.log_security_access(
    'cliente', 
    p_customer_id::text, 
    p_action || (CASE WHEN v_has_sensitive_access THEN '_full' ELSE '_masked' END),
    v_has_sensitive_access
  );
EXCEPTION WHEN OTHERS THEN NULL;
END; $$;

COMMENT ON FUNCTION public.seed_admin_role_for_org(uuid, uuid) IS 'Cria role admin para organização. SET search_path = public.';
COMMENT ON FUNCTION public.complete_onboarding(text, text, text, text, text) IS 'Completa onboarding do usuário. SET search_path = public.';
COMMENT ON FUNCTION public.log_customer_data_access(uuid, text) IS 'Log de acesso a dados de clientes. SET search_path = public.';