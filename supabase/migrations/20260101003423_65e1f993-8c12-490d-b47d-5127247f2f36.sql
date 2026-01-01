-- Atualizar função create_invitation para suportar username ao invés de email
CREATE OR REPLACE FUNCTION public.create_invitation_with_username(
  _username TEXT,
  _role_id UUID,
  _expires_in_days INTEGER DEFAULT 7
)
RETURNS public.invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_role_org UUID;
  v_inv public.invitations%ROWTYPE;
  v_invited_by UUID;
  v_password TEXT;
  v_generated_email TEXT;
  v_org_slug TEXT;
BEGIN
  -- Ensure authenticated user
  v_invited_by := auth.uid();
  IF v_invited_by IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Get current organization id
  v_org_id := public.get_current_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada para o usuário atual';
  END IF;

  -- Validate username format
  IF NOT validate_username(_username) THEN
    RAISE EXCEPTION 'Nome de usuário inválido. Use 3-30 caracteres, começando com letra.';
  END IF;

  -- Get organization slug
  SELECT slug INTO v_org_slug FROM organizacoes WHERE id = v_org_id;
  IF v_org_slug IS NULL THEN
    RAISE EXCEPTION 'Organização não possui slug configurado';
  END IF;

  -- Check if username already exists in same organization
  IF EXISTS (SELECT 1 FROM profiles WHERE username = _username AND organizacao_id = v_org_id) THEN
    RAISE EXCEPTION 'Este nome de usuário já existe na organização';
  END IF;

  -- Check for pending invitation with same username
  IF EXISTS (SELECT 1 FROM invitations WHERE username = _username AND organization_id = v_org_id AND status = 'pending') THEN
    RAISE EXCEPTION 'Já existe um convite pendente para este nome de usuário';
  END IF;

  -- Validate role belongs to the same organization
  SELECT organization_id INTO v_role_org FROM public.roles WHERE id = _role_id;
  IF v_role_org IS NULL OR v_role_org <> v_org_id THEN
    RAISE EXCEPTION 'Cargo inválido para a organização atual';
  END IF;

  -- Generate a synthetic email for auth.users (required by Supabase Auth)
  v_generated_email := v_org_slug || '.' || _username || '@interno.local';

  -- Generate random password (8 chars)
  v_password := substr(md5(random()::text), 1, 8);

  -- Insert invitation with username
  INSERT INTO public.invitations (
    username,
    email,
    role_id,
    organization_id,
    token,
    status,
    expires_at,
    invited_by,
    created_at
  ) VALUES (
    lower(btrim(_username)),
    v_generated_email,
    _role_id,
    v_org_id,
    gen_random_uuid(),
    'pending',
    now() + make_interval(days => GREATEST(1, COALESCE(_expires_in_days, 1))),
    v_invited_by,
    now()
  ) RETURNING * INTO v_inv;

  RETURN v_inv;
END;
$$;

-- Função para buscar slug da organização atual
CREATE OR REPLACE FUNCTION public.get_current_org_slug()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_slug TEXT;
BEGIN
  v_org_id := public.get_current_org_id();
  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT slug INTO v_slug FROM organizacoes WHERE id = v_org_id;
  RETURN v_slug;
END;
$$;