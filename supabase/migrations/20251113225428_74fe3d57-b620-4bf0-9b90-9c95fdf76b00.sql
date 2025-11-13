-- =====================================================
-- SECURITY FIX: Adicionar SET search_path nas funções antigas
-- =====================================================

-- Funções de trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_ml_devolucoes_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_unified_orders_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_fila_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_cotacoes_arquivos_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.calcular_dias_restantes_acao()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.data_vencimento_acao IS NOT NULL THEN
    NEW.dias_restantes_acao := EXTRACT(DAY FROM (NEW.data_vencimento_acao - NOW()));
  END IF;
  RETURN NEW;
END; $$;

-- Funções de organization_id
CREATE OR REPLACE FUNCTION public.set_mapeamentos_organization()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = public.get_current_org_id();
  END IF;
  RETURN NEW;
END; $$;

-- Funções de migração/manutenção
CREATE OR REPLACE FUNCTION public.migrate_existing_orders_to_unified()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  migrated_count integer := 0;
  ml_count integer := 0;
BEGIN
  INSERT INTO public.unified_orders (
    provider, integration_account_id, organization_id, order_id, order_status,
    date_created, total_amount, currency, customer_name, items, raw_data,
    created_at, updated_at
  )
  SELECT 
    'mercadolivre'::text, integration_account_id, organization_id, order_id, status,
    date_created, total_amount, currency, buyer_nickname,
    jsonb_build_array(jsonb_build_object(
      'title', item_title, 'quantity', quantity,
      'sku', COALESCE(raw_data->'order_items'->0->'item'->>'seller_sku', ''),
      'unit_price', total_amount
    )),
    raw_data, created_at, updated_at
  FROM public.ml_orders_completas
  WHERE NOT EXISTS (
    SELECT 1 FROM public.unified_orders uo 
    WHERE uo.provider = 'mercadolivre' 
    AND uo.order_id = ml_orders_completas.order_id
  );
  
  GET DIAGNOSTICS ml_count = ROW_COUNT;
  migrated_count := migrated_count + ml_count;
  
  RETURN json_build_object(
    'success', true,
    'migrated_total', migrated_count,
    'mercadolivre_orders', ml_count
  );
END; $$;

-- Função de alertas
CREATE OR REPLACE FUNCTION public.verificar_alertas_tempo_real()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  alertas_ativados boolean := false;
  intervalo_minutos integer := 60;
BEGIN
  SELECT (valor = 'true') INTO alertas_ativados
  FROM public.configuracoes 
  WHERE chave = 'alertas_automaticos';
  
  SELECT valor::integer INTO intervalo_minutos
  FROM public.configuracoes 
  WHERE chave = 'intervalo_alertas';
  
  IF alertas_ativados AND intervalo_minutos = 0 THEN
    IF (NEW.quantidade_atual = 0 OR NEW.quantidade_atual <= NEW.estoque_minimo) 
       AND (OLD.quantidade_atual > NEW.estoque_minimo OR OLD.quantidade_atual > 0) THEN
      
      PERFORM net.http_post(
        url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/alertas-estoque',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
        body := format('{"trigger": "real_time", "produto_id": "%s"}', NEW.id)::jsonb
      );
    END IF;
  END IF;
  
  RETURN NEW;
END; $$;

-- Recriar revoke_invitation completa
CREATE OR REPLACE FUNCTION public.revoke_invitation(_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := public.get_current_org_id();
  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Organização não encontrada');
  END IF;

  UPDATE public.invitations
  SET status = 'revoked'
  WHERE id = _id AND organization_id = v_org_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Convite não encontrado ou já processado');
  END IF;
  
  RETURN json_build_object('success', true);
END; $$;

-- Comentários
COMMENT ON FUNCTION public.update_ml_devolucoes_updated_at() IS 'Trigger: atualiza updated_at. Protegido com SET search_path.';
COMMENT ON FUNCTION public.update_unified_orders_updated_at() IS 'Trigger: atualiza updated_at. Protegido com SET search_path.';
COMMENT ON FUNCTION public.update_fila_updated_at() IS 'Trigger: atualiza atualizado_em. Protegido com SET search_path.';
COMMENT ON FUNCTION public.verificar_alertas_tempo_real() IS 'Dispara alertas quando estoque baixo. Protegido com SET search_path.';
COMMENT ON FUNCTION public.migrate_existing_orders_to_unified() IS 'Migra pedidos ML para unified_orders. Protegido com SET search_path.';