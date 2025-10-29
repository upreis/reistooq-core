-- ✅ CORRIGIR FUNÇÃO DE AUTO-ONBOARDING PARA EVITAR ERRO DE CHAVE DUPLICADA
-- Problema: A função tenta inserir configurações sem verificar se já existem

CREATE OR REPLACE FUNCTION public.auto_complete_onboarding_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_org_id uuid;
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := NEW.id;
  
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
  
  -- Check if user already has an organization
  IF NEW.organizacao_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Create organization for the user
  INSERT INTO public.organizacoes (nome, plano)
  VALUES (COALESCE(NEW.nome_completo, user_email, 'Minha Empresa'), 'basico')
  RETURNING id INTO new_org_id;
  
  -- Update user profile with organization
  UPDATE public.profiles 
  SET organizacao_id = new_org_id,
      updated_at = now()
  WHERE id = current_user_id;
  
  -- Create admin role and assign all permissions
  PERFORM public.seed_admin_role_for_org(new_org_id, current_user_id);
  
  -- ✅ CORRIGIDO: Limpar configurações existentes antes de inserir novas
  DELETE FROM public.configuracoes 
  WHERE organization_id = new_org_id 
    AND chave IN ('alertas_email', 'onboarding_completo');
  
  -- Insert initial configurations
  INSERT INTO public.configuracoes (organization_id, chave, valor, tipo) VALUES
  (new_org_id, 'alertas_email', 'true', 'boolean'),
  (new_org_id, 'onboarding_completo', 'true', 'boolean');
  
  -- Update the NEW record to return with organization_id
  NEW.organizacao_id := new_org_id;
  
  RETURN NEW;
END;
$function$;