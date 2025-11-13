-- =====================================================
-- SECURITY FIX: Últimas funções com search_path mutável
-- Parte 1: DROP e recriação de funções existentes
-- =====================================================

-- DROP funções que precisam mudança de assinatura
DROP FUNCTION IF EXISTS public.admin_create_customer(jsonb);
DROP FUNCTION IF EXISTS public.admin_update_customer(uuid, jsonb);
DROP FUNCTION IF EXISTS public.admin_delete_customer(uuid);
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, jsonb);
DROP FUNCTION IF EXISTS public.enqueue_background_job(text, text, text, jsonb, integer);
DROP FUNCTION IF EXISTS public.get_next_background_job();
DROP FUNCTION IF EXISTS public.complete_background_job(uuid, text);
DROP FUNCTION IF EXISTS public.create_invitation_safe(text, uuid, integer);
DROP FUNCTION IF EXISTS public.delete_invitation_safe(uuid);

-- Recriar funções de gestão de clientes com dados sensíveis
CREATE FUNCTION public.admin_create_customer(p_customer jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  new_customer_id uuid;
BEGIN
  v_org_id := public.get_current_org_id();
  IF NOT public.has_permission('customers:write') THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  INSERT INTO public.clientes (
    nome_completo, email, telefone, cpf_cnpj, empresa,
    endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep,
    observacoes, organization_id
  ) VALUES (
    p_customer->>'nome_completo', p_customer->>'email', p_customer->>'telefone', 
    p_customer->>'cpf_cnpj', p_customer->>'empresa',
    p_customer->>'endereco_rua', p_customer->>'endereco_numero', p_customer->>'endereco_bairro', 
    p_customer->>'endereco_cidade', p_customer->>'endereco_uf', p_customer->>'endereco_cep',
    p_customer->>'observacoes', v_org_id
  ) RETURNING id INTO new_customer_id;

  PERFORM public.log_customer_data_access(new_customer_id, 'create');
  RETURN new_customer_id;
END; $$;

CREATE FUNCTION public.admin_update_customer(p_customer_id uuid, p_customer jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := public.get_current_org_id();
  IF NOT public.has_permission('customers:write') THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  UPDATE public.clientes SET
    nome_completo = COALESCE(p_customer->>'nome_completo', nome_completo),
    email = COALESCE(p_customer->>'email', email),
    telefone = COALESCE(p_customer->>'telefone', telefone),
    cpf_cnpj = COALESCE(p_customer->>'cpf_cnpj', cpf_cnpj),
    empresa = COALESCE(p_customer->>'empresa', empresa),
    updated_at = now()
  WHERE id = p_customer_id AND organization_id = v_org_id;

  PERFORM public.log_customer_data_access(p_customer_id, 'update');
  RETURN FOUND;
END; $$;

CREATE FUNCTION public.admin_delete_customer(p_customer_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := public.get_current_org_id();
  IF NOT public.has_permission('customers:delete') THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  PERFORM public.log_customer_data_access(p_customer_id, 'delete');
  DELETE FROM public.clientes WHERE id = p_customer_id AND organization_id = v_org_id;
  RETURN FOUND;
END; $$;

CREATE FUNCTION public.admin_update_profile(p_user_id uuid, p_updates jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_permission('users:write') THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  UPDATE public.profiles SET
    nome_completo = COALESCE(p_updates->>'nome_completo', nome_completo),
    nome_exibicao = COALESCE(p_updates->>'nome_exibicao', nome_exibicao),
    telefone = COALESCE(p_updates->>'telefone', telefone),
    cargo = COALESCE(p_updates->>'cargo', cargo),
    departamento = COALESCE(p_updates->>'departamento', departamento),
    updated_at = now()
  WHERE id = p_user_id AND organizacao_id = public.get_current_org_id();

  RETURN FOUND;
END; $$;

-- Funções de background jobs
CREATE FUNCTION public.enqueue_background_job(
  p_job_type text,
  p_resource_type text,
  p_resource_id text,
  p_metadata jsonb DEFAULT NULL,
  p_priority integer DEFAULT 5
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  job_id uuid;
BEGIN
  INSERT INTO public.background_jobs (
    job_type, resource_type, resource_id, metadata, priority, status
  ) VALUES (
    p_job_type, p_resource_type, p_resource_id, p_metadata, p_priority, 'pending'
  ) RETURNING id INTO job_id;

  RETURN job_id;
END; $$;

CREATE FUNCTION public.get_next_background_job()
RETURNS public.background_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_job public.background_jobs;
BEGIN
  SELECT * INTO v_job FROM public.background_jobs
  WHERE status = 'pending' AND (scheduled_at IS NULL OR scheduled_at <= now())
  ORDER BY priority DESC, created_at ASC
  LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    UPDATE public.background_jobs SET status = 'processing', started_at = now() WHERE id = v_job.id;
  END IF;

  RETURN v_job;
END; $$;

CREATE FUNCTION public.complete_background_job(p_job_id uuid, p_error_message text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.background_jobs SET
    status = CASE WHEN p_error_message IS NULL THEN 'completed' ELSE 'failed' END,
    completed_at = now(),
    error_message = p_error_message
  WHERE id = p_job_id;
END; $$;

COMMENT ON FUNCTION public.admin_create_customer(jsonb) IS 'Cria cliente. SET search_path = public.';
COMMENT ON FUNCTION public.admin_update_customer(uuid, jsonb) IS 'Atualiza cliente. SET search_path = public.';
COMMENT ON FUNCTION public.admin_delete_customer(uuid) IS 'Deleta cliente. SET search_path = public.';
COMMENT ON FUNCTION public.admin_update_profile(uuid, jsonb) IS 'Atualiza perfil. SET search_path = public.';
COMMENT ON FUNCTION public.enqueue_background_job(text, text, text, jsonb, integer) IS 'Enfileira job. SET search_path = public.';
COMMENT ON FUNCTION public.get_next_background_job() IS 'Próximo job. SET search_path = public.';
COMMENT ON FUNCTION public.complete_background_job(uuid, text) IS 'Completa job. SET search_path = public.';