-- Drop and recreate the function to fix return type issue
DROP FUNCTION IF EXISTS public.create_invitation(text, uuid, integer);

-- Recreate the invitation creation function
CREATE OR REPLACE FUNCTION public.create_invitation(
  _email text,
  _role_id uuid,
  _expires_in_days integer DEFAULT 7
)
RETURNS public.invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
  v_role_org uuid;
  v_inv public.invitations%ROWTYPE;
BEGIN
  -- Get current organization id
  v_org_id := public.get_current_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada para o usuário atual';
  END IF;

  -- Validate role belongs to the same organization
  SELECT organization_id INTO v_role_org FROM public.roles WHERE id = _role_id;
  IF v_role_org IS NULL OR v_role_org <> v_org_id THEN
    RAISE EXCEPTION 'Cargo inválido para a organização atual';
  END IF;

  -- Insert invitation
  INSERT INTO public.invitations (
    email,
    role_id,
    organization_id,
    token,
    status,
    expires_at,
    created_at
  ) VALUES (
    lower(btrim(_email)),
    _role_id,
    v_org_id,
    gen_random_uuid(),
    'pending',
    now() + make_interval(days => GREATEST(1, COALESCE(_expires_in_days, 1))),
    now()
  ) RETURNING * INTO v_inv;

  RETURN v_inv;
END;
$function$;