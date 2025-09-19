-- Auto-complete onboarding for new users without organization
CREATE OR REPLACE FUNCTION public.auto_complete_onboarding_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  -- Insert initial configurations
  INSERT INTO public.configuracoes (organization_id, chave, valor, tipo) VALUES
  (new_org_id, 'alertas_email', 'true', 'boolean'),
  (new_org_id, 'onboarding_completo', 'true', 'boolean');
  
  -- Update the NEW record to return with organization_id
  NEW.organizacao_id := new_org_id;
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, nome_exibicao)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'nome_exibicao', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for auto-completing onboarding when profile is created
CREATE TRIGGER auto_complete_onboarding_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_complete_onboarding_for_new_user();