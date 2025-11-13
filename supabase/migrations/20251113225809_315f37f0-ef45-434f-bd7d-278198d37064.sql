-- =====================================================
-- SECURITY FIX FINAL: Últimas 19 funções sem SET search_path
-- =====================================================

-- 1. Funções de trigger
CREATE OR REPLACE FUNCTION public.update_sync_control_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_roles_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 2. Organization setters
CREATE OR REPLACE FUNCTION public.set_produtos_composicoes_organization()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = public.get_current_org_id();
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.set_produtos_organization()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = public.get_current_org_id();
  END IF;
  RETURN NEW;
END; $$;

-- 3. Helpers e utilities
CREATE OR REPLACE FUNCTION public.get_current_sales_rep_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT sr.id 
  FROM public.oms_sales_reps sr
  INNER JOIN auth.users u ON u.email = sr.email
  WHERE u.id = auth.uid() AND sr.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organizacao_id 
  FROM public.profiles 
  WHERE id = _user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(permission_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT permission_key = ANY(public.get_user_permissions());
$$;

-- 4. Queue e monitoring
CREATE OR REPLACE FUNCTION public.get_queue_status()
RETURNS TABLE(total_pending bigint, total_processing bigint, total_completed bigint, total_failed bigint, oldest_pending timestamp with time zone)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as total_pending,
    COUNT(*) FILTER (WHERE status = 'processing') as total_processing,
    COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
    COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
    MIN(criado_em) FILTER (WHERE status = 'pending') as oldest_pending
  FROM public.fila_processamento_claims;
$$;

CREATE OR REPLACE FUNCTION public.get_data_quality_metrics()
RETURNS TABLE(total bigint, sync_24h bigint, sync_7d bigint, pct_review numeric, pct_comunicacao numeric, pct_deadlines numeric, pct_acoes numeric, pct_custos numeric, pct_fulfillment numeric, alertas_criticos bigint, com_excelente bigint, com_boa bigint, com_moderada bigint, com_ruim bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN ultima_sincronizacao > NOW() - INTERVAL '24 hours' THEN 1 END) as sync_24h,
    COUNT(CASE WHEN ultima_sincronizacao > NOW() - INTERVAL '7 days' THEN 1 END) as sync_7d,
    ROUND(COUNT(dados_review)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_review,
    ROUND(COUNT(dados_comunicacao)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_comunicacao,
    ROUND(COUNT(dados_deadlines)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_deadlines,
    ROUND(COUNT(dados_acoes_disponiveis)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_acoes,
    ROUND(COUNT(dados_custos_logistica)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_custos,
    ROUND(COUNT(dados_fulfillment)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_fulfillment,
    COUNT(CASE WHEN dados_deadlines IS NOT NULL AND (
      (dados_deadlines->>'is_shipment_critical')::boolean = true OR 
      (dados_deadlines->>'is_review_critical')::boolean = true
    ) THEN 1 END) as alertas_criticos,
    COUNT(CASE WHEN dados_comunicacao->>'communication_quality' = 'excellent' THEN 1 END) as com_excelente,
    COUNT(CASE WHEN dados_comunicacao->>'communication_quality' = 'good' THEN 1 END) as com_boa,
    COUNT(CASE WHEN dados_comunicacao->>'communication_quality' = 'moderate' THEN 1 END) as com_moderada,
    COUNT(CASE WHEN dados_comunicacao->>'communication_quality' = 'poor' THEN 1 END) as com_ruim
  FROM public.devolucoes_avancadas
  WHERE integration_account_id IN (
    SELECT id FROM public.integration_accounts 
    WHERE organization_id = public.get_current_org_id()
  );
$$;

-- 5. Business logic functions
CREATE OR REPLACE FUNCTION public.ensure_single_main_image()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.principal = true THEN
    UPDATE public.produto_imagens 
    SET principal = false 
    WHERE produto_id = NEW.produto_id AND id != NEW.id AND principal = true;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.gerar_sku_automatico(org_id uuid, prefixo text DEFAULT 'PROD'::text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  numero_sequencia integer;
  novo_sku text;
BEGIN
  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(sku_interno, '^' || prefixo || '-', '') AS INTEGER)), 0) + 1
  INTO numero_sequencia
  FROM public.produtos 
  WHERE organization_id = org_id 
  AND sku_interno ~ ('^' || prefixo || '-[0-9]+$');
  
  novo_sku := prefixo || '-' || LPAD(numero_sequencia::text, 6, '0');
  RETURN novo_sku;
END; $$;

CREATE OR REPLACE FUNCTION public.gerar_numero_pedido_compra()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  org_id uuid;
  contador int;
  numero_pedido text;
BEGIN
  org_id := public.get_current_org_id();
  
  IF org_id IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM 'PC-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
    INTO contador
    FROM public.pedidos_compra 
    WHERE numero_pedido ~ '^PC-[0-9]{4}-[0-9]+$';
  ELSE
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM 'PC-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
    INTO contador
    FROM public.pedidos_compra 
    WHERE organization_id = org_id AND numero_pedido ~ '^PC-[0-9]{4}-[0-9]+$';
  END IF;
  
  numero_pedido := 'PC-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(contador::text, 3, '0');
  RETURN numero_pedido;
END; $$;

CREATE OR REPLACE FUNCTION public.sincronizar_componentes_em_uso()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.componentes_em_uso 
  WHERE organization_id = public.get_current_org_id();
  
  INSERT INTO public.componentes_em_uso (
    sku_componente, sku_produto_composicao, nome_produto_composicao, 
    quantidade_necessaria, organization_id
  )
  SELECT DISTINCT
    pc.sku_componente,
    pc.sku_produto,
    COALESCE(pcomp.nome, pc.sku_produto) as nome_produto,
    pc.quantidade,
    public.get_current_org_id()
  FROM public.produto_componentes pc
  LEFT JOIN public.produtos_composicoes pcomp ON pcomp.sku_interno = pc.sku_produto 
    AND pcomp.organization_id = public.get_current_org_id()
  WHERE EXISTS (
    SELECT 1 FROM public.produtos p 
    WHERE p.sku_interno = pc.sku_componente 
      AND p.organization_id = public.get_current_org_id()
  );
END; $$;

-- 6. Security e audit
CREATE OR REPLACE FUNCTION public.integration_secrets_prevent_plaintext()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.secret_enc IS NULL THEN
    RAISE EXCEPTION 'All integration secrets must be encrypted. Use the encrypt_integration_secret function.';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.log_secret_access(p_account_id uuid, p_provider text, p_action text, p_function text DEFAULT NULL::text, p_success boolean DEFAULT false, p_error text DEFAULT NULL::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.integration_secrets_access_log (
    integration_account_id, provider, action, requesting_function,
    user_id, success, error_message
  ) VALUES (
    p_account_id, p_provider, p_action, p_function,
    auth.uid(), p_success, p_error
  );
EXCEPTION WHEN OTHERS THEN NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.log_security_access(p_resource_type text, p_resource_id text, p_action text, p_sensitive_data boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id, user_id, action, resource_type, resource_id, new_values
  ) VALUES (
    public.get_current_org_id(), auth.uid(), p_action, p_resource_type, p_resource_id,
    jsonb_build_object('sensitive_data_accessed', p_sensitive_data)
  );
EXCEPTION WHEN OTHERS THEN NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.registrar_historico_depara()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historico_depara (mapeamento_id, acao, valores_novos, usuario_id)
    VALUES (NEW.id, 'criacao', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.historico_depara (mapeamento_id, acao, valores_anteriores, valores_novos, usuario_id)
    VALUES (NEW.id, 'edicao', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.historico_depara (mapeamento_id, acao, valores_anteriores, usuario_id)
    VALUES (OLD.id, 'exclusao', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.detect_devolucao_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  campos_alterados jsonb := '[]'::jsonb;
  campo_nome text;
  campos_monitorados text[] := ARRAY[
    'status_devolucao', 'valor_retido', 'em_mediacao', 'claim_fulfilled',
    'status_rastreamento', 'transportadora', 'codigo_rastreamento',
    'metodo_resolucao', 'resultado_final', 'review_status', 'review_result',
    'ultima_mensagem_data', 'data_fechamento_devolucao'
  ];
BEGIN
  FOREACH campo_nome IN ARRAY campos_monitorados
  LOOP
    IF (to_jsonb(OLD) -> campo_nome) IS DISTINCT FROM (to_jsonb(NEW) -> campo_nome) THEN
      campos_alterados := campos_alterados || jsonb_build_object(
        'campo', campo_nome,
        'valor_anterior', to_jsonb(OLD) -> campo_nome,
        'valor_novo', to_jsonb(NEW) -> campo_nome,
        'data_mudanca', now()
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(campos_alterados) > 0 THEN
    NEW.campos_atualizados := campos_alterados;
    NEW.ultima_atualizacao_real := now();
    NEW.snapshot_anterior := to_jsonb(OLD);
  END IF;

  RETURN NEW;
END; $$;

-- Comentários
COMMENT ON FUNCTION public.update_sync_control_updated_at() IS 'Trigger updated_at. SET search_path = public.';
COMMENT ON FUNCTION public.gerar_sku_automatico(uuid, text) IS 'Gera SKU sequencial. SET search_path = public.';
COMMENT ON FUNCTION public.integration_secrets_prevent_plaintext() IS 'Valida secrets criptografados. SET search_path = public.';
COMMENT ON FUNCTION public.log_secret_access(uuid, text, text, text, boolean, text) IS 'Log acesso secrets. SET search_path = public.';
COMMENT ON FUNCTION public.detect_devolucao_changes() IS 'Detecta mudanças em devoluções. SET search_path = public.';