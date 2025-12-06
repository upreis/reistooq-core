
-- Fix remaining functions missing SET search_path

-- 1. Trigger functions (simples, sem parâmetros)
CREATE OR REPLACE FUNCTION public.calculate_product_logistics_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.peso_unitario_g := GREATEST(COALESCE(NEW.peso_unitario_g, 0), 0);
  NEW.peso_cx_master_kg := GREATEST(COALESCE(NEW.peso_cx_master_kg, 0), 0);
  NEW.comprimento_cm := GREATEST(COALESCE(NEW.comprimento_cm, 0), 0);
  NEW.largura_cm := GREATEST(COALESCE(NEW.largura_cm, 0), 0);
  NEW.altura_cm := GREATEST(COALESCE(NEW.altura_cm, 0), 0);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_compras_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_devolucoes_sync_status_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_ml_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_vendas_completas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE ai_chat_conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.integration_secrets_fill_orgid()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM integration_accounts
    WHERE id = NEW.integration_account_id;

    IF NEW.organization_id IS NULL THEN
      RAISE EXCEPTION 'organization_id missing for integration_account_id %', NEW.integration_account_id;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- 2. Sync functions
CREATE OR REPLACE FUNCTION public.get_last_sync_time(p_account_id uuid, p_sync_type text DEFAULT 'incremental'::text)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_last_sync TIMESTAMPTZ;
BEGIN
  SELECT last_sync_at INTO v_last_sync
  FROM public.devolucoes_sync_status
  WHERE integration_account_id = p_account_id
    AND sync_type = p_sync_type
    AND last_sync_status = 'success';
  
  RETURN COALESCE(v_last_sync, NOW() - INTERVAL '30 days');
END;
$function$;

CREATE OR REPLACE FUNCTION public.start_devolucoes_sync(p_account_id uuid, p_sync_type text DEFAULT 'incremental'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_sync_id UUID;
BEGIN
  INSERT INTO public.devolucoes_sync_status (
    integration_account_id,
    sync_type,
    last_sync_status,
    last_sync_at
  ) VALUES (
    p_account_id,
    p_sync_type,
    'running',
    NOW()
  )
  ON CONFLICT (integration_account_id, sync_type) 
  DO UPDATE SET
    last_sync_status = 'running',
    last_sync_at = NOW(),
    error_message = NULL,
    error_details = NULL,
    updated_at = NOW()
  RETURNING id INTO v_sync_id;
  
  RETURN v_sync_id;
END;
$function$;

-- 3. Fail devolucoes sync (versão com 4 parâmetros)
DROP FUNCTION IF EXISTS public.fail_devolucoes_sync(uuid, text, text, jsonb);
CREATE OR REPLACE FUNCTION public.fail_devolucoes_sync(p_account_id uuid, p_sync_type text, p_error_message text, p_error_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.devolucoes_sync_status
  SET
    last_sync_status = 'error',
    error_message = p_error_message,
    error_details = p_error_details,
    updated_at = NOW()
  WHERE integration_account_id = p_account_id
    AND sync_type = p_sync_type;
END;
$function$;

-- 4. Category function
CREATE OR REPLACE FUNCTION public.get_categorias_hierarquicas(org_id uuid)
RETURNS TABLE(id uuid, nome text, descricao text, cor text, icone text, nivel integer, categoria_principal_id uuid, categoria_id uuid, categoria_completa text, ativo boolean, ordem integer, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.nome,
    cp.descricao,
    cp.cor,
    cp.icone,
    cp.nivel,
    cp.categoria_principal_id,
    cp.categoria_id,
    cp.categoria_completa,
    cp.ativo,
    cp.ordem,
    cp.created_at,
    cp.updated_at
  FROM categorias_produtos cp
  WHERE cp.organization_id = org_id
  ORDER BY 
    CASE WHEN cp.nivel = 1 THEN cp.nome END,
    CASE WHEN cp.nivel = 2 THEN (
      SELECT nome FROM categorias_produtos WHERE id = cp.categoria_principal_id
    ) END,
    CASE WHEN cp.nivel = 2 THEN cp.nome END,
    CASE WHEN cp.nivel = 3 THEN (
      SELECT nome FROM categorias_produtos WHERE id = cp.categoria_principal_id
    ) END,
    CASE WHEN cp.nivel = 3 THEN (
      SELECT nome FROM categorias_produtos WHERE id = cp.categoria_id
    ) END,
    CASE WHEN cp.nivel = 3 THEN cp.nome END,
    cp.ordem;
END;
$function$;

-- 5. Match knowledge (vector search)
CREATE OR REPLACE FUNCTION public.match_knowledge(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5, filter_org_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(id uuid, title text, content text, source text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.source,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE 
    kb.is_active = true
    AND kb.embedding IS NOT NULL
    AND (filter_org_id IS NULL OR kb.organization_id IS NULL OR kb.organization_id = filter_org_id)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;
