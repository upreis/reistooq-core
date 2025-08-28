-- Fix ambiguous column reference in create_invitation and keep same return signature
CREATE OR REPLACE FUNCTION public.create_invitation(_email text, _role_id uuid, _expires_in_days integer DEFAULT 7)
RETURNS TABLE(id uuid, token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
  v_role_org uuid;
  v_id uuid;
  v_token uuid;
BEGIN
  IF coalesce(trim(_email), '') = '' THEN
    RAISE EXCEPTION 'E-mail é obrigatório';
  END IF;

  -- Organização atual do usuário autenticado
  v_org_id := public.get_current_org_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada para o usuário atual';
  END IF;

  -- Validar que o cargo pertence à organização
  SELECT organization_id INTO v_role_org FROM public.roles WHERE id = _role_id;
  IF v_role_org IS NULL OR v_role_org <> v_org_id THEN
    RAISE EXCEPTION 'Cargo inválido para a organização';
  END IF;

  -- Inserir convite e capturar colunas retornadas sem ambiguidades
  INSERT INTO public.invitations (email, organization_id, role_id, invited_by, expires_at)
  VALUES (lower(_email), v_org_id, _role_id, auth.uid(), now() + make_interval(days => _expires_in_days))
  RETURNING public.invitations.id, public.invitations.token INTO v_id, v_token;

  -- Atribuir aos parâmetros de saída e retornar 1 linha
  id := v_id;
  token := v_token;
  RETURN NEXT;
END;
$function$;