-- =====================================================
-- SECURITY FIX: Funções finais restantes
-- =====================================================

-- Funções complexas de negócio
CREATE OR REPLACE FUNCTION public.backfill_config_for_current_org()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  org uuid;
  updated_count integer := 0;
BEGIN
  org := public.get_current_org_id();
  IF org IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;

  UPDATE public.configuracoes c
  SET organization_id = org, updated_at = now()
  WHERE c.organization_id IS NULL AND c.chave <> 'tiny_token';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN json_build_object('success', true, 'organization_id', org, 'updated', updated_count);
END; $$;

CREATE OR REPLACE FUNCTION public.fix_produtos_organization_id()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  UPDATE public.produtos
  SET organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768'
  WHERE organization_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN json_build_object('success', true, 'updated', updated_count);
END; $$;

CREATE OR REPLACE FUNCTION public.baixar_estoque_direto(p_baixas jsonb)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_sku text;
  v_quantidade int;
  v_produto record;
  v_total_processados int := 0;
  v_total_sucesso int := 0;
  v_erros jsonb := '[]'::jsonb;
  v_baixa jsonb;
BEGIN
  v_org_id := public.get_current_org_id();
  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;

  FOR v_baixa IN SELECT * FROM jsonb_array_elements(p_baixas)
  LOOP
    v_sku := v_baixa->>'sku';
    v_quantidade := COALESCE((v_baixa->>'quantidade')::int, 0);
    v_total_processados := v_total_processados + 1;
    
    IF v_sku IS NULL OR v_sku = '' THEN
      v_erros := v_erros || jsonb_build_object('sku', v_sku, 'erro', 'SKU não informado');
      CONTINUE;
    END IF;
    
    IF v_quantidade <= 0 THEN
      v_erros := v_erros || jsonb_build_object('sku', v_sku, 'erro', 'Quantidade deve ser maior que zero');
      CONTINUE;
    END IF;
    
    SELECT * INTO v_produto 
    FROM public.produtos 
    WHERE sku_interno = v_sku AND organization_id = v_org_id AND ativo = true;
    
    IF NOT FOUND THEN
      v_erros := v_erros || jsonb_build_object(
        'sku', v_sku, 
        'erro', format('SKU não cadastrado no estoque. Cadastre o produto "%s" antes de fazer a baixa.', v_sku)
      );
      CONTINUE;
    END IF;
    
    IF v_produto.quantidade_atual < v_quantidade THEN
      v_erros := v_erros || jsonb_build_object(
        'sku', v_sku, 
        'erro', format('Estoque insuficiente. Disponível: %s, Solicitado: %s', v_produto.quantidade_atual, v_quantidade)
      );
      CONTINUE;
    END IF;
    
    UPDATE public.produtos 
    SET quantidade_atual = quantidade_atual - v_quantidade, updated_at = now()
    WHERE id = v_produto.id;
    
    INSERT INTO public.movimentacoes_estoque (
      produto_id, tipo_movimentacao, quantidade_anterior, quantidade_nova, 
      quantidade_movimentada, motivo, observacoes
    ) VALUES (
      v_produto.id, 'saida', v_produto.quantidade_atual,
      v_produto.quantidade_atual - v_quantidade, v_quantidade,
      'baixa_pedido', format('Baixa automática por pedido - SKU: %s', v_sku)
    );
    
    v_total_sucesso := v_total_sucesso + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', v_total_sucesso > 0,
    'total_processados', v_total_processados,
    'total_sucesso', v_total_sucesso,
    'total_erros', v_total_processados - v_total_sucesso,
    'erros', v_erros
  );
END; $$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sensitive_data()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < now() - interval '1 hour';
  DELETE FROM public.integration_secrets_access_log WHERE created_at < now() - interval '2 years';
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '1 year';
  
  INSERT INTO public.audit_logs (organization_id, user_id, action, resource_type, resource_id)
  VALUES (NULL, NULL, 'cleanup', 'system', 'automated_cleanup');
END; $$;

CREATE OR REPLACE FUNCTION public.tiny3_get_credentials(_client_id text)
RETURNS TABLE(client_id text, client_secret text, redirect_uri text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT client_id, client_secret, redirect_uri
  FROM public.tiny_v3_credentials
  WHERE client_id = _client_id;
$$;

CREATE OR REPLACE FUNCTION public.refresh_ml_token(p_account_id uuid, p_new_access_token text, p_new_refresh_token text, p_expires_at timestamp with time zone)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_account_exists boolean := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.integration_accounts 
    WHERE id = p_account_id AND provider = 'mercadolivre' AND is_active = true
  ) INTO v_account_exists;
  
  IF NOT v_account_exists THEN
    RETURN json_build_object('success', false, 'error', 'Account not found or inactive');
  END IF;
  
  UPDATE public.integration_secrets 
  SET 
    simple_tokens = public.encrypt_simple(
      json_build_object(
        'access_token', p_new_access_token,
        'refresh_token', p_new_refresh_token,
        'expires_at', extract(epoch from p_expires_at)
      )::text
    ),
    expires_at = p_expires_at,
    updated_at = now(),
    last_accessed_at = now(),
    access_count = access_count + 1
  WHERE integration_account_id = p_account_id AND provider = 'mercadolivre';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Secret not found');
  END IF;
  
  PERFORM public.log_secret_access(p_account_id, 'mercadolivre', 'token_refresh', 'refresh_ml_token', true);
  RETURN json_build_object('success', true, 'updated_at', now());
END; $$;

CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token uuid)
RETURNS TABLE(is_valid boolean, organization_name text, role_name text, expires_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  SELECT i.*, o.nome as org_name, r.name as role_name
  INTO invite_record
  FROM public.invitations i
  JOIN public.organizacoes o ON o.id = i.organization_id
  JOIN public.roles r ON r.id = i.role_id
  WHERE i.token = _token AND i.status = 'pending' AND i.expires_at > now();
  
  IF FOUND THEN
    RETURN QUERY SELECT true, invite_record.org_name, invite_record.role_name, invite_record.expires_at;
  ELSE
    RETURN QUERY SELECT false, null::text, null::text, null::timestamp with time zone;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.validate_invitation_token_secure(p_token uuid)
RETURNS TABLE(is_valid boolean, organization_name text, role_name text, expires_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  SELECT 
    i.expires_at,
    o.nome as org_name,
    r.name as role_name,
    CASE WHEN i.status = 'pending' AND i.expires_at > now() THEN true ELSE false END as valid
  INTO invite_record
  FROM public.invitations i
  JOIN public.organizacoes o ON o.id = i.organization_id
  JOIN public.roles r ON r.id = i.role_id
  WHERE i.token = p_token;
  
  IF FOUND AND invite_record.valid THEN
    RETURN QUERY SELECT true, invite_record.org_name, invite_record.role_name, invite_record.expires_at;
  ELSE
    RETURN QUERY SELECT false, null::text, null::text, null::timestamp with time zone;
  END IF;
END; $$;

-- Comentários
COMMENT ON FUNCTION public.baixar_estoque_direto(jsonb) IS 'Baixa de estoque em lote. SET search_path = public.';
COMMENT ON FUNCTION public.cleanup_expired_sensitive_data() IS 'Limpa dados sensíveis expirados. SET search_path = public.';
COMMENT ON FUNCTION public.refresh_ml_token(uuid, text, text, timestamptz) IS 'Atualiza tokens ML. SET search_path = public.';